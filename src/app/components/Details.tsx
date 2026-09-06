"use client";
import { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, Share, BookOpen, Clock, Library as LibraryIcon, Globe, Play } from "lucide-react";
import { get, set, del } from "idb-keyval";

import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  compareChapters,
  fetchAllChapters,
  languageFlag,
  normalizeManga,
  proxyUrl,
  relatedListItem,
  type MangaDexEntity,
} from "../../lib/mangadex";

import CircleProgress from "../components/CircleProgress";

type Chapter = {
  chapterId: string;
  volume: string;
  chapter: string;
  title: string;
  views: string;
  uploaded: string;
  timestamp: string;
  groupName: string;
  groupId?: string;
  language: string;
  languageName: string;
};

type ChapterGroup = {
  volume: string;
  chapter: string;
  title: string;
  languages: Chapter[];
};

type MangaCard = {
  id: string;
  title: string;
  imageUrl: string;
  year?: number;
};

type MangaDetails = {
  id: string;
  title: string;
  imageUrl: string;
  author: string;
  authorId?: string;
  artists: string;
  status: string;
  lastUpdated: string;
  views: string;
  genres: string[];
  rating: string;
  chapters: Chapter[];
  description?: string;
  year?: number;
  originalLanguage?: string;
  demographic?: string;
  altTitles: string[];
  availableLanguages: string[];
  lastChapter?: string;
  lastVolume?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

const Details = () => {
  const { id } = useParams<{ id: string }>();
  const [manga, setManga] = useState<MangaDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Favorites
  const [isFavorite, setIsFavorite] = useState(false);
  const [chapterProgress, setChapterProgress] = useState<
    Record<string, number>
  >({});

  // Sorting & Pagination states
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const chaptersPerPage = 10;

  // Recommendations
  const [recommendations, setRecommendations] = useState<MangaCard[]>([]);

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        setLoading(true);
        const mangaParams = new URLSearchParams();
        mangaParams.append("includes[]", "cover_art");
        mangaParams.append("includes[]", "author");
        mangaParams.append("includes[]", "artist");
        const [mangaRes, chapters] = await Promise.all([
          fetch(proxyUrl(`/manga/${id}?${mangaParams.toString()}`)),
          fetchAllChapters(id, selectedLanguage),
        ]);
        if (!mangaRes.ok) throw new Error("MangaDex request failed");
        const mangaData = await mangaRes.json();
        setManga({
          ...normalizeManga(mangaData.data),
          views: "",
          rating: "",
          chapters,
        });
      } catch (error) {
        console.error("Failed to fetch manga details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMangaDetails();
  }, [id, selectedLanguage]);

  useEffect(() => {
    if (!manga) return;

    const loadProgress = async () => {
      const states: Record<string, number> = {};
      for (const chapter of manga.chapters) {
        const key = `progress-${manga.id}-${chapter.chapterId}`;
        const progress = await get(key);
        if (typeof progress === "number") {
          states[chapter.chapterId] = progress;
        }
      }
      setChapterProgress(states);
    };

    loadProgress();
  }, [manga]);

  useEffect(() => {
    if (!manga) return;

    const fetchRecommendations = async () => {
      try {
        const res = await fetch(
          proxyUrl(
            `/manga/${manga.id}/recommendation?includes[]=manga&order[score]=desc&contentRating[]=safe`
          )
        );
        const data = await res.json();

        const mangaList: MangaDexEntity[] = Array.isArray(data.data)
          ? (data.data as MangaDexEntity[])
          : [];
        if (mangaList.length === 0) {
          console.warn("No recommendations found");
          return;
        }

        const recommendationIds = mangaList
          .map((item) => relatedListItem(item, manga.id))
          .filter((item): item is string => Boolean(item));
        if (recommendationIds.length === 0) return;

        const recommendationParams = new URLSearchParams();
        recommendationIds.forEach((recommendationId) =>
          recommendationParams.append("ids[]", recommendationId)
        );
        recommendationParams.append("includes[]", "cover_art");
        const mangaRes = await fetch(proxyUrl(`/manga?${recommendationParams.toString()}`));
        const mangaData = mangaRes.ok ? await mangaRes.json() : { data: [] };
        const transformedList: MangaCard[] = (mangaData.data || []).map(
          (item: Parameters<typeof normalizeManga>[0]) => {
            const normalized = normalizeManga(item);
            return {
              id: normalized.id,
              title: normalized.title,
              imageUrl: normalized.image,
              year: normalized.year,
            };
          }
        );

        const shuffled = [...transformedList].sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 6));
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [manga]);

  // Load bookmark state from IndexedDB
  useEffect(() => {
    if (!id) return;
    get(`favorite-${id}`).then((data) => {
      if (data) setIsFavorite(true);
    });
  }, [id]);

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!manga) return;

    if (isFavorite) {
      await del(`favorite-${manga.id}`);
      toast.error("Removed from favorites");
      setIsFavorite(false);
    } else {
      await set(`favorite-${manga.id}`, {
        id: manga.id,
        title: manga.title,
        imageUrl: manga.imageUrl,
        author: manga.author,
      });
      toast.success("Added to favorites");
      setIsFavorite(true);
    }
  };

  const sortedChapters = useMemo(() => {
    if (!manga) return [];
    return [...manga.chapters].sort((a, b) => {
      const result = compareChapters(a, b);
      return sortOrder === "latest" ? -result : result;
    });
  }, [manga, sortOrder]);

  const allMode = selectedLanguage === "all";

  const chapterGroups = useMemo(() => {
    if (!manga) return [];
    const map = new Map<string, ChapterGroup>();
    for (const c of [...manga.chapters].sort(compareChapters)) {
      const key = `${c.volume}::${c.chapter}`;
      const existing = map.get(key);
      if (existing) {
        existing.languages.push(c);
      } else {
        map.set(key, { volume: c.volume, chapter: c.chapter, title: c.title, languages: [c] });
      }
    }
    return [...map.values()];
  }, [manga]);

  const displayGroups = sortOrder === "latest" ? [...chapterGroups].reverse() : chapterGroups;

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalPages = Math.ceil(
    (allMode ? displayGroups.length : sortedChapters.length) / chaptersPerPage
  );
  const currentChapters = sortedChapters.slice(
    (currentPage - 1) * chaptersPerPage,
    currentPage * chaptersPerPage
  );
  const currentGroups = displayGroups.slice(
    (currentPage - 1) * chaptersPerPage,
    currentPage * chaptersPerPage
  );

  const startChapter = useMemo(() => {
    if (!manga || manga.chapters.length === 0) return null;
    const ascending = [...manga.chapters].sort(compareChapters);
    const inProgress = ascending.find((chapter) => {
      const progress = chapterProgress[chapter.chapterId];
      return typeof progress === "number" && progress > 0 && progress < 100;
    });
    return inProgress || ascending[ascending.length - 1];
  }, [manga, chapterProgress]);

  if (loading) {
    return (
      <section className="pt-25 lg:pt-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="animate-pulse">
            <div className="flex flex-col gap-10 md:flex-row">
              <div className="mx-auto w-64 shrink-0 md:mx-0 md:w-80">
                <div className="aspect-[2/3] w-full rounded-2xl bg-[var(--surface)]" />
              </div>
              <div className="flex-1 space-y-4 pt-4 md:pt-3">
                <div className="h-11 w-3/4 rounded-lg bg-[var(--surface)]" />
                <div className="h-5 w-1/4 rounded bg-[var(--surface-faint)]" />
                <div className="h-24 w-full rounded-lg bg-[var(--surface)]" />
                <div className="h-8 w-48 rounded-lg bg-[var(--foreground)]/10" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 w-20 rounded-full bg-[var(--surface)]" />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-[var(--surface)]" />
                ))}
              </div>
              <div className="hidden space-y-4 lg:block">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] w-full rounded-lg bg-[var(--surface)]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!manga) {
    return (
      <section className="relative flex min-h-[60vh] items-center justify-center pt-25 lg:pt-28">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-faint)] p-8 text-center">
          <p className="mb-2 text-xl font-semibold text-[var(--primary)]">
            Could not load manga
          </p>
          <p className="mb-6 text-[var(--muted)]">
            The manga you’re looking for may be unavailable or removed.
          </p>
          <Link
            href="/library"
            className="inline-block rounded-lg bg-[var(--foreground)] px-6 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
          >
            Go Back to Library
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-25 lg:pt-28">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-10 flex flex-col gap-8 md:flex-row"
        >
          {/* Cover */}
          <div className="mx-auto w-full max-w-[288px] shrink-0 md:mx-0 md:w-72">
            <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
              <Image
                src={manga.imageUrl}
                alt={manga.title}
                width={576}
                height={864}
                priority
                className="aspect-[2/3] w-full object-cover"
              />
            </div>
          </div>

          {/* Identity */}
          <div className="flex min-w-0 flex-1 flex-col pt-2 md:pt-1">
            <h1 className="text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
              {manga.title}
            </h1>

            {manga.altTitles.length > 0 && (
              <p className="mt-2 text-base text-[var(--tertiary)]">
                {manga.altTitles.slice(0, 2).join(" · ")}
              </p>
            )}

            {/* Byline: authors + artists */}
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 text-lg">
              {manga.authorId ? (
                <Link
                  href={`/author/${manga.authorId}`}
                  className="font-medium text-[var(--foreground)] transition-colors hover:text-[var(--primary)] hover:underline"
                >
                  By {manga.author}
                </Link>
              ) : (
                <strong className="font-medium text-[var(--foreground)]">
                  By {manga.author}
                </strong>
              )}
              {manga.artists && manga.artists !== manga.author && (
                <span className="text-[var(--muted)]">— art by {manga.artists}</span>
              )}
            </div>

            {/* Compact meta row */}
            <dl className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-[var(--muted)]">
              {manga.demographic && (
                <>
                  <dd className="font-medium capitalize text-[var(--primary)]">{manga.demographic}</dd>
                  <span aria-hidden="true">·</span>
                </>
              )}
              {manga.originalLanguage && (
                <>
                  <dd className="capitalize">
                    {new Intl.DisplayNames(["en"], { type: "language" }).of(manga.originalLanguage)}
                  </dd>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <dd className="capitalize">{manga.status.replace("-", " ")}</dd>
              <span aria-hidden="true">·</span>
              <dd>{manga.chapters.length} chapters</dd>
              {manga.lastChapter != null && (
                <>
                  <span aria-hidden="true">·</span>
                  <dd>latest ch. {manga.lastChapter}</dd>
                </>
              )}
              {manga.year != null && (
                <>
                  <span aria-hidden="true">·</span>
                  <dd>{manga.year}</dd>
                </>
              )}
            </dl>

            {manga.genres.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {manga.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {startChapter ? (
                <Link
                  href={`/manga/${manga.id}/${startChapter.chapterId}`}
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(194,65,65,0.8)] transition hover:bg-[#b03a3a]"
                >
                  <Play className="h-4 w-4 fill-white" />
                  {chapterProgress[startChapter.chapterId] != null &&
                  chapterProgress[startChapter.chapterId] > 0
                    ? "Continue reading"
                    : "Start reading"}
                </Link>
              ) : null}
              <button
                onClick={toggleFavorite}
                aria-pressed={isFavorite}
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors sm:flex-none sm:px-5 ${
                  isFavorite
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-strong)]"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-white" : ""}`} />
                {isFavorite ? "Favorited" : "Favorite"}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.info("Link copied to clipboard");
                }}
                aria-label="Share manga"
                className="grid h-12 w-12 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              >
                <Share className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.header>

        {manga.description && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="mb-10 border-y border-[var(--border)] py-8"
          >
            <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">Synopsis</h2>
            <div className="manga-description text-[var(--muted)]">
              <ReactMarkdown>{manga.description}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {/* Body */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Chapters */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex items-baseline gap-2">
                <BookOpen className="h-4 w-4 translate-y-0.5 text-[var(--muted)]" />
                <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">Chapters</h2>
                <span className="text-sm text-[var(--tertiary)]">{manga.chapters.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <select
                    id="chapter-language"
                    value={selectedLanguage}
                    onChange={(event) => {
                      setSelectedLanguage(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-9 appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-faint)] py-0 pl-9 pr-8 text-sm text-[var(--foreground)] outline-none hover:border-[var(--border-strong)]"
                  >
                    <option value="en">English</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh">Chinese</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="pt-br">Portuguese (Brazil)</option>
                    <option value="all">All languages</option>
                  </select>
                </div>
                <div className="relative inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-faint)] p-1">
                  {["latest", "oldest"].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSortOrder(value as "latest" | "oldest");
                        setCurrentPage(1);
                      }}
                      aria-pressed={sortOrder === value}
                      className={`relative z-10 rounded-md px-3 py-1.5 text-sm transition-colors ${
                        sortOrder === value
                          ? "text-[var(--background)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {sortOrder === value && (
                        <motion.div
                          layoutId="active-pill"
                          className="absolute inset-0 rounded-md bg-[var(--foreground)]"
                          transition={{ type: "spring", duration: 0.4 }}
                        />
                      )}
                      <span className="relative z-20">
                        {value[0].toUpperCase() + value.slice(1)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(allMode ? currentGroups.length === 0 : currentChapters.length === 0) ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <LibraryIcon className="h-8 w-8 text-[var(--tertiary)]" />
                <p className="text-[var(--muted)]">No chapters available in this language.</p>
              </div>
            ) : allMode ? (
              <ul>
                {currentGroups.map((group, i) => {
                  const groupKey = `${group.volume}::${group.chapter}`;
                  const expanded = expandedGroups.has(groupKey);
                  return (
                    <motion.li
                      key={groupKey}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: i * 0.04, duration: 0.35, ease },
                      }}
                    >
                      <div className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-faint)]">
                        <button
                          type="button"
                          onClick={() => toggleGroup(groupKey)}
                          aria-expanded={expanded}
                          className="flex w-full items-center gap-5 py-5 text-left"
                        >
                          <span className="w-12 shrink-0 text-2xl font-semibold tracking-[-0.02em] text-[var(--tertiary)]">
                            {group.chapter}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[var(--foreground)]">
                              <span className="font-medium">
                                {group.title ? group.title : `Chapter ${group.chapter}`}
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-[var(--tertiary)]">
                              {group.languages.length}{" "}
                              {group.languages.length === 1 ? "language" : "languages"}
                            </p>
                          </div>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            className={`h-4 w-4 shrink-0 text-[var(--tertiary)] transition-transform duration-300 ${
                              expanded ? "rotate-180" : ""
                            }`}
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease }}
                              className="overflow-hidden"
                            >
                              <ul className="pb-4 pl-[4.25rem] pr-3">
                                {group.languages.map((lang) => (
                                  <li key={lang.chapterId}>
                                    <Link
                                      href={`/manga/${manga.id}/${lang.chapterId}`}
                                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--surface)]"
                                    >
                                      <span className="text-base leading-none" aria-hidden="true">
                                        {languageFlag(lang.language)}
                                      </span>
                                      <span className="text-sm text-[var(--foreground)]">
                                        {lang.languageName || lang.language}
                                      </span>
                                      <span className="ml-auto hidden max-w-[180px] truncate text-xs text-[var(--tertiary)] sm:block">
                                        {lang.groupName}
                                      </span>
                                      <span className="hidden shrink-0 text-xs text-[var(--tertiary)] sm:block">
                                        {new Date(lang.timestamp).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </span>
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                        className="h-4 w-4 shrink-0 text-[var(--tertiary)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--foreground)]"
                                      >
                                        <path d="m9 18 6-6-6-6" />
                                      </svg>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            ) : (
              <ul>
                {currentChapters.map((chapter, i) => (
                  <motion.li
                    key={chapter.chapterId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: i * 0.04, duration: 0.35, ease },
                    }}
                  >
                    <Link
                      href={`/manga/${manga.id}/${chapter.chapterId}`}
                      className="group flex items-center gap-5 border-b border-[var(--border)] py-5 transition-colors hover:bg-[var(--surface-faint)]"
                    >
                      <span className="w-12 shrink-0 text-2xl font-semibold tracking-[-0.02em] text-[var(--tertiary)] transition-colors group-hover:text-[var(--foreground)]">
                        {chapter.chapter}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[var(--foreground)]">
                          {chapter.title ? (
                            <span className="font-medium">{chapter.title}</span>
                          ) : (
                            <span className="font-medium">Chapter {chapter.chapter}</span>
                          )}
                        </p>
                        <div className="mt-1 flex items-center gap-4 text-xs text-[var(--tertiary)]">
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm leading-none" aria-hidden="true">
                              {languageFlag(chapter.language)}
                            </span>
                            <span>{chapter.languageName || chapter.language}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(chapter.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="max-w-[200px] truncate">{chapter.groupName}</span>
                        </div>
                      </div>
                      {chapterProgress[chapter.chapterId] != null && (
                        <div className="shrink-0">
                          <CircleProgress value={chapterProgress[chapter.chapterId]} size={28} stroke={3} />
                        </div>
                      )}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 shrink-0 text-[var(--tertiary)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--foreground)]"
                        aria-hidden="true"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--border-strong)] disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 text-sm text-[var(--muted)]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--border-strong)] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Similar */}
          <aside className="min-w-0">
            <div className="flex items-baseline gap-2 border-b border-[var(--border)] pb-4">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">Similar</h2>
              <span className="text-sm text-[var(--tertiary)]">{recommendations.length}</span>
            </div>

            {recommendations.length === 0 ? (
              <p className="py-8 text-sm text-[var(--tertiary)]">
                No similar titles to show.
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2">
                {recommendations.map((rec, i) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      transition: { delay: i * 0.06, duration: 0.35, ease },
                    }}
                  >
                    <Link
                      href={`/manga/${rec.id}`}
                      className="group block"
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                        <Image
                          src={rec.imageUrl}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 50vw, 180px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-sm leading-snug text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                        {rec.title}
                      </h3>
                      {rec.year != null && (
                        <p className="mt-0.5 text-xs text-[var(--tertiary)]">{rec.year}</p>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Details;
