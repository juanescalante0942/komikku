"use client";
import { useState } from "react";
import Image from "next/image";

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

export default function MangAI() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AIRecommendResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold">MangAI</h1>
          <p className="text-gray-300 max-w-xl mx-auto mt-4">
            Your AI-powered manga assistant — tell it what you like, and it will
            recommend manga based on your preferences.
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <input
            placeholder="Ex: Something like Jujutsu Kaisen but..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="p-3 border border-gray-600 rounded w-full"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-3 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>

        {loading && <p className="mt-4 text-yellow-400">Searching…</p>}
        {err && <p className="mt-4 text-red-500">{err}</p>}

        {/* AI Results */}
        {data?.results && (
          <div className="mt-6 space-y-4">
            {data.results.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-700 rounded-lg bg-gray-900 shadow-md"
              >
                <h3 className="font-semibold text-lg text-blue-400">
                  {item.title}
                </h3>
                <p className="italic text-sm text-gray-300">{item.reason}</p>

                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {item.api && item.api.length > 0 ? (
                    item.api.slice(0, 3).map((m, i) => (
                      <a
                        key={i}
                        href={m.link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col gap-3 items-center border border-gray-700 rounded p-2 hover:bg-gray-800 transition"
                      >
                        {m.imgUrl || m.thumb ? (
                          <Image
                            src={m.imgUrl || m.thumb || ""}
                            alt={m.title || m.name || "Manga cover"}
                            width={120}
                            height={150}
                            className="object-cover rounded shadow"
                          />
                        ) : null}
                        <div>
                          <div className="font-medium text-center text-white">
                            {m.title || m.name}
                          </div>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 col-span-full">
                      No results in database for this title.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
