"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Chapter = {
  chapterId: string;
  views: string;
  uploaded: string;
  timestamp: string;
};

type MangaCard = {
  id: string;
  title: string;
  imageUrl: string;
};

type MangaDetails = {
  id: string;
  title: string;
  imageUrl: string;
  author: string;
  status: string;
  lastUpdated: string;
  views: string;
  genres: string[];
  rating: string;
  chapters: Chapter[];
};

const Details = () => {
  const { id } = useParams<{ id: string }>();
  const [manga, setManga] = useState<MangaDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Sorting & Pagination states
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 10;

  // Recommendations
  const [recommendations, setRecommendations] = useState<MangaCard[]>([]);

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/proxy?url=/api/manga/${id}`);
        const data = await res.json();
        setManga(data);
      } catch (error) {
        console.error("Failed to fetch manga details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMangaDetails();
  }, [id]);

  useEffect(() => {
    if (!manga || manga.genres.length === 0) return;

    const fetchRecommendations = async () => {
      try {
        const genre = manga.genres[0].toLowerCase();
        const res = await fetch(`/api/proxy?url=/api/genre/${genre}/1`);
        const data = await res.json();

        const mangaList = Array.isArray(data.manga) ? data.manga : [];
        if (mangaList.length === 0) {
          console.warn("No recommendations found for genre:", genre);
          return;
        }

        const transformedList: MangaCard[] = mangaList.map(
          (item: { id: string; title: string; image: string }) => ({
            id: item.id,
            title: item.title,
            imageUrl: item.image,
          })
        );

        const shuffled = [...transformedList].sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 6));
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [manga]);

  const sortedChapters = useMemo(() => {
    if (!manga) return [];
    return [...manga.chapters].sort((a, b) => {
      const numA = parseFloat(a.chapterId);
      const numB = parseFloat(b.chapterId);
      return sortOrder === "latest" ? numB - numA : numA - numB;
    });
  }, [manga, sortOrder]);

  const totalPages = Math.ceil(sortedChapters.length / chaptersPerPage);
  const currentChapters = sortedChapters.slice(
    (currentPage - 1) * chaptersPerPage,
    currentPage * chaptersPerPage
  );

  if (loading) {
    return (
      <p className="text-gray-300 text-center mt-10">
        Loading manga details...
      </p>
    );
  }

  if (!manga) {
    return (
      <section className="pt-25 lg:pt-28">
        <p className="text-gray-300 text-center mt-10">Manga not found.</p>
      </section>
    );
  }

  return (
    <section className="pt-25 lg:pt-28">
      <div className="container mx-auto px-4 text-white">
        {/* Manga Info */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="w-full md:w-1/4 max-w-[200px] sm:mx-auto">
            <Image
              src={manga.imageUrl}
              alt={manga.title}
              width={200}
              height={300}
              className="rounded w-full object-cover"
            />
          </div>
          <div className="w-full md:flex-1">
            <h1 className="text-3xl font-bold mb-2">{manga.title}</h1>
            <p className="text-sm text-gray-400 mb-1">
              <strong>Author:</strong> {manga.author}
            </p>
            <p className="text-sm text-gray-400 mb-1">
              <strong>Status:</strong> {manga.status}
            </p>
            <p className="text-sm text-gray-400 mb-1">
              <strong>Views:</strong> {manga.views}
            </p>
            <p className="text-sm text-gray-400 mb-1">
              <strong>Last Updated:</strong> {manga.lastUpdated}
            </p>
            <div className="mt-4">
              <strong className="text-sm">Genres:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {manga.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 text-sm bg-zinc-700 rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main content with chapters + recommendations */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chapters */}
          <div className="lg:flex-[3] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Chapters</h2>
              <div className="inline-flex rounded-lg overflow-hidden bg-zinc-800">
                {[
                  { value: "latest", label: "Latest" },
                  { value: "oldest", label: "Oldest" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                      sortOrder === option.value
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sortOrder"
                      value={option.value}
                      checked={sortOrder === option.value}
                      onChange={() => {
                        setSortOrder(option.value as "latest" | "oldest");
                        setCurrentPage(1);
                      }}
                      className="hidden"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {currentChapters.map((chapter) => (
                <Link
                  key={chapter.chapterId}
                  href={`/manga/${manga.id}/${chapter.chapterId}`}
                  className="flex justify-between items-center bg-zinc-800 px-4 py-3 rounded hover:bg-zinc-700 transition"
                >
                  <div>
                    <p className="font-medium">Chapter {chapter.chapterId}</p>
                    <p className="text-xs text-gray-400">
                      Uploaded: {chapter.uploaded}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-300">
                    <p>{chapter.views} views</p>
                    <p className="text-xs">{chapter.timestamp}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-zinc-700 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-zinc-700 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Recommendations */}
          <aside className="lg:flex-[1] flex-1">
            <h2 className="text-lg font-semibold mb-4">
              Similar to {manga?.title ?? "manga"}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:overflow-x-auto">
              {recommendations.map((rec) => (
                <Link
                  href={`/manga/${rec.id}`}
                  key={rec.id}
                  className="bg-zinc-800 rounded overflow-hidden max-w-[150px] mx-auto"
                >
                  <Image
                    src={rec.imageUrl}
                    alt={rec.title}
                    width={150}
                    height={210}
                    className="w-full h-auto object-cover"
                  />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Details;
