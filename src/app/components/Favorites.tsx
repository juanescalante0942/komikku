"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { keys, get, del } from "idb-keyval";

type MangaCard = {
  id: string;
  title: string;
  imageUrl: string;
  author?: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<MangaCard[]>([]);

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
        <h1 className="text-3xl font-bold mb-6">Your Favorites</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {favorites.map((manga) => (
            <div
              key={manga.id}
              className="bg-zinc-800 rounded-lg overflow-hidden shadow relative"
            >
              <Link href={`/manga/${manga.id}`}>
                <Image
                  src={manga.imageUrl}
                  alt={manga.title}
                  width={200}
                  height={300}
                  className="w-full h-72 object-cover"
                />
              </Link>
              <div className="p-3 flex justify-between items-center">
                <h2 className="text-lg font-bold truncate">{manga.title}</h2>
                <button
                  onClick={() => removeFavorite(manga.id)}
                  className="ml-2 px-2 py-1 text-sm bg-red-600 hover:bg-red-700 rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
