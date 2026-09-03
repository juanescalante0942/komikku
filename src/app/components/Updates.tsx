"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  coverUrl,
  mangaTitle,
  proxyUrl,
  relatedEntity,
  type MangaDexEntity,
  type MangaDexRelationship,
} from "../../lib/mangadex";

type Manga = {
  id: string;
  title: string;
  image: string;
};

const Updates = () => {
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const params = new URLSearchParams();
        params.set("limit", "20");
        params.set("order[publishAt]", "desc");
        params.append("translatedLanguage[]", "en");
        params.append("contentRating[]", "safe");
        params.append("includes[]", "manga");
        params.append("includes[]", "cover_art");
        const res = await fetch(proxyUrl(`/chapter?${params.toString()}`));
        const data = await res.json();
        const seen = new Set<string>();
        const relatedManga = (data.data || [])
          .map((chapter: MangaDexEntity) => relatedEntity(chapter, "manga"))
          .filter((manga: MangaDexRelationship | undefined): manga is MangaDexRelationship => {
            if (!manga || seen.has(manga.id)) return false;
            seen.add(manga.id);
            return true;
          })
          .slice(0, 5);
        const mangaParams = new URLSearchParams();
        relatedManga.forEach((manga: MangaDexRelationship) => mangaParams.append("ids[]", manga.id));
        mangaParams.append("includes[]", "cover_art");
        const mangaRes = await fetch(proxyUrl(`/manga?${mangaParams.toString()}`));
        const mangaData = mangaRes.ok ? await mangaRes.json() : { data: [] };
        const mangaById = new Map<string, MangaDexEntity>(
          (mangaData.data || []).map((manga: MangaDexEntity) => [manga.id, manga])
        );
        const updates = relatedManga.map((related: MangaDexRelationship) => {
          const manga = mangaById.get(related.id) || related;
          return {
            id: manga.id,
            title: mangaTitle(manga),
            image: coverUrl(manga),
          };
        });
        setMangaList(updates);
      } catch (error) {
        console.error("Failed to fetch latest updates:", error);
      } finally {
        setLoading(false); // ✅ stop loading whether success or error
      }
    };
    fetchLatest();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-4"
    >
      {/* ✅ Skeleton while loading */}
      {loading &&
        Array.from({ length: 5 }).map((_, i) => (
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

      {/* Show manga once loaded */}
      {!loading &&
        mangaList.map((manga) => (
          <Link
            href={`/manga/${manga.id}`}
            key={manga.id}
            className="group relative rounded-lg overflow-hidden shadow-md transition hover:scale-[1.05] hover:shadow-lg"
          >
            <div className="aspect-[2/3] w-full relative">
              <Image
                src={manga.image}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent transition duration-300 group-hover:from-black/90 group-hover:via-black/40" />

            <div className="absolute bottom-0 left-0 p-4 transition-transform duration-300 group-hover:-translate-y-2">
              <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-[var(--secondary)] transition-colors">
                {manga.title}
              </h3>
            </div>
          </Link>
        ))}

      {/* ✅ Empty state if no results */}
      {!loading && mangaList.length === 0 && (
        <p className="col-span-full text-center text-zinc-400">
          No updates available
        </p>
      )}
    </motion.div>
  );
};

export default Updates;
