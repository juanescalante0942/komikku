"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeManga, proxyUrl, type MangaDexEntity } from "../../../lib/mangadex";

type Author = {
  id: string;
  name: string;
  imageUrl?: string | null;
  description: string;
};

type MangaCard = {
  id: string;
  title: string;
  image: string;
};

function localized(value: unknown) {
  if (!value || typeof value !== "object") return "No biography available.";
  const values = value as Record<string, string>;
  return values.en || Object.values(values)[0] || "No biography available.";
}

function projectLink(url: string) {
  try {
    const parsed = new URL(url);
    if (
      (parsed.hostname === "mangadex.org" || parsed.hostname.endsWith(".mangadex.org")) &&
      parsed.pathname.startsWith("/author/")
    ) {
      const authorId = parsed.pathname.split("/")[2];
      if (authorId) return `/author/${authorId}`;
    }
  } catch {
    // Keep malformed biography links as plain external links.
  }
  return url;
}

function renderBiography(text: string) {
  return text.split(/\n\s*\n/).map((paragraph, paragraphIndex) => (
    <p key={paragraphIndex} className="whitespace-pre-line text-zinc-300">
      {paragraph.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g).map((part, index) => {
        const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
        if (!link) return <span key={index}>{part}</span>;
        const href = projectLink(link[2]);
        const isInternal = href.startsWith("/");
        return (
          <a
            key={index}
            href={href}
            {...(!isInternal && { target: "_blank", rel: "noreferrer" })}
            className="text-[var(--secondary)] underline decoration-[var(--secondary)]/50 underline-offset-2 hover:decoration-[var(--secondary)]"
          >
            {link[1]}
          </a>
        );
      })}
    </p>
  ));
}

export default function AuthorPage() {
  const { id } = useParams<{ id: string }>();
  const [author, setAuthor] = useState<Author | null>(null);
  const [manga, setManga] = useState<MangaCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    async function loadAuthor() {
      try {
        const authorResponse = await fetch(
          proxyUrl(`/author/${encodeURIComponent(id)}`),
          { signal: controller.signal }
        );
        const mangaParams = new URLSearchParams({ limit: "100", "authors[]": id });
        mangaParams.append("contentRating[]", "safe");
        mangaParams.append("availableTranslatedLanguage[]", "en");
        mangaParams.append("order[followedCount]", "desc");
        mangaParams.append("includes[]", "cover_art");
        const mangaResponse = await fetch(proxyUrl(`/manga?${mangaParams.toString()}`), {
          signal: controller.signal,
        });
        if (!authorResponse.ok || !mangaResponse.ok) throw new Error("Author request failed");

        const authorPayload = await authorResponse.json();
        const mangaPayload = await mangaResponse.json();
        const authorData = authorPayload.data;
        setAuthor({
          id: authorData.id,
          name: authorData.attributes?.name || "Unknown author",
          imageUrl: authorData.attributes?.imageUrl,
          description: localized(authorData.attributes?.biography),
        });
        setManga(
          (mangaPayload.data || []).map((item: MangaDexEntity) => {
            const normalized = normalizeManga(item);
            return { id: normalized.id, title: normalized.title, image: normalized.image };
          })
        );
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          console.error("Failed to fetch author:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAuthor();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return <section className="min-h-[60vh] pt-32 text-center text-zinc-400">Loading author...</section>;
  }

  if (!author) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center pt-32 text-center text-white">
        <div>
          <p className="mb-4 text-xl font-semibold text-[var(--primary)]">Author not found</p>
          <Link href="/library" className="text-[var(--secondary)] hover:underline">Back to library</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-28">
      <div className="container mx-auto px-4 text-white">
        <div className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {author.imageUrl ? (
              <Image
                src={author.imageUrl}
                alt={author.name}
                width={128}
                height={128}
                className="h-32 w-32 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-4xl font-bold text-[var(--secondary)]">
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="mt-2 text-3xl font-bold text-[var(--secondary)]">{author.name}</h1>
              <div className="mt-4 max-w-2xl space-y-4">{renderBiography(author.description)}</div>
            </div>
          </div>
        </div>

        <h2 className="mb-5 text-2xl font-semibold">Works by {author.name}</h2>
        {manga.length === 0 ? (
          <p className="py-12 text-center text-zinc-400">No manga found for this author.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {manga.map((item) => (
              <Link
                href={`/manga/${item.id}`}
                key={item.id}
                className="group relative overflow-hidden rounded-lg shadow-md transition hover:scale-[1.05]"
              >
                <div className="relative aspect-[2/3] w-full">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <h3 className="absolute bottom-0 p-4 text-sm font-semibold group-hover:text-[var(--secondary)]">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
