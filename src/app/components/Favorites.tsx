"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { keys, get, del } from "idb-keyval";
import { Heart, HeartOff } from "lucide-react";
import { motion } from "framer-motion";

type MangaCard = {
  id: string;
  title: string;
  imageUrl: string;
  author?: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<MangaCard[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
    setFavorites((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  if (favorites.length === 0) {
    return (
      <section className="pt-25 lg:pt-28">
        <div className="container mx-auto px-4 text-white">
          <h1 className="text-3xl font-bold mb-4">Your Favorites</h1>
          <p className="text-gray-400">
            No favorites yet. Add some from the manga page!
          </p>
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
            className="text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-md"
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
            className="text-[var(--secondary)] text-lg font-light max-w-xl mx-auto"
          >
            All the manga you’ve saved in one convenient place, stored on your
            browser with no login required.
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
