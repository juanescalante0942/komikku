/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { set } from "idb-keyval";

import { ArrowLeft, ArrowRight, Book } from "lucide-react";
import {
  fetchAllChapters,
  mangaTitle,
  normalizeChapter,
  proxyUrl,
  relatedEntity,
} from "../../../../lib/mangadex";

type ChapterData = {
  title: string;
  chapter: string;
  imageUrls: string[];
  groupName: string;
  groupId?: string;
  mangaId: string;
};

type ContinueEntry = {
  mangaId: string;
  chapterId: string;
  chapter: string;
};

function saveContinueReading(entry: ContinueEntry) {
  try {
    const stored = JSON.parse(window.localStorage.getItem("komikku-continue-reading") || "[]");
    const previous = Array.isArray(stored) ? stored : [];
    window.localStorage.setItem(
      "komikku-continue-reading",
      JSON.stringify([
        entry,
        ...previous.filter((item) => item?.mangaId !== entry.mangaId),
      ].slice(0, 6))
    );
  } catch {
    // Reading remains available if local storage is unavailable.
  }
}

export default function Reader() {
  const { id, chapter } = useParams<{ id: string; chapter: string }>();

  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevChapter, setPrevChapter] = useState<string | null>(null);
  const [nextChapter, setNextChapter] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!id || !chapter) return;

    const controller = new AbortController();
    let mounted = true;

    async function fetchChapterData() {
      try {
        setLoading(true);
        setData(null);
        setPrevChapter(null);
        setNextChapter(null);
        setExternalUrl(null);
        setStatusMessage(null);

        const res = await fetch(
          proxyUrl(
            `/chapter/${encodeURIComponent(chapter)}?includes[]=manga&includes[]=scanlation_group`
          ),
          { signal: controller.signal }
        );

        if (!res.ok) return;
        const chapterJson = await res.json();
        const entity = chapterJson?.data;
        if (!entity) {
          setStatusMessage("This chapter could not be found.");
          return;
        }
        const attributes = entity.attributes || {};
        const mangaRelation = relatedEntity(entity, "manga");
        if (attributes.isUnavailable) {
          setStatusMessage("This chapter is unavailable.");
          return;
        }
        if (attributes.externalUrl) {
          setExternalUrl(attributes.externalUrl as string);
          return;
        }
        if (!mangaRelation) {
          setStatusMessage("This chapter has no associated manga.");
          return;
        }
        const atHomeRes = await fetch(
          proxyUrl(`/at-home/server/${encodeURIComponent(chapter)}?forcePort443=true`),
          { signal: controller.signal }
        );
        if (!atHomeRes.ok) {
          setStatusMessage("MangaDex could not provide pages for this chapter.");
          return;
        }
        const atHome = await atHomeRes.json();
        const useDataSaver = !atHome.chapter?.data?.length;
        const pageData = useDataSaver ? atHome.chapter?.dataSaver || [] : atHome.chapter.data;
        const pagePath = useDataSaver ? "data-saver" : "data";
        const imageUrls = pageData.map(
          (file: string) => `${atHome.baseUrl}/${pagePath}/${atHome.chapter.hash}/${file}`
        );
        if (!mounted || !imageUrls.length) {
          setStatusMessage("No readable pages are available for this chapter.");
          return;
        }

        const normalized = normalizeChapter(entity);
        setData({
          title: mangaTitle(mangaRelation),
          chapter: normalized.chapter,
          imageUrls,
          groupName: normalized.groupName,
          groupId: normalized.groupId,
          mangaId: mangaRelation.id,
        });
        saveContinueReading({
          mangaId: mangaRelation.id,
          chapterId: chapter,
          chapter: normalized.chapter,
        });

        const language = (entity.attributes?.translatedLanguage as string) || "en";
        const chapters = await fetchAllChapters(
          mangaRelation.id,
          language,
          controller.signal
        );
        if (mounted) {
          const index = chapters.findIndex((item) => item.chapterId === chapter);
          setPrevChapter(index > 0 ? chapters[index - 1].chapterId : null);
          setNextChapter(
            index >= 0 && index < chapters.length - 1
              ? chapters[index + 1].chapterId
              : null
          );
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
  }, [id, chapter]);

  useEffect(() => {
    if (!id || !chapter || !data) return;

    const key = `progress-${id}-${chapter}`;
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
  }, [id, chapter, data]);

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

  if (!data && (statusMessage || externalUrl)) {
    return (
      <section className="pt-25 lg:pt-28 relative min-h-[60vh] flex items-center justify-center">
        <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 text-center shadow-xl text-white">
          <p className="text-[var(--primary)] text-xl font-semibold mb-4">
            {externalUrl ? "This chapter is hosted externally" : "Chapter unavailable"}
          </p>
          <p className="text-zinc-400 mb-6">
            {externalUrl
              ? "Continue to the source selected by MangaDex."
              : statusMessage}
          </p>
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-[var(--secondary)] text-black px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Open Chapter Source
            </a>
          )}
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
        <p className="mx-auto mb-6 max-w-5xl px-4 text-center text-xs text-zinc-400">
          Images provided by MangaDex. Scanlation credit: {data.groupId ? (
            <a
              href={`https://mangadex.org/group/${data.groupId}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--secondary)] hover:underline"
            >
              {data.groupName}
            </a>
          ) : (
            data.groupName
          )}. Please respect the group&apos;s content removal requests.
        </p>
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
          {prevChapter && (
            <Link
              href={`/manga/${id}/${prevChapter}`}
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

          {nextChapter && (
            <Link
              href={`/manga/${id}/${nextChapter}`}
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
