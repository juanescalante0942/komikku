/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeManga, proxyUrl, type MangaDexEntity } from "../../lib/mangadex";

type SearchResult = {
  id: string;
  title: string;
  image: string;
};

type AuthorResult = {
  id: string;
  name: string;
};

const Header = () => {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [authorResults, setAuthorResults] = useState<AuthorResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || ""));
  }, []);

  useEffect(() => {
    if (!mounted) return; // Don't run scroll logic until after hydration

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const search = searchQuery.trim();
    if (search.length < 2) {
      setSearchResults([]);
      setAuthorResults([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const params = new URLSearchParams();
        params.set("title", search);
        params.set("limit", "5");
        params.set("order[followedCount]", "desc");
        params.append("contentRating[]", "safe");
        params.append("availableTranslatedLanguage[]", "en");
        params.append("includes[]", "cover_art");
        const authorParams = new URLSearchParams({
          name: search,
          limit: "5",
          "order[name]": "asc",
        });
        const [response, authorResponse] = await Promise.all([
          fetch(proxyUrl(`/manga?${params.toString()}`), {
            signal: controller.signal,
          }),
          fetch(proxyUrl(`/author?${authorParams.toString()}`), {
            signal: controller.signal,
          }),
        ]);
        const payload = response.ok ? await response.json() : { data: [] };
        const authorPayload = authorResponse.ok
          ? await authorResponse.json()
          : { data: [] };
        let mangaEntities = Array.isArray(payload.data) ? payload.data : [];
        const matchedAuthorIds = Array.isArray(authorPayload.data)
          ? authorPayload.data.map((author: { id: string }) => author.id)
          : [];
        if (matchedAuthorIds.length > 0) {
          const authorMangaParams = new URLSearchParams({
            limit: "5",
            "order[followedCount]": "desc",
          });
          matchedAuthorIds.forEach((authorId: string) =>
            authorMangaParams.append("authors[]", authorId)
          );
          authorMangaParams.append("contentRating[]", "safe");
          authorMangaParams.append("availableTranslatedLanguage[]", "en");
          authorMangaParams.append("includes[]", "cover_art");
          const authorMangaResponse = await fetch(
            proxyUrl(`/manga?${authorMangaParams.toString()}`),
            { signal: controller.signal }
          );
          if (authorMangaResponse.ok) {
            const authorMangaPayload = await authorMangaResponse.json();
            mangaEntities = [
              ...mangaEntities,
              ...(Array.isArray(authorMangaPayload.data) ? authorMangaPayload.data : []),
            ];
          }
        }
        const uniqueManga = Array.from(
          new Map<string, MangaDexEntity>(
            mangaEntities.map((item: MangaDexEntity) => [item.id, item])
          ).values()
        );
        const authorPopularity = new Map<string, number>();
        uniqueManga.forEach(
          (manga: { relationships?: { id: string; type: string }[] }, index: number) => {
            (manga.relationships || [])
              .filter((relationship) => relationship.type === "author" || relationship.type === "artist")
              .forEach((relationship) => {
                const score = (uniqueManga.length || 1) - index;
                authorPopularity.set(
                  relationship.id,
                  Math.max(score, authorPopularity.get(relationship.id) || 0)
                );
              });
          }
        );
        setSearchResults(
          uniqueManga.length > 0
            ? uniqueManga
                .map((item: Parameters<typeof normalizeManga>[0]) => normalizeManga(item))
                .slice(0, 5)
                .map((item: ReturnType<typeof normalizeManga>) => ({
                  id: item.id,
                  title: item.title,
                  image: item.image,
                }))
            : []
        );
        setAuthorResults(
          Array.isArray(authorPayload.data)
              ? authorPayload.data
                  .map((author: { id: string; attributes?: { name?: string } }) => ({
                    id: author.id,
                    name: author.attributes?.name || "Unknown author",
                  }))
                  .sort(
                    (a: AuthorResult, b: AuthorResult) =>
                      (authorPopularity.get(b.id) || 0) -
                        (authorPopularity.get(a.id) || 0) ||
                      a.name.localeCompare(b.name)
                  )
            : []
        );
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          console.error("Autocomplete search failed:", error);
          setSearchResults([]);
          setAuthorResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchResults([]);
    setAuthorResults([]);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full h-20 flex items-center z-40 bg-gradient-to-b from-[var(--background)]/55 to-transparent shadow-[inset_0_1px_0_rgba(244,244,245,0.06)] backdrop-blur-[2px] transition-transform duration-300 ${
          mounted && hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="max-w-screen-2xl w-full mx-auto px-4 flex justify-between items-center md:px-6 gap-4">
          {/* Logo */}
          <h1>
            <a href="/" className="logo">
              <Image
                src="/images/logo.svg"
                width={200}
                height={20}
                alt="Komikku"
              />
            </a>
          </h1>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search manga"
              className="search-trigger"
            >
              <span className="material-symbols-rounded text-[var(--muted)]">search</span>
              <span className="search-label">Search</span>
              <kbd>{isMac ? "Cmd K" : "Ctrl K"}</kbd>
            </button>
          </div>
        </div>
      </header>

      <Navbar hidden={mounted && hidden} />

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-4 flex justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSearchOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md mt-24"
              onClick={(e) => e.stopPropagation()}
            >
              <form
                onSubmit={handleSearch}
                className="relative flex bg-zinc-900 border border-[var(--border)] rounded-lg overflow-hidden shadow-lg"
              >
                {/* Search icon */}
                <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  search
                </span>

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for manga"
                  className="flex-1 pl-10 pr-4 p-4 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                  autoFocus
                />

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="px-4 flex items-center justify-center text-white hover:bg-zinc-800"
                >
                  <span className="material-symbols-rounded">close</span>
                </button>
              </form>
              {(searchLoading || searchResults.length > 0 || authorResults.length > 0) && (
                <div className="mt-2 overflow-hidden rounded-lg border border-[var(--border)] bg-zinc-900 shadow-xl">
                  {searchLoading && (
                    <p className="px-4 py-3 text-sm text-zinc-400">Searching...</p>
                  )}
                  {!searchLoading && searchResults.length > 0 && (
                    <div className="border-b border-zinc-800 pb-2">
                      <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Manga</p>
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => {
                            router.push(`/manga/${result.id}`);
                            setSearchOpen(false);
                            setSearchQuery("");
                            setSearchResults([]);
                            setAuthorResults([]);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left text-white transition hover:bg-zinc-800"
                        >
                          <Image
                            src={result.image}
                            alt=""
                            width={32}
                            height={44}
                            className="h-11 w-8 rounded object-cover"
                          />
                          <span className="line-clamp-2 text-sm">{result.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!searchLoading && authorResults.length > 0 && (
                    <div className="pb-2">
                      <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Authors</p>
                      {authorResults.map((author) => (
                        <button
                          key={author.id}
                          type="button"
                          onClick={() => {
                            router.push(`/author/${author.id}`);
                            setSearchOpen(false);
                            setSearchQuery("");
                            setSearchResults([]);
                            setAuthorResults([]);
                          }}
                          className="flex w-full items-center px-4 py-3 text-left text-sm text-white transition hover:bg-zinc-800"
                        >
                          <span className="mr-3 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400">Author</span>
                          <span className="line-clamp-1">{author.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
