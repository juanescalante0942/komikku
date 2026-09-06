"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Grid2X2,
  List,
  RotateCcw,
  Search,
  Shuffle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeManga, proxyUrl, type NormalizedManga } from "../../lib/mangadex";

type Tag = { id: string; name: string };
type ViewMode = "grid" | "list";
type SortKey = "latestUploadedChapter" | "followedCount" | "rating" | "createdAt" | "year" | "title";
type Filters = {
  tags: string[];
  status: string[];
  demographic: string[];
  hasAvailableChapters: boolean;
};

const PAGE_SIZE = 24;
const DEFAULT_FILTERS: Filters = { tags: [], status: [], demographic: [], hasAvailableChapters: true };
const sorts: { value: SortKey; label: string }[] = [
  { value: "latestUploadedChapter", label: "Recently updated" },
  { value: "followedCount", label: "Most followed" },
  { value: "rating", label: "Highest rated" },
  { value: "createdAt", label: "Recently added" },
  { value: "year", label: "Release year" },
  { value: "title", label: "Title A-Z" },
];
const presets: { label: string; sort: SortKey; status?: string[] }[] = [
  { label: "Fresh chapters", sort: "latestUploadedChapter" },
  { label: "Most followed", sort: "followedCount" },
  { label: "Top rated", sort: "rating" },
  { label: "Completed", sort: "latestUploadedChapter", status: ["completed"] },
];

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function updateList(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function mangaMeta(manga: NormalizedManga) {
  return { status: manga.status === "unknown" ? "Unlisted" : manga.status, year: manga.year };
}

export default function Library() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mangaList, setMangaList] = useState<NormalizedManga[]>([]);
  const [recentManga, setRecentManga] = useState<NormalizedManga[]>([]);
  const [genreList, setGenreList] = useState<Tag[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("latestUploadedChapter");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<ViewMode>("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [recentCollapsed, setRecentCollapsed] = useState(false);
  const [recentReady, setRecentReady] = useState(false);
  const [genresExpanded, setGenresExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [randomLoading, setRandomLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const status = searchParams.get("status")?.split(",").filter(Boolean) || [];
    const demographic = searchParams.get("demographic")?.split(",").filter(Boolean) || [];
    const sortParam = searchParams.get("sort") as SortKey | null;
    const pageParam = Number(searchParams.get("page"));
    setQuery(searchParams.get("q") || "");
    setSort(sorts.some((item) => item.value === sortParam) ? sortParam! : "latestUploadedChapter");
    setFilters({ tags, status, demographic, hasAvailableChapters: searchParams.get("readable") !== "false" });
    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
  }, [searchParams]);

  useEffect(() => {
    const savedView = window.localStorage.getItem("komikku-library-view");
    if (savedView === "grid" || savedView === "list") setView(savedView);
  }, []);

  useEffect(() => {
    fetch(proxyUrl("/manga/tag"))
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data.data)) return;
        setGenreList(
          data.data
            .map((tag: { id: string; attributes?: { name?: Record<string, string> } }) => ({
              id: tag.id,
              name: tag.attributes?.name?.en || Object.values(tag.attributes?.name || {})[0] || "",
            }))
            .filter((tag: Tag) => tag.name)
            .sort((a: Tag, b: Tag) => a.name.localeCompare(b.name))
        );
      })
      .catch(() => setGenreList([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
        if (query.trim()) params.set("title", query.trim());
        params.set(`order[${sort}]`, sort === "title" ? "asc" : "desc");
        params.append("contentRating[]", "safe");
        params.append("availableTranslatedLanguage[]", "en");
        params.append("includes[]", "cover_art");
        params.append("includes[]", "author");
        filters.tags.forEach((tag) => params.append("includedTags[]", tag));
        filters.status.forEach((status) => params.append("status[]", status));
        filters.demographic.forEach((demographic) => params.append("publicationDemographic[]", demographic));
        if (filters.hasAvailableChapters) params.set("hasAvailableChapters", "true");
        const response = await fetch(proxyUrl(`/manga?${params.toString()}`), { signal: controller.signal });
        if (!response.ok) throw new Error("Library request failed");
        const data = await response.json();
        setMangaList(Array.isArray(data.data) ? data.data.map(normalizeManga) : []);
        setTotal(data.total || 0);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setMangaList([]);
          setTotal(0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 350 : 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, sort, filters, page]);

  useEffect(() => {
    const ids = JSON.parse(window.localStorage.getItem("komikku-recent") || "[]") as string[];
    if (!ids.length) return;
    const params = new URLSearchParams({ limit: String(Math.min(ids.length, 6)) });
    ids.slice(0, 6).forEach((id) => params.append("ids[]", id));
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");
    fetch(proxyUrl(`/manga?${params.toString()}`))
      .then((response) => response.json())
      .then((data) => {
        const map = new Map((data.data || []).map((item: Parameters<typeof normalizeManga>[0]) => {
          const manga = normalizeManga(item);
          return [manga.id, manga];
        }));
        setRecentManga(ids.map((id) => map.get(id)).filter(Boolean) as NormalizedManga[]);
      })
      .catch(() => setRecentManga([]));
  }, []);

  useEffect(() => {
    setRecentCollapsed(window.localStorage.getItem("komikku-recent-collapsed") === "1");
    setRecentReady(true);
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const root = document.documentElement;
    const body = document.body;
    const rootOriginal = root.style.overflow;
    const bodyOriginal = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const prevent = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest("[data-filter-scroll]")) return;
      event.preventDefault();
    };
    window.addEventListener("wheel", prevent, { passive: false });
    window.addEventListener("touchmove", prevent, { passive: false });

    return () => {
      root.style.overflow = rootOriginal;
      body.style.overflow = bodyOriginal;
      window.removeEventListener("wheel", prevent);
      window.removeEventListener("touchmove", prevent);
    };
  }, [filterOpen]);

  const syncUrl = (next: { query?: string; sort?: SortKey; filters?: Filters; page?: number }) => {
    const nextQuery = next.query ?? query;
    const nextSort = next.sort ?? sort;
    const nextFilters = next.filters ?? filters;
    const nextPage = next.page ?? page;
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextSort !== "latestUploadedChapter") params.set("sort", nextSort);
    if (nextFilters.tags.length) params.set("tags", nextFilters.tags.join(","));
    if (nextFilters.status.length) params.set("status", nextFilters.status.join(","));
    if (nextFilters.demographic.length) params.set("demographic", nextFilters.demographic.join(","));
    if (!nextFilters.hasAvailableChapters) params.set("readable", "false");
    if (nextPage > 1) params.set("page", String(nextPage));
    router.replace(`/library${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
    syncUrl({ filters: draftFilters, page: 1 });
    setFilterOpen(false);
  };
  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    syncUrl({ filters: DEFAULT_FILTERS, page: 1 });
  };
  const activeFilterCount = filters.tags.length + filters.status.length + filters.demographic.length + (filters.hasAvailableChapters ? 1 : 0);
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const selectPreset = (preset: (typeof presets)[number]) => {
    const nextFilters = { ...DEFAULT_FILTERS, status: preset.status || [] };
    setFilters(nextFilters);
    setDraftFilters(nextFilters);
    setSort(preset.sort);
    setPage(1);
    syncUrl({ filters: nextFilters, sort: preset.sort, page: 1 });
  };

  const saveRecent = (id: string) => {
    const previous = JSON.parse(window.localStorage.getItem("komikku-recent") || "[]") as string[];
    window.localStorage.setItem(
      "komikku-recent",
      JSON.stringify([id, ...previous.filter((item) => item !== id)].slice(0, 12))
    );
  };

  const surpriseMe = async () => {
    setRandomLoading(true);
    try {
      const response = await fetch(proxyUrl("/manga/random?contentRating[]=safe&includes[]=cover_art"));
      const data = await response.json();
      if (data.data?.id) router.push(`/manga/${data.data.id}`);
    } finally {
      setRandomLoading(false);
    }
  };

  return (
    <section className="pb-12 pt-28 lg:pt-32">
      <div className="container">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-10 max-w-3xl"
        >
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-5xl">Library</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">Browse the catalog with focused controls for finding your next series.</p>
        </motion.header>

        <div className="mb-6 flex flex-wrap gap-2">
          {presets.map((preset, index) => {
            const selected = preset.sort === sort && (preset.status || []).join(",") === filters.status.join(",");
            return (
              <motion.button
                key={preset.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease, delay: 0.08 + index * 0.05 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => selectPreset(preset)}
                aria-pressed={selected}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${selected ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"}`}
              >
                {preset.label}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {recentManga.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease }}
              className="mb-10 border-y border-[var(--border)] py-5"
            >
              <div className="mb-3 flex items-baseline justify-between">
                <button
                  onClick={() => {
                    const next = !recentCollapsed;
                    setRecentCollapsed(next);
                    window.localStorage.setItem("komikku-recent-collapsed", next ? "1" : "0");
                  }}
                  className="group flex items-center gap-1.5 text-sm font-semibold text-[var(--foreground)]"
                >
                  <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${recentCollapsed ? "-rotate-90" : ""}`} />
                  <h2>Recently viewed</h2>
                </button>
                <span className="text-xs text-[var(--tertiary)]">On this device</span>
              </div>
              {!recentCollapsed && <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease }}
                className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-x-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6 xl:grid-cols-8"
              >
                {recentManga.map((manga) => <RecentCard key={manga.id} manga={manga} onOpen={saveRecent} />)}
              </motion.div>}
            </motion.section>
          )}
        </AnimatePresence>

        <div className="mb-5 flex flex-col gap-3 border-y border-[var(--border)] py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-faint)] px-3 focus-within:border-[var(--border-strong)] transition-colors duration-200">
            <Search className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); syncUrl({ query: event.target.value, page: 1 }); }} placeholder="Search the library" className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--tertiary)]" />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => { setQuery(""); setPage(1); syncUrl({ query: "", page: 1 }); }}
                  aria-label="Clear library search"
                >
                  <X className="h-4 w-4 text-[var(--muted)]" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setDraftFilters(filters); setGenresExpanded(false); setFilterOpen(true); }} className="relative inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--foreground)] transition hover:border-[var(--border-strong)]"><SlidersHorizontal className="h-4 w-4" />Filters{activeFilterCount > 1 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--foreground)] px-1 text-xs text-[var(--background)]">{activeFilterCount - 1}</span>}</button>
            <label className="relative"><span className="sr-only">Sort library</span><select value={sort} onChange={(event) => { const value = event.target.value as SortKey; setSort(value); setPage(1); syncUrl({ sort: value, page: 1 }); }} className="h-11 appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-faint)] py-0 pl-3 pr-9 text-sm text-[var(--foreground)] outline-none hover:border-[var(--border-strong)]">{sorts.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-[var(--muted)]" /></label>
            <div className="hidden rounded-lg border border-[var(--border)] p-1 sm:flex"><button onClick={() => { setView("grid"); localStorage.setItem("komikku-library-view", "grid"); }} className={`grid h-9 w-9 place-items-center rounded transition-colors ${view === "grid" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--muted)]"}`} aria-label="Grid view"><Grid2X2 className="h-4 w-4" /></button><button onClick={() => { setView("list"); localStorage.setItem("komikku-library-view", "list"); }} className={`grid h-9 w-9 place-items-center rounded transition-colors ${view === "list" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--muted)]"}`} aria-label="List view"><List className="h-4 w-4" /></button></div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={surpriseMe}
              disabled={randomLoading}
              className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] disabled:opacity-50"
              aria-label="Surprise me"
            >
              <motion.span animate={randomLoading ? { rotate: 360 } : { rotate: 0 }} transition={randomLoading ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}><Shuffle className="h-4 w-4" /></motion.span>
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {activeFilterCount > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease }}
              className="mb-5 flex flex-wrap items-center gap-2 overflow-hidden"
            >
              <span className="text-xs text-[var(--tertiary)]">Filters</span>
              <AnimatePresence>
                {filters.status.map((item) => <FilterChip key={item} label={item} onRemove={() => { const next = { ...filters, status: filters.status.filter((status) => status !== item) }; setFilters(next); setDraftFilters(next); syncUrl({ filters: next, page: 1 }); setPage(1); }} />)}
                {filters.demographic.map((item) => <FilterChip key={item} label={item} onRemove={() => { const next = { ...filters, demographic: filters.demographic.filter((demographic) => demographic !== item) }; setFilters(next); setDraftFilters(next); syncUrl({ filters: next, page: 1 }); setPage(1); }} />)}
                {filters.tags.map((id) => <FilterChip key={id} label={genreList.find((tag) => tag.id === id)?.name || "Genre"} onRemove={() => { const next = { ...filters, tags: filters.tags.filter((tag) => tag !== id) }; setFilters(next); setDraftFilters(next); syncUrl({ filters: next, page: 1 }); setPage(1); }} />)}
              </AnimatePresence>
              <button onClick={resetFilters} className="text-xs text-[var(--muted)] underline underline-offset-4 hover:text-[var(--foreground)]">Clear all</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-5 flex items-baseline justify-between"><p className="text-sm text-[var(--muted)]">{loading ? "Loading titles" : total ? `${rangeStart}-${rangeEnd} of ${total.toLocaleString()} titles` : "No titles found"}</p><p className="text-xs text-[var(--tertiary)]">{sorts.find((item) => item.value === sort)?.label}</p></div>

        {loading ? <LibrarySkeleton view={view} /> : mangaList.length ? <MangaResults mangaList={mangaList} view={view} onOpen={saveRecent} /> : <EmptyState onReset={resetFilters} />}

        {total > PAGE_SIZE && <nav className="mt-10 flex items-center justify-between border-t border-[var(--border)] pt-5" aria-label="Library pages"><button disabled={page === 1} onClick={() => { const next = page - 1; setPage(next); syncUrl({ page: next }); }} className="inline-flex items-center gap-2 text-sm text-[var(--muted)] disabled:opacity-30"><ArrowLeft className="h-4 w-4" />Previous</button><span className="text-sm text-[var(--muted)]">Page {page} of {lastPage}</span><button disabled={page === lastPage} onClick={() => { const next = page + 1; setPage(next); syncUrl({ page: next }); }} className="inline-flex items-center gap-2 text-sm text-[var(--muted)] disabled:opacity-30">Next<ArrowRight className="h-4 w-4" /></button></nav>}
      </div>

      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(6px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.25, ease }}
            className="fixed inset-0 z-60 flex items-end overflow-hidden overscroll-none bg-black/65 p-0 sm:items-center sm:justify-center sm:p-4"
            onClick={() => setFilterOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="flex h-[88vh] max-h-[720px] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:rounded-2xl sm:max-w-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 pb-4 pt-5"><div><h2 className="text-xl font-semibold">Refine library</h2><p className="mt-1 text-sm text-[var(--muted)]">Only titles with English chapters are shown.</p></div><button onClick={() => setFilterOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-faint)]" aria-label="Close filters"><X className="h-5 w-5" /></button></div>
              <div
                data-filter-scroll
                onWheel={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
                className="min-h-0 flex-1 overflow-y-scroll overscroll-contain px-5 py-5"
              >
                <FilterGroup label="Status" values={["ongoing", "completed", "hiatus", "cancelled"]} selected={draftFilters.status} onChange={(value) => setDraftFilters((current) => ({ ...current, status: updateList(current.status, value) }))} />
                <FilterGroup label="Demographic" values={["shounen", "shoujo", "seinen", "josei"]} selected={draftFilters.demographic} onChange={(value) => setDraftFilters((current) => ({ ...current, demographic: updateList(current.demographic, value) }))} />
                <GenreField genres={genreList} selected={draftFilters.tags} expanded={genresExpanded} onToggle={setGenresExpanded} onChange={(id) => setDraftFilters((current) => ({ ...current, tags: updateList(current.tags, id) }))} />
                <label className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-5 text-sm"><span><span className="block font-semibold">Readable now</span><span className="mt-1 block text-[var(--muted)]">Only show titles with available chapters.</span></span><input type="checkbox" checked={draftFilters.hasAvailableChapters} onChange={(event) => setDraftFilters((current) => ({ ...current, hasAvailableChapters: event.target.checked }))} className="h-4 w-4 accent-white" /></label>
              </div>
              <div className="flex gap-3 border-t border-[var(--border)] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"><button onClick={resetFilters} className="h-11 px-4 text-sm text-[var(--muted)]">Reset</button><button onClick={applyFilters} className="h-11 flex-1 rounded-lg bg-[var(--foreground)] text-sm font-medium text-[var(--background)]">Apply filters</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Toggle({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex min-h-10 items-center justify-between rounded-lg border px-3 text-left text-sm capitalize transition ${selected ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)]"}`}>{label}{selected && <Check className="h-4 w-4" />}</button>;
}

function FilterGroup({ label, values, selected, onChange }: { label: string; values: string[]; selected: string[]; onChange: (value: string) => void }) {
  return <div className="mt-6"><h3 className="text-sm font-semibold">{label}</h3><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{values.map((value) => <Toggle key={value} label={value} selected={selected.includes(value)} onClick={() => onChange(value)} />)}</div></div>;
}

function GenreField({ genres, selected, expanded, onToggle, onChange }: { genres: Tag[]; selected: string[]; expanded: boolean; onToggle: (value: boolean) => void; onChange: (id: string) => void }) {
  const collapsedCount = 8;
  const [search, setSearch] = useState("");
  const matchingGenres = search.trim()
    ? genres.filter((genre) => genre.name.toLowerCase().includes(search.trim().toLowerCase()))
    : genres;
  const visible = search.trim() || expanded ? matchingGenres : matchingGenres.slice(0, collapsedCount);
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold">Genres</h3>
      <div className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-faint)] px-3 focus-within:border-[var(--border-strong)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search genres"
          aria-label="Search genres"
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--tertiary)]"
        />
        {search && (
          <button onClick={() => setSearch("")} aria-label="Clear genre search">
            <X className="h-4 w-4 text-[var(--muted)]" />
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <AnimatePresence>
          {visible.map((genre, i) => (
            <motion.div
              key={genre.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.2, ease, delay: Math.min(i * 0.02, 0.2) },
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease }}
            >
              <Toggle label={genre.name} selected={selected.includes(genre.id)} onClick={() => onChange(genre.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {search.trim() && visible.length === 0 && (
        <p className="mt-3 text-sm text-[var(--tertiary)]">No genres match “{search}”.</p>
      )}
      {!search.trim() && genres.length > collapsedCount && (
        <button onClick={() => onToggle(!expanded)} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]">
          {expanded ? "Show fewer" : `Show all ${genres.length} genres`}
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25, ease }}><ChevronDown className="h-4 w-4" /></motion.span>
        </button>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2, ease }}
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-xs capitalize text-[var(--foreground)]"
    >
      {label}<X className="h-3 w-3" />
    </motion.button>
  );
}

function RecentCard({ manga, onOpen }: { manga: NormalizedManga; onOpen: (id: string) => void }) {
  const meta = mangaMeta(manga);
  return <Link href={`/manga/${manga.id}`} onClick={() => onOpen(manga.id)} className="group flex w-40 shrink-0 gap-3 sm:w-auto sm:flex-col sm:min-w-0"><div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded bg-[var(--surface)] sm:w-full sm:rounded-lg"><Image src={manga.image} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" /><span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] capitalize text-white">{meta.status}</span></div><div className="min-w-0 self-center sm:mt-2 sm:self-auto"><h2 className="line-clamp-2 text-xs font-semibold leading-4 text-[var(--foreground)] group-hover:underline">{manga.title}</h2><p className="mt-0.5 hidden line-clamp-1 text-xs text-[var(--muted)] sm:block">{manga.author}</p></div></Link>;
}

function MangaResults({ mangaList, view, onOpen }: { mangaList: NormalizedManga[]; view: ViewMode; onOpen: (id: string) => void }) {
  return (
    <motion.div
      key={view}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease }}
      className={view === "grid" ? "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" : "grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2"}
    >
      {mangaList.map((manga, index) => (
        <motion.div
          key={manga.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: Math.min(index * 0.04, 0.4) }}
        >
          <MangaCard manga={manga} view={view} onOpen={onOpen} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function MangaCard({ manga, view, onOpen }: { manga: NormalizedManga; view: ViewMode; onOpen: (id: string) => void }) {
  const meta = mangaMeta(manga);
  if (view === "list") return <Link href={`/manga/${manga.id}`} onClick={() => onOpen(manga.id)} className="group flex gap-4 bg-[var(--background)] p-3 sm:p-4"><Image src={manga.image} alt="" width={64} height={92} className="h-23 w-16 rounded object-cover" /><div className="min-w-0 py-1"><h2 className="line-clamp-1 font-semibold text-[var(--foreground)] group-hover:underline">{manga.title}</h2><p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">{manga.author}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--tertiary)]"><span className="capitalize">{meta.status}</span>{meta.year && <span>{meta.year}</span>}{manga.genres.slice(0, 2).map((genre) => <span key={genre}>{genre}</span>)}</div></div></Link>;
  return <Link href={`/manga/${manga.id}`} onClick={() => onOpen(manga.id)} className="group min-w-0"><div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[var(--surface)]"><Image src={manga.image} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" /><span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] capitalize text-white">{meta.status}</span></div><h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[var(--foreground)] group-hover:underline">{manga.title}</h2><p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">{manga.author}{meta.year ? ` · ${meta.year}` : ""}</p></Link>;
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="grid min-h-72 place-items-center border-y border-[var(--border)] text-center"
    >
      <div>
        <h2 className="text-lg font-semibold">No manga matches this search</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Try broadening the search or clearing your filters.</p>
        <button onClick={onReset} className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--foreground)] underline underline-offset-4"><RotateCcw className="h-4 w-4" />Reset filters</button>
      </div>
    </motion.div>
  );
}

function LibrarySkeleton({ view }: { view: ViewMode }) {
  return (
    <div className={view === "grid" ? "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" : "grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2"}>
      {Array.from({ length: 12 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: index * 0.03, ease }}
          className={view === "grid" ? "animate-pulse" : "flex animate-pulse gap-4 bg-[var(--background)] p-3 sm:p-4"}
        >
          <div className={`${view === "grid" ? "aspect-[2/3]" : "h-23 w-16"} rounded-lg bg-[var(--surface)]`} />
          {view === "list" && <div className="flex-1 space-y-3 py-2"><div className="h-4 w-2/5 rounded bg-[var(--surface)]" /><div className="h-3 w-1/4 rounded bg-[var(--surface)]" /></div>}
        </motion.div>
      ))}
    </div>
  );
}
