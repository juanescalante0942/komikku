"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { Search, AlertCircle } from "lucide-react";

type MangaFromAPI = {
  id?: string;
  imgUrl?: string;
  thumb?: string;
  title?: string;
  name?: string;
  description?: string;
  synopsis?: string;
  link?: string;
};

type MangaResult = {
  title: string;
  reason: string;
  api?: MangaFromAPI[];
};

type AIRecommendResponse = {
  results?: MangaResult[];
  fallback?: boolean;
  query?: string;
  fallbackData?: {
    manga?: MangaFromAPI[];
    count?: number;
  };
};

const wittyLines = [
  "MangaAI is flipping through dusty tomes…",
  "Dodging filler arcs to get straight to the good stuff…",
  "Asking the mangaka for spoilers (they said no)…",
  "Rolling for SSR manga in the gacha…",
  "Arguing over who’s the best waifu…",
  "Summoning a random side character to help search…",
  "Avoiding a 200-episode flashback sequence…",
  "Escaping a cliffhanger ending to continue the search…",
];

export default function MangAI() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AIRecommendResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [currentLine, setCurrentLine] = useState(wittyLines[0]);

  useEffect(() => {
    if (!loading) return;

    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % wittyLines.length;
      setCurrentLine(wittyLines[i]);
    }, 2500); // change every 2.5s

    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = () => {
    if (!q || q.trim().length < 3) {
      setData(null);
      return;
    }
    setLoading(true);
    setErr(null);

    fetch("/api/ai-recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.text()) || "Request failed");
        return r.json();
      })
      .then((json) => setData(json))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <section className="pt-25 lg:pt-28">
      <div className="container mx-auto px-4 text-white">
        <div className="text-center mb-6">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-5xl font-bold mb-3"
          >
            MangAI
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
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="text-[var(--secondary)] font-light max-w-xl mx-auto mt-4"
          >
            Your AI-powered manga assistant — tell it what you need, and it will
            recommend titles based on your preferences.
          </motion.p>
        </div>

        {/* Search */}
        <div className="flex px-8 gap-2">
          <input
            placeholder="Ex: Something like Jujutsu Kaisen but..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="p-3 bg-zinc-900 border border-[var(--border)] rounded-lg w-full shadow-lg"
          />
          <button
            onClick={handleSearch}
            className="group flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--foreground)] py-2 px-4 rounded-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <Search className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12" />
            Search
          </button>
        </div>

        {loading && (
          <div className="mt-20 flex flex-col items-center gap-3 text-[var(--secondary)]">
            {/* Manga Page Flip Loader */}
            <div className="loader grid grid-cols-3 gap-1 w-16 h-16">
              {[...Array(6)].map((_, i) => (
                <span key={i} />
              ))}
            </div>

            {/* Rotating witty text */}
            <p className="text-center text-md italic animate-fade">
              {currentLine}
            </p>

            <style jsx>{`
              .loader {
                --color: var(--secondary);
                width: 70px;
                height: 70px;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 5px;
              }

              .loader span {
                width: 100%;
                height: 100%;
                background-color: var(--color);
                animation: keyframes-blink 0.6s alternate infinite linear;
              }

              .loader span:nth-child(1) {
                animation-delay: 0ms;
              }
              .loader span:nth-child(2) {
                animation-delay: 200ms;
              }
              .loader span:nth-child(3) {
                animation-delay: 300ms;
              }
              .loader span:nth-child(4) {
                animation-delay: 400ms;
              }
              .loader span:nth-child(5) {
                animation-delay: 500ms;
              }
              .loader span:nth-child(6) {
                animation-delay: 600ms;
              }

              @keyframes keyframes-blink {
                0% {
                  opacity: 0.3;
                  transform: scale(0.5);
                }
                50% {
                  opacity: 1;
                  transform: scale(1);
                }
              }

              @keyframes fade {
                0%,
                100% {
                  opacity: 0.4;
                }
                50% {
                  opacity: 1;
                }
              }

              .animate-fade {
                animation: fade 2s ease-in-out infinite;
              }
            `}</style>
          </div>
        )}

        {err && (
          <div className="mt-4 w-full max-w-md rounded-2xl bg-red-50 border border-red-200 p-4 shadow-sm flex items-start gap-3">
            {/* Icon */}
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />

            {/* Error Message */}
            <p className="text-sm font-medium text-red-600">{err}</p>
          </div>
        )}

        {/* AI Results */}
        {data?.results && (
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
            className="mt-6 space-y-4"
          >
            {data.results.map((item, idx) => (
              <div
                key={idx}
                className=" text-white bg-zinc-900/30 backdrop-blur-md rounded-xl p-6"
              >
                <h2 className="font-bold text-xl text-[var(--secondary)] mb-2">
                  {item.title}
                </h2>
                <p className="text-sm text-[var(--foreground)] mb-4">
                  {item.reason}
                </p>

                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {item.api && item.api.length > 0 ? (
                    item.api.slice(0, 3).map((m, i) => (
                      <a
                        key={i}
                        href={m.link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative rounded-xl overflow-hidden shadow-md ring-1 ring-white/10 bg-gray-900/40 backdrop-blur-md transition transform hover:-translate-y-1 hover:scale-[1.03] hover:shadow-xl"
                      >
                        {/* Manga Image */}
                        <div className="relative w-[180px] h-[240px] mx-auto">
                          <Image
                            src={m.imgUrl || m.thumb || ""}
                            alt={m.title || m.name || "Manga cover"}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                          />
                        </div>

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent transition duration-300 group-hover:from-black/80 group-hover:via-black/50" />

                        {/* Text */}
                        <div className="absolute bottom-0 left-0 p-5 transition-transform duration-300 group-hover:-translate-y-1">
                          <h3 className="text-md sm:text-sm font-medium text-white line-clamp-2 group-hover:text-[var(--secondary)] transition-colors drop-shadow">
                            {m.title || m.name}
                          </h3>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 col-span-full">
                      No results for this title.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Fallback Results */}
        {data?.fallback && data.fallbackData?.manga && (
          <div className="mt-6 bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-400">
              Fallback search results for &quot;{data.query}&quot;
            </h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.fallbackData.manga.map((m, i) => (
                <a
                  key={i}
                  href={m.link || `/manga/${m.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-gray-700 rounded p-2 hover:bg-gray-700 transition"
                >
                  {m.imgUrl || m.thumb ? (
                    <Image
                      src={m.imgUrl || m.thumb || ""}
                      alt={m.title || m.name || "Manga cover"}
                      width={120}
                      height={160}
                      className="object-cover rounded shadow"
                    />
                  ) : null}
                  <div className="mt-2 font-medium text-white">
                    {m.title || m.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {m.description?.slice(0, 100) ||
                      m.synopsis?.slice(0, 100) ||
                      "No description available."}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
