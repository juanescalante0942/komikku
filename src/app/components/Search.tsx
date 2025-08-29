"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
          <p className="text-gray-400">Searching manga database...</p>
        ) : results.length === 0 ? (
          <p className="text-gray-500">No results found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
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
          </div>
        )}
      </div>
    </section>
  );
};

export default Search;
