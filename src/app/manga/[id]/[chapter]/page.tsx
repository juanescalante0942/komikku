/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { set } from "idb-keyval";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Book,
} from "lucide-react";
import {
  fetchAllChapters,
  mangaTitle,
  normalizeChapter,
  proxyUrl,
  relatedEntity,
} from "../../../../lib/mangadex";

function loadSavedProgress(id: string, chapter: string) {
  try {
    const raw = window.localStorage.getItem(`progress-${id}-${chapter}`);
    if (raw == null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);

    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return reducedMotion;
}

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
  const prefersReducedMotion = usePrefersReducedMotion();

  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevChapter, setPrevChapter] = useState<string | null>(null);
  const [nextChapter, setNextChapter] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [progressPct, setProgressPct] = useState(0);
  const progressTrackRef = useRef<HTMLDivElement | null>(null);
  const progressValueRef = useRef<HTMLSpanElement | null>(null);

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
        setProgressPct(0);

        const res = await fetch(
          proxyUrl(
            `/chapter/${encodeURIComponent(chapter)}?includes[]=manga&includes[]=scanlation_group`
          ),
          { signal: controller.signal }
        );

        if (!res.ok) {
          setStatusMessage("This chapter could not be loaded. Check your connection and try again.");
          return;
        }

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
          const fallbackMangaId = mangaRelation?.id || id;
          const normalized = normalizeChapter(entity);
          const fallbackChapter = normalized.chapter || chapter;

          setProgressPct(100);
          window.localStorage.setItem(`progress-${id}-${chapter}`, "100");
          set(`progress-${id}-${chapter}`, 100).catch((err) =>
            console.error("Failed to save external chapter progress:", err)
          );
          saveContinueReading({
            mangaId: fallbackMangaId,
            chapterId: chapter,
            chapter: fallbackChapter,
          });

          if (mangaRelation) {
            const language = (entity.attributes?.translatedLanguage as string) || "en";
            const chapters = await fetchAllChapters(mangaRelation.id, language, controller.signal);
            if (mounted) {
              const index = chapters.findIndex((item) => item.chapterId === chapter);
              setPrevChapter(index > 0 ? chapters[index - 1].chapterId : null);
              setNextChapter(index >= 0 && index < chapters.length - 1 ? chapters[index + 1].chapterId : null);
            }
          }

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

        const savedProgress = loadSavedProgress(id, chapter);
        if (savedProgress != null && savedProgress > 0) {
          setProgressPct(savedProgress);
        }

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

    const saved = loadSavedProgress(id, chapter);
    if (saved == null || saved <= 0) return;

    const el = document.scrollingElement || document.documentElement;
    const restore = () => {
      const max = Math.max(1, el.scrollHeight - el.clientHeight);
      el.scrollTop = (saved / 100) * max;
    };

    const frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [id, chapter, data]);

  useEffect(() => {
    if (!id || !chapter || !data) return;

    const key = `progress-${id}-${chapter}`;
    const el = document.scrollingElement || document.documentElement;

    let raf = 0;
    let lastSaved = loadSavedProgress(id, chapter) ?? 0;
    let lastPct = lastSaved;

    const computeAndSave = () => {
      const max = Math.max(1, el.scrollHeight - el.clientHeight);
      let p = (el.scrollTop / max) * 100;

      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
        p = 100;
      }

      const rounded = Math.min(100, Math.max(0, Math.floor(p)));
      if (progressTrackRef.current) {
        progressTrackRef.current.style.width = `${rounded}%`;
      }
      if (progressValueRef.current) {
        progressValueRef.current.textContent = `${rounded}% read`;
      }

      if (rounded !== lastPct) {
        lastPct = rounded;
        setProgressPct(rounded);
      }
      if (rounded > lastSaved) {
        lastSaved = rounded;
        window.localStorage.setItem(key, String(rounded));
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
    const el = document.scrollingElement || document.documentElement;

    const handleScroll = () => {
      setIsAtTop(el.scrollTop < 24);
    };

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleScroll();
    checkMobile();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", () => {
      checkMobile();
      handleScroll();
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    const goTo = (target: string | null) => {
      if (!target || !id) return;
      window.location.href = `/manga/${id}/${target}`;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape" && id) {
        event.preventDefault();
        window.location.href = `/manga/${id}`;
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(prevChapter);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(nextChapter);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [id, prevChapter, nextChapter]);

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
    const externalHost = externalUrl
      ? (() => {
          try {
            return new URL(externalUrl).hostname.replace(/^www\./, "");
          } catch {
            return "external source";
          }
        })()
      : null;

    return (
      <section className="relative flex min-h-[60vh] items-center justify-center px-4 pb-12 pt-28 lg:pt-32">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-xl">
          <p className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {externalUrl ? "This chapter is hosted externally" : "Chapter unavailable"}
          </p>
          <p className="mx-auto mt-3 max-w-sm leading-relaxed text-[var(--muted)]">
            {externalUrl
              ? `Continue reading on ${externalHost}. Your Komikku reading progress will not be tracked for this chapter.`
              : statusMessage}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--secondary)] px-5 text-sm font-medium text-[var(--background)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
              >
                Open chapter source
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
            <Link
              href={`/manga/${id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border-strong)] px-5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
            >
              Back to manga
            </Link>
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

  const readerToolbarVisible = prefersReducedMotion || isAtTop;

  return (
    <>
      {/* Reading progress line */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-[var(--border)]/60">
        <div ref={progressTrackRef} className="h-full bg-[var(--primary)]" />
      </div>

      <span ref={progressValueRef} className="sr-only" role="status" aria-live="polite">
        {progressPct > 0 ? `${progressPct}% read` : "Reading progress"}
      </span>

      {/* Desktop reader toolbar */}
      <div
        className={`hidden md:block fixed inset-x-0 top-4 z-40 px-4 ${
          prefersReducedMotion
            ? readerToolbarVisible
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
            : readerToolbarVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-3 opacity-0 pointer-events-none"
        } transition-[opacity,translate] duration-300`}
      >
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-3 rounded-full border border-[var(--border)] bg-[var(--background)]/80 px-3 shadow-lg backdrop-blur-xl">
          <Link
            href={`/manga/${id}`}
            className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-[var(--foreground)]"
          >
            <Book className="h-4 w-4" />
            <span className="hidden sm:inline">Chapters</span>
          </Link>

          <h1 className="min-w-0 flex-1 truncate px-2 text-center text-sm font-medium text-[var(--foreground)]">
            {data.title}
          </h1>

          <span className="hidden text-xs text-[var(--muted)] sm:inline">
            Chapter {data.chapter}
          </span>

          <div className="ml-1 flex items-center gap-1">
            {prevChapter && (
              <button
                type="button"
                aria-label="Previous chapter"
                onClick={() => {
                  window.location.href = `/manga/${id}/${prevChapter}`;
                }}
                className="grid h-9 w-9 place-items-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-[var(--foreground)]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {nextChapter && (
              <button
                type="button"
                aria-label="Next chapter"
                onClick={() => {
                  window.location.href = `/manga/${id}/${nextChapter}`;
                }}
                className="grid h-9 w-9 place-items-center rounded-full bg-[var(--secondary)] text-[var(--background)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[var(--foreground)]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

{/* Mobile reader bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="flex h-14 items-center justify-between gap-3 border-t border-[var(--foreground)]/10 bg-[var(--background)]/90 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
          <Link
            href={`/manga/${id}`}
            aria-label="Back to manga"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-[var(--foreground)]"
          >
            <Book className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">{data.title}</p>
            <p className="truncate text-xs text-[var(--muted)]">Chapter {data.chapter}</p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {prevChapter && (
              <button
                type="button"
                aria-label="Previous chapter"
                onClick={() => {
                  window.location.href = `/manga/${id}/${prevChapter}`;
                }}
                className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border-strong)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-[var(--foreground)]"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {nextChapter && (
              <button
                type="button"
                aria-label="Next chapter"
                onClick={() => {
                  window.location.href = `/manga/${id}/${nextChapter}`;
                }}
                className="grid h-11 w-11 place-items-center rounded-full bg-[var(--secondary)] text-[var(--background)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--foreground)]"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="relative pt-25 pb-24 lg:pt-28 md:pb-0">
        <div className="container mx-auto px-4 py-6 text-white">
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
                  className="mx-auto h-auto w-full sm:max-w-[600px] md:max-w-[500px] lg:max-w-none"
                />
              </div>
            ))}
          </div>

        {/* End-of-chapter actions */}
        <div className="mx-auto mt-12 max-w-5xl px-4">
          {nextChapter ? (
            <Link
              href={`/manga/${id}/${nextChapter}`}
              className="group inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
            >
              <span>Continue to next chapter</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <Link
              href={`/manga/${id}`}
              className="group inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-strong)] px-6 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
            >
              <Book className="h-4 w-4" />
              <span>Back to chapters</span>
            </Link>
          )}
        </div>
        </div>
      </section>
    </>
  );
}
