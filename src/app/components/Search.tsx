"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { motion } from "framer-motion";
import { normalizeManga, proxyUrl, type MangaDexEntity } from "../../lib/mangadex";

type Manga = {
  id: string;
  title: string;
  image: string;
  authors: string;
};

type Author = {
  id: string;
  name: string;
};

const Search = () => {
  const params = useParams();
  const query = typeof params?.query === "string" ? params.query : "";
  const decodedQuery = (() => {
    try {
      return decodeURIComponent(query);
    } catch {
      return query;
    }
  })();
  const [results, setResults] = useState<Manga[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchManga = async () => {
      if (!decodedQuery.trim()) return;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("title", decodedQuery);
        params.set("limit", "24");
        params.set("order[followedCount]", "desc");
        params.append("contentRating[]", "safe");
        params.append("availableTranslatedLanguage[]", "en");
        params.append("includes[]", "cover_art");
        params.append("includes[]", "author");
        const authorParams = new URLSearchParams({
          name: decodedQuery,
          limit: "10",
          "order[name]": "asc",
        });
        const [mangaResponse, authorResponse] = await Promise.all([
          fetch(proxyUrl(`/manga?${params.toString()}`)),
          fetch(proxyUrl(`/author?${authorParams.toString()}`)),
        ]);
        const data = await mangaResponse.json();
        const authorData = await authorResponse.json();
        let mangaEntities = Array.isArray(data?.data) ? data.data : [];
        const matchedAuthorIds = Array.isArray(authorData?.data)
          ? authorData.data.map((author: { id: string }) => author.id)
          : [];
        if (matchedAuthorIds.length > 0) {
          const authorMangaParams = new URLSearchParams({
            limit: "24",
            "order[followedCount]": "desc",
          });
          matchedAuthorIds.forEach((authorId: string) =>
            authorMangaParams.append("authors[]", authorId)
          );
          authorMangaParams.append("contentRating[]", "safe");
          authorMangaParams.append("availableTranslatedLanguage[]", "en");
          authorMangaParams.append("includes[]", "cover_art");
          const authorMangaResponse = await fetch(
            proxyUrl(`/manga?${authorMangaParams.toString()}`)
          );
          if (authorMangaResponse.ok) {
            const authorMangaData = await authorMangaResponse.json();
            mangaEntities = [
              ...mangaEntities,
              ...(Array.isArray(authorMangaData?.data) ? authorMangaData.data : []),
            ];
          }
        }
        const uniqueManga = Array.from(
          new Map<string, MangaDexEntity>(
            mangaEntities.map((item: MangaDexEntity) => [item.id, item])
          ).values()
        );
        const authorPopularity = new Map<string, number>();
        uniqueManga.forEach(
          (manga: { relationships?: { id: string; type: string }[] }, index: number) => {
            (manga.relationships || [])
              .filter((relationship) => relationship.type === "author" || relationship.type === "artist")
              .forEach((relationship) => {
                const score = (uniqueManga.length || 1) - index;
                authorPopularity.set(
                  relationship.id,
                  Math.max(score, authorPopularity.get(relationship.id) || 0)
                );
              });
          }
        );

        if (uniqueManga.length > 0) {
          setResults(
            uniqueManga.map((item: Parameters<typeof normalizeManga>[0]) => {
              const manga = normalizeManga(item);
              return {
                id: manga.id,
                title: manga.title,
                image: manga.image,
                authors: manga.authors,
              };
            })
          );
        } else {
          setResults([]);
          console.warn("Unexpected response structure:", data);
        }
        setAuthors(
          Array.isArray(authorData?.data)
            ? authorData.data
                .map((author: { id: string; attributes?: { name?: string } }) => ({
                  id: author.id,
                  name: author.attributes?.name || "Unknown author",
                }))
                .sort(
                  (a: Author, b: Author) =>
                    (authorPopularity.get(b.id) || 0) -
                      (authorPopularity.get(a.id) || 0) ||
                    a.name.localeCompare(b.name)
                )
            : []
        );
      } catch (err) {
        console.error("Search request failed:", err);
        setResults([]);
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    };

    searchManga();
  }, [decodedQuery]);

  return (
    <section className="pt-25 lg:pt-28">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">
          Search results for:{" "}
          <span className="text-[var(--secondary)]">
            &quot;{decodedQuery}&quot;
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
        ) : results.length === 0 && authors.length === 0 ? (
          // No Results Found
          <div className="flex flex-col items-center justify-center text-center py-20">
            <p className="text-gray-400 max-w-md">
              We couldn’t find anything for{" "}
              <span className="text-[var(--secondary)]">
                &quot;{decodedQuery}&quot;
              </span>
              . Try searching with different keywords.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {authors.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-semibold text-white">Authors</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {authors.map((author) => (
                    <Link
                      href={`/author/${author.id}`}
                      key={author.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-5 py-4 text-white transition hover:border-[var(--secondary)] hover:bg-zinc-800"
                    >
                      <span className="text-xs uppercase tracking-wider text-zinc-500">Author</span>
                      <h3 className="mt-1 text-lg font-semibold text-[var(--secondary)]">{author.name}</h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {results.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-semibold text-white">Manga</h2>
                <motion.div
                  className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }}
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
                    src={manga.image}
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
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Search;
