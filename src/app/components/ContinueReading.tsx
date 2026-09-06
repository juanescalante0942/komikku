"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  normalizeManga,
  proxyUrl,
  type MangaDexEntity,
  type NormalizedManga,
} from "../../lib/mangadex";

type ContinueEntry = {
  mangaId: string;
  chapterId: string;
  chapter: string;
};

type ContinueItem = NormalizedManga & ContinueEntry;
type Genre = { id: string; name: string };

const STORAGE_KEY = "komikku-continue-reading";

function readHistory() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is ContinueEntry => (
      item &&
      typeof item.mangaId === "string" &&
      typeof item.chapterId === "string" &&
      typeof item.chapter === "string"
    )).slice(0, 6);
  } catch {
    return [];
  }
}

export default function ContinueReading() {
  const [items, setItems] = useState<ContinueItem[] | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const history = readHistory();
    if (!history.length) {
      fetch(proxyUrl("/manga/tag"), { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("Genre request failed");
          return response.json();
        })
        .then((payload) => {
          const priorities = ["Action", "Romance", "Fantasy", "Comedy"];
          const tags = (Array.isArray(payload.data) ? payload.data : [])
            .map((tag: MangaDexEntity) => ({
              id: tag.id,
              name: (tag.attributes?.name as Record<string, string> | undefined)?.en
                || Object.values((tag.attributes?.name as Record<string, string> | undefined) || {})[0]
                || "",
            }))
            .filter((tag: Genre) => priorities.includes(tag.name))
            .sort((a: Genre, b: Genre) => priorities.indexOf(a.name) - priorities.indexOf(b.name));
          setGenres(tags);
          setItems([]);
        })
        .catch((error) => {
          if ((error as { name?: string }).name !== "AbortError") setItems([]);
        });
      return () => controller.abort();
    }

    const params = new URLSearchParams({ limit: String(history.length) });
    history.forEach(({ mangaId }) => params.append("ids[]", mangaId));
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");

    fetch(proxyUrl(`/manga?${params.toString()}`), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Continue reading request failed");
        return response.json();
      })
      .then((payload) => {
        const mangaById = new Map<string, NormalizedManga>(
          (Array.isArray(payload.data) ? payload.data as MangaDexEntity[] : []).map((entry) => {
            const manga = normalizeManga(entry);
            return [manga.id, manga];
          })
        );
        setItems(
          history.flatMap((entry): ContinueItem[] => {
            const manga = mangaById.get(entry.mangaId);
            return manga ? [{ ...manga, ...entry }] : [];
          })
        );
      })
      .catch((error) => {
        if ((error as { name?: string }).name !== "AbortError") setItems([]);
      });

    return () => controller.abort();
  }, []);

  if (items === null) return null;

  if (!items.length) {
    return (
      <section className="home-section home-section-continue home-section-starter">
        <div className="container">
          <Image
            src="/images/logo.svg"
            width={320}
            height={72}
            alt=""
            aria-hidden="true"
            className="home-starter-wordmark"
          />
          <div className="home-section-header">
            <h2>Find the story that keeps you up.</h2>
            <div className="home-section-rule" />
            <p>Start with a mood, then follow the story.</p>
          </div>
          <nav className="home-genre-shortcuts" aria-label="Browse manga by genre">
            {genres.map((genre) => (
              <Link href={`/library?tags=${genre.id}`} key={genre.id}>
                {genre.name}
              </Link>
            ))}
            <Link href="/library">Browse all manga</Link>
          </nav>
        </div>
      </section>
    );
  }

  return (
    <section className="home-section home-section-continue">
      <div className="container">
        <div className="home-section-header">
          <h2>Continue Reading</h2>
          <div className="home-section-rule" />
          <p>Pick up right where you left off.</p>
        </div>
        <div className="home-continue-grid">
          {items.map((item) => (
            <Link
              href={`/manga/${item.mangaId}/${item.chapterId}`}
              key={item.mangaId}
              className="home-continue-item group"
            >
              <div className="home-continue-cover">
                <Image
                  src={item.image}
                  alt={`Cover of ${item.title}`}
                  fill
                  sizes="(min-width: 1280px) 184px, (min-width: 1024px) 15vw, (min-width: 640px) 22vw, 42vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="home-continue-copy">
                <p>Chapter {item.chapter}</p>
                <h3>{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
