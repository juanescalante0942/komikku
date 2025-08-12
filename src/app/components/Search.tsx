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
          <span className="text-emerald-400">
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
                className="bg-zinc-900 rounded-lg overflow-hidden shadow-md transition hover:scale-[1.02]"
              >
                <Image
                  src={manga.imgUrl}
                  alt={manga.title}
                  width={400}
                  height={250}
                  className="w-full h-[250px] object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {manga.title}
                  </h3>
                  <p className="text-sm text-emerald-400 mb-1">
                    Latest: {manga.latestChapters[0]?.name ?? "N/A"}
                  </p>
                  <p className="text-sm text-gray-400 mb-1 line-clamp-2">
                    Authors: {manga.authors}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    Updated: {manga.updated}
                  </p>
                  <p className="text-sm text-gray-500">Views: {manga.views}</p>
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
