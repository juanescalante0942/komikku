"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { motion } from "framer-motion";

type Chapter = {
  name: string;
  chapter: string;
};

type Manga = {
  id: string;
  title: string;
  imgUrl: string;
  latestChapters: Chapter[];
  authors: string;
  updated: string;
  views: string;
};

const Search = () => {
  const params = useParams();
  const query = typeof params?.query === "string" ? params.query : "";
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchManga = async () => {
      if (!query.trim()) return;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/proxy?url=/api/search/${encodeURIComponent(query)}`
        );
        const data = await res.json();

        if (Array.isArray(data?.manga)) {
          setResults(data.manga);
        } else {
          setResults([]);
          console.warn("Unexpected response structure:", data);
        }
      } catch (err) {
        console.error("Search request failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchManga();
  }, [query]);

  return (
    <section className="pt-25 lg:pt-28">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">
          Search results for:{" "}
          <span className="text-[var(--secondary)]">
            &quot;{decodeURIComponent(query)}&quot;
          </span>
        </h1>

        {loading ? (
          // Skeleton Loader
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
        ) : results.length === 0 ? (
          // No Results Found
          <div className="flex flex-col items-center justify-center text-center py-20">
            <Image
              src="/no-results.svg" // optional placeholder image
              alt="No results"
              width={180}
              height={180}
              className="mb-6 opacity-80"
            />
            <h2 className="text-xl font-semibold text-white mb-2">
              No results found
            </h2>
            <p className="text-gray-400 max-w-md">
              We couldn’t find anything for{" "}
              <span className="text-[var(--secondary)]">
                &quot;{decodeURIComponent(query)}&quot;
              </span>
              . Try searching with different keywords.
            </p>
          </div>
        ) : (
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
            {results.map((manga) => (
              <Link
                href={`/manga/${manga.id}`}
                key={manga.id}
                className="group relative rounded-lg overflow-hidden shadow-md transition hover:scale-[1.05] hover:shadow-lg"
              >
                {/* Manga Image */}
                <div className="aspect-[2/3] w-full relative">
                  <Image
                    src={manga.imgUrl}
                    alt={manga.title}
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
        )}
      </div>
    </section>
  );
};

export default Search;
