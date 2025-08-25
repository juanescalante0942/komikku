/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { set } from "idb-keyval";

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
      <p className="text-gray-300 text-center mt-10">
        Loading chapter {chapter}...
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-center text-red-400 mt-10">Could not load chapter.</p>
    );
  }

  return (
    <section className="pt-25 lg:pt-28 relative">
      <div className="container mx-auto px-4 py-6 text-white">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-10 mx-auto ">
          <Link
            href={`/manga/${id}`}
            className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded"
          >
            ← Chapters
          </Link>
          <h1 className="text-lg font-semibold">
            You are now reading: {data.title}
          </h1>
          <div className="text-sm text-gray-400">Chapter {data.chapter}</div>
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
        <div className="flex justify-center gap-4 mt-8">
          {hasPrev && (
            <Link
              href={`/manga/${id}/${chapterNum - 1}`}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded"
            >
              ← Previous
            </Link>
          )}
          <Link
            href={`/manga/${id}`}
            className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded"
          >
            📚 Back to Chapters
          </Link>
          {hasNext && (
            <Link
              href={`/manga/${id}/${chapterNum + 1}`}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded"
            >
              Next →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
