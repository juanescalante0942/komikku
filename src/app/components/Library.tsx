"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
          {/* Fade + Slide Down Title */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-md"
          >
            Library
          </motion.h2>

          {/* Simple Fade Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="w-50 h-1 mx-auto mb-4 bg-[var(--primary)] rounded-full"
          ></motion.div>

          {/* Fade + Slide Up Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-[var(--secondary)] text-sm sm:text-base md:text-lg font-light max-w-xl mx-auto"
          >
            Browse through a collection of available manga titles, ready for you
            to explore anytime.
          </motion.p>
        </div>

        <div className="mb-4 justify-end items-center flex gap-4">
          <span className="text-white text-md font-medium">Filter:</span>
          <button
            onClick={() => setIsGenreModalOpen(true)}
            className="px-4 py-2 rounded bg-[var(--primary)] text-white hover:scale-[1.05] transition flex items-center gap-2"
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

        <AnimatePresence>
          {isGenreModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
              onClick={() => setIsGenreModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-zinc-900 p-6 rounded-xl max-w-2xl w-full max-h-[80vh] shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl text-white font-bold mb-4">
                  Select a Genre
                </h3>

                <div
                  className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto scroll-smooth p-2 touch-pan-y"
                  style={{
                    overscrollBehavior: "contain",
                    WebkitOverflowScrolling: "touch",
                  }}
                  tabIndex={0}
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  {genreList.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => {
                        setSelectedGenre(genre);
                        setPage(1);
                        setIsGenreModalOpen(false);
                      }}
                      className={`px-3 py-2 rounded text-sm w-full whitespace-normal break-words text-center ${
                        genre === selectedGenre
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--border)] text-gray-200 hover:bg-[var(--primary)] transition-colors duration-300"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
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
        ) : (
          <>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              }}
            >
              {sortedMangaList.map((manga) => (
                <Link
                  href={`/manga/${manga.id}`}
                  key={manga.id}
                  className="group relative rounded-lg overflow-hidden shadow-md transition hover:scale-[1.05] hover:shadow-lg"
                >
                  {/* Manga Image */}
                  <div className="aspect-[2/3] w-full relative">
                    <Image
                      src={manga.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  </div>

                  {/* Overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent transition duration-300 group-hover:from-black/90 group-hover:via-black/40" />

                  {/* Text content */}
                  <div className="absolute bottom-0 left-0 p-4 transition-transform duration-300 group-hover:-translate-y-2">
                    <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-[var(--secondary)] transition-colors">
                      {manga.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </motion.div>

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
                        ? "bg-[var(--primary)] font-bold"
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
