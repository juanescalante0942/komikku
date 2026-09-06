"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import {
  normalizeManga,
  proxyUrl,
  type NormalizedManga,
} from "../../lib/mangadex";

type ShelfSort = "rating" | "createdAt";

type MangaShelfProps = {
  sort: ShelfSort;
  limit?: number;
};

const DEFAULT_SHELF_SIZE = 12;

export default function MangaShelf({ sort, limit = DEFAULT_SHELF_SIZE }: MangaShelfProps) {
  const [manga, setManga] = useState<NormalizedManga[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadShelf() {
      setState("loading");
      const params = new URLSearchParams({
        limit: String(limit),
        hasAvailableChapters: "true",
      });
      params.set(`order[${sort}]`, "desc");
      params.append("contentRating[]", "safe");
      params.append("availableTranslatedLanguage[]", "en");
      params.append("includes[]", "cover_art");
      params.append("includes[]", "author");

      try {
        const response = await fetch(proxyUrl(`/manga?${params.toString()}`), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Manga shelf request failed");
        const payload = await response.json();
        setManga(
          Array.isArray(payload.data) ? payload.data.map(normalizeManga) : []
        );
        setState("ready");
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setManga([]);
          setState("error");
        }
      }
    }

    loadShelf();
    return () => controller.abort();
  }, [limit, sort]);

  if (state === "error") {
    return (
      <p className="home-shelf-message" role="status">
        This collection is unavailable right now. Try again shortly.
      </p>
    );
  }

  if (state === "ready" && manga.length === 0) {
    return <p className="home-shelf-message">No titles are available in this collection yet.</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="home-shelf-grid"
      aria-busy={state === "loading"}
    >
      {state === "loading"
        ? Array.from({ length: limit }).map((_, index) => (
            <div className="home-shelf-skeleton" key={index} aria-hidden="true" />
          ))
        : manga.map((item) => (
            <Link
              href={`/manga/${item.id}`}
              key={item.id}
              className="home-shelf-item group"
            >
              <div className="home-shelf-cover">
                <Image
                  src={item.image}
                  alt={`Cover of ${item.title}`}
                  fill
                  sizes="(min-width: 1280px) 184px, (min-width: 1024px) 15vw, (min-width: 640px) 22vw, 42vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="home-shelf-copy">
                <h3>{item.title}</h3>
                <p>{item.author}</p>
              </div>
            </Link>
          ))}
    </motion.div>
  );
}
