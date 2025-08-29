"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { keys, get, del } from "idb-keyval";
import { Heart, HeartOff } from "lucide-react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { toast } from "react-toastify";

type MangaCard = {
  id: string;
  title: string;
  imageUrl: string;
  author?: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<MangaCard[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const loadFavorites = async () => {
    const allKeys = await keys();
    const favoriteKeys = allKeys.filter(
      (key) => typeof key === "string" && key.startsWith("favorite-")
    );

    const favs: MangaCard[] = [];
    for (const key of favoriteKeys) {
      const data = await get(key);
      if (data) favs.push(data);
    }
    setFavorites(favs);
  };

  const removeFavorite = async (id: string) => {
    await del(`favorite-${id}`);
    toast.error("Removed from favorites");
    setFavorites((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  if (favorites.length === 0) {
    return (
      <section className="pt-25 lg:pt-28">
        <div className="container mx-auto px-4 text-white">
          <div className="text-center mb-6">
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-md"
            >
              Favorites
            </motion.h1>

            {/* Simple Fade Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="w-50 h-1 mx-auto mb-4 bg-[var(--primary)] rounded-full"
            ></motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
              className="text-[var(--secondary)] text-sm sm:text-base md:text-lg font-light max-w-xl mx-auto"
            >
              All the manga you’ve saved in one convenient place, stored on your
              browser with no login required.
              <span
                className="relative ml-2 inline-flex"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                onClick={() => setShow((s) => !s)} // tap works for mobile
              >
                <HelpCircle className="w-5 h-5 text-[var(--secondary)] cursor-pointer" />

                {show && (
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 text-sm rounded-lg whitespace-nowrap bg-black/80 text-white shadow-lg z-50">
                    Your favorites are saved directly in your browser using
                    <span className="font-semibold"> local storage</span>.
                    They’ll stay even if you refresh or close the site, but will
                    reset if you clear your browser data.
                  </span>
                )}
              </span>
            </motion.p>
          </div>
          <div className="flex flex-col items-center justify-center text-center py-12 px-6">
            <Heart className="w-12 h-12 text-[var(--primary)] mb-4 animate-bounce" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No favorites yet
            </h2>
            <p className="text-gray-400 max-w-sm mb-4">
              Looks like your shelf is empty. Explore the manga library and add
              your favorites to keep them here!
            </p>
            <Link
              href="/library"
              className="inline-block bg-[var(--secondary)] text-black px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Browse Manga
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-25 lg:pt-28">
      <div className="container mx-auto px-4 text-white">
        <div className="text-center mb-6">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-md"
          >
            Favorites
          </motion.h1>

          {/* Simple Fade Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="w-50 h-1 mx-auto mb-4 bg-[var(--primary)] rounded-full"
          ></motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            className="text-[var(--secondary)] text-sm sm:text-base md:text-lg font-light max-w-xl mx-auto"
          >
            All the manga you’ve saved in one convenient place, stored on your
            browser with no login required.
            <span
              className="relative ml-2 inline-flex"
              onMouseEnter={() => setShow(true)}
              onMouseLeave={() => setShow(false)}
              onClick={() => setShow((s) => !s)} // tap works for mobile
            >
              <HelpCircle className="w-5 h-5 text-[var(--secondary)] cursor-pointer" />

              {show && (
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 text-sm rounded-lg whitespace-nowrap bg-black/80 text-white shadow-lg z-50">
                  Your favorites are saved directly in your browser using
                  <span className="font-semibold"> local storage</span>. They’ll
                  stay even if you refresh or close the site, but will reset if
                  you clear your browser data.
                </span>
              )}
            </span>
          </motion.p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {favorites.map((manga) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              }}
              key={manga.id}
              className="bg-zinc-800 rounded-lg overflow-hidden shadow relative group"
            >
              <Link
                href={`/manga/${manga.id}`}
                className="block relative overflow-hidden shadow-md transition hover:shadow-lg"
              >
                <div className="aspect-[2/3] w-full relative">
                  <Image
                    src={manga.imageUrl}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent transition duration-300 group-hover:from-black/90 group-hover:via-black/40" />
                <div className="absolute bottom-0 left-0 p-4 transition-transform duration-300 group-hover:-translate-y-2">
                  <h3 className="text-md font-semibold text-white mb-1 line-clamp-2 group-hover:text-[var(--secondary)] transition-colors">
                    {manga.title}
                  </h3>
                </div>
              </Link>

              {/* Favorite badge button */}
              <button
                onClick={() => removeFavorite(manga.id)}
                onMouseEnter={() => setHoveredId(manga.id)}
                onMouseLeave={() => setHoveredId(null)}
                title="Remove from favorites"
                className="absolute bottom-3 right-3 bg-zinc-900/70 hover:bg-[var(--primary)] p-2 rounded-full shadow-md transition-colors"
              >
                {hoveredId === manga.id ? (
                  <HeartOff className="w-8 h-8 text-white" />
                ) : (
                  <Heart
                    className="w-8 h-8 text-[var(--primary)]"
                    fill="currentColor"
                  />
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
