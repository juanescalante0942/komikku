/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { set } from "idb-keyval";

import { ArrowLeft, ArrowRight, Book } from "lucide-react";

type ChapterData = {
  title: string;
  chapter: string;
  imageUrls: string[];
};

export default function Reader() {
  const { id, chapter } = useParams<{ id: string; chapter: string }>();
  const chapterNum = Number.parseInt(chapter ?? "", 10);

  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!id || !chapter) return;

    const controller = new AbortController();
    let mounted = true;

    async function fetchChapterData() {
      try {
        setLoading(true);
        setData(null);
        setHasPrev(false);
        setHasNext(false);

        const res = await fetch(
          `/api/proxy?url=/api/manga/${encodeURIComponent(
            id
          )}/${encodeURIComponent(chapter)}`,
          { signal: controller.signal }
        );

        if (!res.ok) return;
        const json: ChapterData | null = await res.json();
        if (!mounted || !json?.imageUrls?.length) return;

        setData(json);

        const prevNum = chapterNum - 1;
        const nextNum = chapterNum + 1;

        const [prevRes, nextRes] = await Promise.all([
          prevNum >= 1
            ? fetch(
                `/api/proxy?url=/api/manga/${encodeURIComponent(
                  id
                )}/${prevNum}`,
                { signal: controller.signal }
              )
            : null,
          fetch(
            `/api/proxy?url=/api/manga/${encodeURIComponent(id)}/${nextNum}`,
            { signal: controller.signal }
          ),
        ]);

        if (mounted) {
          if (prevRes && prevRes.ok) {
            const prevJson: ChapterData | null = await prevRes
              .json()
              .catch(() => null);
            setHasPrev(!!(prevJson && prevJson.imageUrls?.length));
          }
          if (nextRes && nextRes.ok) {
            const nextJson: ChapterData | null = await nextRes
              .json()
              .catch(() => null);
            setHasNext(!!(nextJson && nextJson.imageUrls?.length));
          }
        }
      } catch (err) {
        if ((err as any).name !== "AbortError") console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchChapterData();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [id, chapter, chapterNum]);

  useEffect(() => {
    if (!id || !chapterNum || !data) return;

    const key = `progress-${id}-${chapterNum}`;
    const el = document.scrollingElement || document.documentElement;

    let raf = 0;
    let lastSaved = 0;

    const computeAndSave = () => {
      const max = Math.max(1, el.scrollHeight - el.clientHeight);
      let p = (el.scrollTop / max) * 100;

      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
        p = 100;
      }

      const rounded = Math.min(100, Math.max(0, Math.floor(p)));

      if (rounded > lastSaved) {
        lastSaved = rounded;
        set(key, rounded).catch((err) =>
          console.error("Failed to save progress state:", err)
        );
      }
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeAndSave);
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      cancelAnimationFrame(raf);
    };
  }, [id, chapterNum, data]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (loading) {
    return (
      <section className="pt-25 lg:pt-28 relative">
        <div className="container mx-auto px-4 py-6 text-white">
          {/* Skeleton top nav */}
          <div className="flex justify-between items-center mb-5">
            <div className="w-24 h-8 bg-zinc-700 animate-pulse rounded-lg"></div>
            <div className="w-40 h-6 bg-zinc-700 animate-pulse rounded-lg"></div>
            <div className="w-20 h-6 bg-zinc-700 animate-pulse rounded-lg"></div>
          </div>

          {/* Skeleton pages */}
          <div className="flex flex-col gap-6 mx-auto max-w-[900px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-[600px] bg-zinc-800 animate-pulse rounded-lg"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="pt-25 lg:pt-28 relative min-h-[60vh] flex items-center justify-center">
        <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 text-center shadow-xl">
          <p className="text-[var(--primary)] text-xl font-semibold mb-4">
            Could not load chapter
          </p>
          <p className="text-zinc-400 mb-6">
            The chapter you’re looking for may be unavailable or removed.
          </p>
          <Link
            href="/library"
            className="inline-block bg-[var(--secondary)] text-black px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Go Back to Library
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-25 lg:pt-28 relative">
      <div className="container mx-auto px-4 py-6 text-white">
        {/* Top Navigation */}
        <div className="flex justify-between items-center gap-4 mb-8 mx-auto max-w-5xl px-4">
          {/* Back button */}
          <Link
            href={`/manga/${id}`}
            className="group flex items-center gap-2 bg-zinc-800/90 hover:bg-zinc-700 px-4 py-2 rounded-xl shadow-sm transition-colors hover:scale-[1.02] hover:shadow-lg"
          >
            <Book className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12" />
            <span>Chapters</span>
          </Link>

          {/* Title */}
          <h1 className="flex-1 text-center text-base sm:text-lg font-medium truncate px-4 text-[var(--foreground)]">
            <span className="hidden sm:inline">You are now reading: </span>
            <span className="font-semibold">{data.title}</span>
          </h1>

          {/* Chapter Badge */}
          <div className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-zinc-800/60 text-gray-300/70 shadow-sm">
            Chapter {data.chapter}
          </div>
        </div>
        {/* Pages */}
        <div
          className="flex flex-col relative mx-auto"
          style={{
            transformOrigin: "top center",
            maxWidth: isMobile ? "100%" : "900px",
          }}
        >
          {data.imageUrls.map((url, idx) => (
            <div key={idx}>
              <Image
                src={url}
                alt={`Page ${idx + 1}`}
                width={800}
                height={1200}
                placeholder="blur"
                blurDataURL="/images/placeholder.svg"
                className="mx-auto w-full sm:max-w-[600px] md:max-w-[500px] lg:max-w-none h-auto"
              />
            </div>
          ))}
        </div>
        {/* Bottom Navigation */}
        <div className="flex justify-center gap-3 sm:gap-4 mt-10">
          {hasPrev && (
            <Link
              href={`/manga/${id}/${chapterNum - 1}`}
              className="group flex items-center gap-2 border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12" />
              <span className="hidden sm:inline">Previous</span>
            </Link>
          )}

          <Link
            href={`/manga/${id}`}
            className="group flex items-center gap-2 bg-[var(--secondary)] text-black px-4 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <Book className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12" />
            <span>Chapters</span>
          </Link>

          {hasNext && (
            <Link
              href={`/manga/${id}/${chapterNum + 1}`}
              className="group flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
