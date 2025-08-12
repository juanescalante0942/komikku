"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

type Manga = {
  id: string;
  title: string;
  image: string;
  description: string;
  latestChapter?: string;
};

const Library = () => {
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [genreList, setGenreList] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Fetch genre list
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch("/api/proxy?url=/api/genre");
        const data = await res.json();
        if (Array.isArray(data.genre)) {
          setGenreList(data.genre);
        }
      } catch (error) {
        console.error("Failed to fetch genres:", error);
      }
    };
    fetchGenres();
  }, []);

  // Fetch manga list
  useEffect(() => {
    const fetchManga = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/proxy?url=/api/genre/${selectedGenre.toLowerCase()}/${page}`
        );
        const data = await res.json();
        setMangaList(data.manga || []);
        if (Array.isArray(data.pagination)) {
          setLastPage(data.pagination[data.pagination.length - 1]);
        } else {
          setLastPage(1);
        }
      } catch (error) {
        console.error("Failed to fetch manga:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchManga();
  }, [selectedGenre, page]);

  const extractChapterNumber = (chapterStr?: string): number => {
    if (!chapterStr) return -1;
    const match = chapterStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : -1;
  };

  const sortedMangaList = [...mangaList].sort((a, b) => {
    const numA = extractChapterNumber(a.latestChapter);
    const numB = extractChapterNumber(b.latestChapter);
    return numB - numA;
  });

  return (
    <section className="pt-25 lg:pt-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-white mb-2">Library</h2>
          <p className="text-gray-400 mb-4">
            Explore all available manga titles.
          </p>
        </div>

        <div className="mb-8 justify-end items-center flex gap-4">
          <span className="text-white text-md font-medium">Filter:</span>
          <button
            onClick={() => setIsGenreModalOpen(true)}
            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-500 transition flex items-center gap-2"
          >
            <span className="font-semibold">{selectedGenre}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.1 1.02l-4.25 4.65a.75.75 0 01-1.1 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {isGenreModalOpen && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
            onClick={() => setIsGenreModalOpen(false)}
          >
            <div
              className="bg-zinc-900 p-6 rounded max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl text-white font-bold mb-4">
                Select a Genre
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {genreList.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      setSelectedGenre(genre);
                      setPage(1);
                      setIsGenreModalOpen(false);
                    }}
                    className={`px-3 py-2 rounded text-sm ${
                      genre === selectedGenre
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-700 text-gray-200 hover:bg-zinc-600"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsGenreModalOpen(false)}
                className="mt-6 block w-full px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-300 text-center mt-10">
            Loading manga list...
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {sortedMangaList.map((manga) => (
                <Link
                  href={`/manga/${manga.id}`}
                  key={manga.id}
                  className="bg-zinc-900 rounded-lg overflow-hidden shadow-md transition hover:scale-[1.02] hover:shadow-lg"
                >
                  <Image
                    src={manga.image}
                    alt={manga.title}
                    width={400}
                    height={250}
                    className="w-full h-[250px] object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {manga.title}
                    </h3>
                    {manga.latestChapter && (
                      <p className="text-sm text-emerald-400 mb-2">
                        Latest: {manga.latestChapter}
                      </p>
                    )}
                    <p className="text-sm text-gray-400 line-clamp-3">
                      {manga.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
              >
                First
              </button>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
              >
                Prev
              </button>

              {Array.from({ length: 5 }, (_, i) => {
                const pageNum = page - 2 + i;
                if (pageNum < 1 || pageNum > lastPage) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded text-white ${
                      pageNum === page
                        ? "bg-emerald-600 font-bold"
                        : "bg-zinc-700 hover:bg-zinc-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
                className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
              >
                Next
              </button>

              <button
                onClick={() => setPage(lastPage)}
                disabled={page === lastPage}
                className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Library;
