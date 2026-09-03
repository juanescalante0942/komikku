export type MangaDexRelationship = {
  id: string;
  type: string;
  attributes?: Record<string, unknown> | null;
};

export type MangaDexEntity = {
  id: string;
  type: string;
  attributes?: Record<string, unknown> | null;
  relationships?: MangaDexRelationship[];
};

export type NormalizedManga = {
  id: string;
  title: string;
  image: string;
  imageUrl: string;
  description: string;
  author: string;
  authorId?: string;
  authors: string;
  status: string;
  lastUpdated: string;
  genres: string[];
};

export type NormalizedChapter = {
  chapterId: string;
  volume: string;
  chapter: string;
  title: string;
  views: string;
  uploaded: string;
  timestamp: string;
  groupName: string;
  groupId?: string;
};

export function proxyUrl(path: string) {
  return `/api/proxy?url=${encodeURIComponent(path)}`;
}

function localized(value: unknown, fallback = "") {
  if (!value || typeof value !== "object") return fallback;
  const values = value as Record<string, string>;
  return values.en || Object.values(values)[0] || fallback;
}

export function coverUrl(manga: MangaDexEntity, size = "256") {
  const cover = manga.relationships?.find((item) => item.type === "cover_art");
  const fileName = cover?.attributes?.fileName as string | undefined;
  return fileName
    ? `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.${size}.jpg`
    : "/images/placeholder.svg";
}

export function relatedEntity(
  entity: MangaDexEntity,
  type: string
): MangaDexRelationship | undefined {
  return entity.relationships?.find((item) => item.type === type);
}

export function mangaTitle(manga: MangaDexEntity) {
  return localized(manga.attributes?.title, "Untitled");
}

export function normalizeManga(manga: MangaDexEntity): NormalizedManga {
  const attributes = manga.attributes || {};
  const authors = (manga.relationships || [])
    .filter((item) => item.type === "author" || item.type === "artist")
    .map((item) => item.attributes?.name as string | undefined)
    .filter(Boolean);

  const genres = ((attributes.tags || []) as MangaDexEntity[])
    .map((tag: MangaDexEntity) => localized(tag.attributes?.name))
    .filter(Boolean);

  return {
    id: manga.id,
    title: mangaTitle(manga),
    image: coverUrl(manga),
    imageUrl: coverUrl(manga),
    description: localized(attributes.description, "No description available."),
    author: authors[0] || "Unknown",
    authorId: (manga.relationships || []).find((item) => item.type === "author")?.id,
    authors: authors.join(", ") || "Unknown",
    status: (attributes.status as string) || "unknown",
    lastUpdated: (attributes.updatedAt as string) || (attributes.createdAt as string) || "",
    genres,
  };
}

export function normalizeChapter(chapter: MangaDexEntity): NormalizedChapter {
  const attributes = chapter.attributes || {};
  const group = relatedEntity(chapter, "scanlation_group");
  return {
    chapterId: chapter.id,
    volume: (attributes.volume as string) || "",
    chapter: (attributes.chapter as string) || "Oneshot",
    title: (attributes.title as string) || "",
    views: "",
    uploaded: (attributes.createdAt as string) || "",
    timestamp: (attributes.publishAt as string) || (attributes.updatedAt as string) || (attributes.createdAt as string) || "",
    groupName: (group?.attributes?.name as string) || "Unknown scanlation group",
    groupId: group?.id,
  };
}

export function chapterNumber(chapter: NormalizedChapter) {
  const value = Number.parseFloat(chapter.chapter);
  return Number.isNaN(value) ? -1 : value;
}

export function compareChapters(a: NormalizedChapter, b: NormalizedChapter) {
  const volumeA = Number.parseFloat(a.volume);
  const volumeB = Number.parseFloat(b.volume);
  const chapterA = chapterNumber(a);
  const chapterB = chapterNumber(b);
  const safeVolumeA = Number.isNaN(volumeA) ? -1 : volumeA;
  const safeVolumeB = Number.isNaN(volumeB) ? -1 : volumeB;
  return safeVolumeA - safeVolumeB || chapterA - chapterB;
}

export async function fetchAllChapters(
  mangaId: string,
  language = "en",
  signal?: AbortSignal
) {
  const chapters: NormalizedChapter[] = [];
  let offset = 0;
  let total = 0;

  do {
    const params = new URLSearchParams({
      manga: mangaId,
      limit: "100",
      offset: String(offset),
      "order[volume]": "asc",
      "order[chapter]": "asc",
    });
    if (language !== "all") params.append("translatedLanguage[]", language);
    params.append("contentRating[]", "safe");
    params.append("includes[]", "scanlation_group");
    const response = await fetch(proxyUrl(`/chapter?${params.toString()}`), { signal });
    if (!response.ok) throw new Error("MangaDex chapter request failed");
    const payload = await response.json();
    const page = Array.isArray(payload.data) ? payload.data.map(normalizeChapter) : [];
    chapters.push(...page);
    total = payload.total || chapters.length;
    offset += page.length;
    if (!page.length) break;
  } while (offset < total);

  return chapters;
}
