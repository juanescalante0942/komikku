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
  chapter: string;
  publishedAt: string;
};

function relativeTime(timestamp: string) {
  const elapsed = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return "Recently";
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const Updates = () => {
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchLatest = async () => {
      try {
        setState("loading");
        const params = new URLSearchParams();
        params.set("limit", "20");
        params.set("order[publishAt]", "desc");
        params.append("translatedLanguage[]", "en");
        params.append("contentRating[]", "safe");
        params.append("includes[]", "manga");
        params.append("includes[]", "cover_art");
        const res = await fetch(proxyUrl(`/chapter?${params.toString()}`), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Latest updates request failed");
        const data = await res.json();
        const seen = new Set<string>();
        const chapters = Array.isArray(data.data) ? data.data as MangaDexEntity[] : [];
        const relatedManga = chapters.reduce<{
          manga: MangaDexRelationship;
          chapter: string;
          publishedAt: string;
        }[]>((updates, chapter: MangaDexEntity) => {
          const manga = relatedEntity(chapter, "manga");
          if (!manga || seen.has(manga.id)) return updates;
          seen.add(manga.id);
          const attributes = chapter.attributes || {};
          const number = attributes.chapter as string | undefined;
          updates.push({
            manga,
            chapter: number ? `Chapter ${number}` : "New chapter",
            publishedAt: (attributes.publishAt || attributes.createdAt || "") as string,
          });
          return updates;
        }, []).slice(0, 5);
        const mangaParams = new URLSearchParams();
        relatedManga.forEach(({ manga }) => mangaParams.append("ids[]", manga.id));
        mangaParams.append("includes[]", "cover_art");
        const mangaRes = await fetch(proxyUrl(`/manga?${mangaParams.toString()}`), {
          signal: controller.signal,
        });
        const mangaData = mangaRes.ok ? await mangaRes.json() : { data: [] };
        const mangaById = new Map<string, MangaDexEntity>(
          (mangaData.data || []).map((manga: MangaDexEntity) => [manga.id, manga])
        );
        const updates = relatedManga.map(({ manga: related, chapter, publishedAt }) => {
          const manga = mangaById.get(related.id) || related;
          return {
            id: manga.id,
            title: mangaTitle(manga),
            image: coverUrl(manga),
            chapter,
            publishedAt,
          };
        });
        setMangaList(updates);
        setState("ready");
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setMangaList([]);
          setState("error");
        }
      }
    };
    fetchLatest();
    return () => controller.abort();
  }, [attempt]);

  if (state === "error") {
    return (
      <div className="home-updates-error" role="status">
        <p>Latest chapters could not load. Check your connection and try again.</p>
        <button type="button" onClick={() => setAttempt((current) => current + 1)}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="home-updates-grid"
    >
      {/* ✅ Skeleton while loading */}
      {state === "loading" &&
        Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="home-update-skeleton"
          >
            <div className="home-update-skeleton-cover" />
            <div className="home-update-skeleton-copy" />
          </div>
        ))}

      {/* Show manga once loaded */}
      {state === "ready" &&
        mangaList.map((manga) => (
          <Link
            href={`/manga/${manga.id}`}
            key={manga.id}
            className="home-update-item group"
          >
            <div className="home-update-cover">
              <Image
                src={manga.image}
                alt={`Cover of ${manga.title}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            </div>

            <div className="home-update-copy">
              <p>{manga.chapter}</p>
              <h3>
                {manga.title}
              </h3>
              <span>{relativeTime(manga.publishedAt)}</span>
            </div>
          </Link>
        ))}

      {/* ✅ Empty state if no results */}
      {state === "ready" && mangaList.length === 0 && (
          <p className="col-span-full py-8 text-center text-[var(--muted)]">
          No updates available
        </p>
      )}
    </motion.div>
  );
};

export default Updates;
