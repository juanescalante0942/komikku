"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { keys, get, del } from "idb-keyval";
import { Heart, HeartOff, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

type MangaCard = { id: string; title: string; imageUrl: string; author?: string };

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<MangaCard[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const loadFavorites = async () => {
      const favoriteKeys = (await keys()).filter(
        (key) => typeof key === "string" && key.startsWith("favorite-")
      );
      const favs: MangaCard[] = [];
      for (const key of favoriteKeys) {
        const data = await get(key);
        if (data) favs.push(data);
      }
      setFavorites(favs);
    };
    loadFavorites();
  }, []);

  const removeFavorite = async (id: string) => {
    await del(`favorite-${id}`);
    toast.error("Removed from favorites");
    setFavorites((prev) => prev.filter((manga) => manga.id !== id));
  };

  return (
    <section className="pb-12 pt-28 lg:pt-32">
      <div className="container">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="mb-10 max-w-2xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold leading-none tracking-tight text-[var(--foreground)] sm:text-5xl">Favorites</h1>
              <div className="mt-4 h-1 w-16 rounded-full bg-[var(--primary)]" />
            </div>
            {favorites.length > 0 && <span className="pb-1 text-sm text-[var(--muted)]">{favorites.length} {favorites.length === 1 ? "title" : "titles"}</span>}
          </div>
          <p className="mt-5 text-base font-light leading-relaxed text-[var(--secondary)]">
            Your saved manga, kept locally in this browser.
            <span className="relative ml-2 inline-flex align-middle" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
              <button type="button" aria-label="How favorites are saved" aria-expanded={show} onClick={() => setShow((value) => !value)} className="rounded-full text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"><HelpCircle className="h-5 w-5" /></button>
              {show && <span className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-relaxed text-[var(--secondary)] shadow-xl">Saved directly in your browser. They remain after refreshes, but reset when browser data is cleared.</span>}
            </span>
          </p>
        </motion.header>

        {favorites.length === 0 ? (
          <div className="flex max-w-xl flex-col items-start border-y border-[var(--border)] py-12">
            <Heart className="mb-5 h-10 w-10 text-[var(--primary)]" />
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">No favorites yet</h2>
            <p className="mt-3 max-w-sm leading-relaxed text-[var(--muted)]">Explore the manga library and save titles you want to find again.</p>
            <Link href="/library" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[var(--secondary)] px-5 text-sm font-medium text-[var(--background)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]">Browse manga</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {favorites.map((manga) => (
              <motion.article key={manga.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="group relative min-w-0">
                <Link href={`/manga/${manga.id}`} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[var(--surface-faint)] shadow-lg transition-shadow duration-300 group-hover:shadow-xl"><Image src={manga.imageUrl} alt={manga.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" /></div>
                  <div className="pt-3 pr-10"><h2 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--foreground)]">{manga.title}</h2>{manga.author && <p className="mt-1 truncate text-xs text-[var(--muted)]">{manga.author}</p>}</div>
                </Link>
                <button onClick={() => removeFavorite(manga.id)} title="Remove from favorites" aria-label={`Remove ${manga.title} from favorites`} onMouseEnter={() => setHoveredId(manga.id)} onMouseLeave={() => setHoveredId(null)} className="absolute right-1 top-[calc(66.667%-1.75rem)] grid h-10 w-10 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/90 text-[var(--primary)] shadow-lg backdrop-blur-sm transition-colors hover:bg-[var(--primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]">{hoveredId === manga.id ? <HeartOff className="h-5 w-5" /> : <Heart className="h-5 w-5" fill="currentColor" />}</button>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
