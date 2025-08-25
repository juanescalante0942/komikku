"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { get, set, del } from "idb-keyval";

import { motion } from "framer-motion";

import CircleProgress from "../components/CircleProgress";

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

  // Favorites
  const [isFavorite, setIsFavorite] = useState(false);
  const [chapterProgress, setChapterProgress] = useState<
    Record<string, number>
  >({});

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
    if (!manga) return;

    const loadProgress = async () => {
      const states: Record<string, number> = {};
      for (const chapter of manga.chapters) {
        const key = `progress-${manga.id}-${chapter.chapterId}`;
        const progress = await get(key);
        if (typeof progress === "number") {
          states[chapter.chapterId] = progress;
        }
      }
      setChapterProgress(states);
    };

    loadProgress();
  }, [manga]);

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

  // Load bookmark state from IndexedDB
  useEffect(() => {
    if (!id) return;
    get(`favorite-${id}`).then((data) => {
      if (data) setIsFavorite(true);
    });
  }, [id]);

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!manga) return;

    if (isFavorite) {
      await del(`favorite-${manga.id}`);
      setIsFavorite(false);
    } else {
      await set(`favorite-${manga.id}`, {
        id: manga.id,
        title: manga.title,
        imageUrl: manga.imageUrl,
        author: manga.author,
      });
      setIsFavorite(true);
    }
  };

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
      <section className="pt-25 lg:pt-28">
        <div className="container mx-auto p-4 bg-zinc-900/30 backdrop-blur-md rounded-xl">
          <div className="flex flex-col md:flex-row gap-6 mb-10 animate-pulse">
            {/* Manga cover skeleton */}
            <div className="w-full md:w-1/4 max-w-[200px] sm:mx-auto">
              <div className="w-full h-[300px] bg-zinc-700 rounded-lg" />
              <div className="h-10 w-full bg-zinc-700 rounded-lg mt-2" />
            </div>

            {/* Text skeleton */}
            <div className="flex-1 space-y-4">
              <div className="h-10 bg-zinc-700 rounded-lg w-3/4" />
              <div className="h-4 bg-zinc-700 rounded-lg w-1/4" />
              <div className="h-4 bg-zinc-700 rounded-lg w-1/4" />
              <div className="h-4 bg-zinc-700 rounded-lg w-1/4" />
              <div className="h-6 bg-zinc-700 rounded-lg w-1/6" />
              <div className="flex flex-row gap-2">
                <div className="h-7 bg-zinc-700 rounded-lg w-1/8" />
                <div className="h-7 bg-zinc-700 rounded-lg w-1/8" />
                <div className="h-7 bg-zinc-700 rounded-lg w-1/8" />
                <div className="h-7 bg-zinc-700 rounded-lg w-1/8" />
                <div className="h-7 bg-zinc-700 rounded-lg w-1/8" />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 mt-10">
            {/* Chapters skeleton */}
            <div className="flex-1 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-18 bg-zinc-700 rounded-lg w-full animate-pulse"
                />
              ))}
            </div>

            {/* Recommendations skeleton */}
            <div className="w-full lg:w-1/3">
              <div className="h-6 bg-zinc-700 rounded w-40 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse relative rounded-lg overflow-hidden shadow-md"
                  >
                    {/* Image placeholder */}
                    <div className="aspect-[2/3] w-full bg-zinc-800" />

                    {/* Overlay text placeholders */}
                    <div className="absolute bottom-0 left-0 p-4 w-full space-y-2">
                      <div className="h-4 bg-zinc-700 rounded w-3/4" />
                      <div className="h-3 bg-zinc-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
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
      <div className="container mx-auto text-white bg-zinc-900/30 backdrop-blur-md rounded-xl p-4">
        {/* Manga Info */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          {/* Cover + Favorite Button */}
          <div className="w-full md:w-1/4 max-w-[250px] sm:mx-auto flex flex-col items-center">
            <Image
              src={manga.imageUrl}
              alt=""
              width={200}
              height={300}
              className="rounded-lg w-full object-cover"
            />

            {/* Favorite Button under cover */}
            <button
              onClick={toggleFavorite}
              className={`group mt-3 w-full flex items-center justify-center gap-2 px-3 py-3 rounded text-white transition-all duration-300 ${
                isFavorite
                  ? "bg-[var(--primary)] hover:bg-red-700 rounded-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
                  : "bg-zinc-700 hover:bg-[var(--primary)] rounded-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-all duration-300 group-hover:-rotate-12 ${
                  isFavorite ? "fill-white text-white" : "text-white"
                }`}
              />
              <span>{isFavorite ? "Favorited" : "Add to Favorites"}</span>
            </button>
          </div>

          {/* Manga Details */}
          <div className="w-full md:flex-1 flex-col flex gap-2 text-[var(--foreground)]">
            <h1 className="text-3xl font-bold">{manga.title}</h1>
            <p className="text-xl font-light">{manga.author || "Unknown"}</p>
            <p className="text-md font-light">
              <strong>Status:</strong> {manga.status}
            </p>
            <p className="text-md font-light">
              <strong>Last Updated:</strong>{" "}
              {new Date(manga.lastUpdated).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "2-digit",
              })}
            </p>
            <div className="text-lg font-light flex flex-row items-center gap-2">
              <Eye className="text-[var(--foreground)]" />
              {manga.views}
            </div>
            <div>
              <strong className="text-lg">Genres:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {manga.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-4 py-2 text-sm bg-[var(--border)] rounded-lg transition hover:bg-zinc-700/50 cursor-default"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main content with chapters + recommendations */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Chapters */}
          <div className="lg:flex-[3] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Chapters</h2>
              <div className="relative inline-flex rounded-lg bg-zinc-800 p-1 shadow-lg hover:bg-zinc-700 transition-all">
                {["latest", "oldest"].map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      setSortOrder(value as "latest" | "oldest");
                      setCurrentPage(1);
                    }}
                    className="relative z-10 px-4 py-2 text-sm text-gray-300"
                  >
                    {value === sortOrder && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 rounded-md bg-[var(--primary)]"
                        transition={{ type: "spring", duration: 0.4 }}
                      />
                    )}
                    <span
                      className={
                        sortOrder === value ? "text-white relative z-20" : ""
                      }
                    >
                      {value[0].toUpperCase() + value.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {currentChapters.map((chapter, i) => (
                <motion.div
                  key={chapter.chapterId}
                  custom={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: i * 0.05,
                      duration: 0.4,
                      ease: "easeOut",
                    },
                  }}
                >
                  <Link
                    href={`/manga/${manga.id}/${chapter.chapterId}`}
                    className="flex justify-between items-center bg-zinc-800 px-8 py-4 rounded-lg hover:bg-zinc-700 hover:shadow-md hover:-translate-y-0.5 shadow-lg transition-all duration-200"
                  >
                    <p className="font-bold text-lg flex flex-row items-center text-[var(--secondary)]">
                      Chapter {chapter.chapterId}
                    </p>

                    <div className="text-right text-sm text-gray-300 gap-2 flex flex-row items-end">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 justify-end text-gray-200 font-light">
                          <Eye className="w-4 h-4 text-[var(--foreground)]" />
                          {chapter.views}
                        </div>
                        <p className="text-xs text-gray-500 italic">
                          {new Date(chapter.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                      {chapterProgress[chapter.chapterId] > 0 && (
                        <div className="mt-1">
                          <CircleProgress
                            value={chapterProgress[chapter.chapterId]}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-zinc-700 rounded hover:bg-zinc-600 disabled:opacity-50"
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
                className="px-3 py-2 bg-zinc-700 rounded hover:bg-zinc-600 disabled:opacity-50"
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
              {recommendations.map((rec, i) => (
                <motion.div
                  key={rec.id}
                  custom={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                >
                  <Link
                    href={`/manga/${rec.id}`}
                    className="group relative overflow-hidden shadow-md transition hover:shadow-lg"
                  >
                    <div className="aspect-[2/3] w-full rounded-lg relative overflow-hidden">
                      <Image
                        src={rec.imageUrl}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent transition duration-300 group-hover:from-black/90 group-hover:via-black/40" />
                    <div className="absolute bottom-0 left-0 p-4 transition-transform duration-300 group-hover:-translate-y-2">
                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-[var(--secondary)] transition-colors">
                        {rec.title}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Details;
