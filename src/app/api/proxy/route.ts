import { NextRequest, NextResponse } from "next/server";

const MANGADEX_BASE =
  process.env.MANGADEX_API_BASE || "https://api.mangadex.dev";
const blockedMangaIds = new Set(
  (process.env.MANGADEX_BLOCKED_MANGA_IDS || "").split(",").map((id) => id.trim()).filter(Boolean)
);
const blockedChapterIds = new Set(
  (process.env.MANGADEX_BLOCKED_CHAPTER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean)
);
const blockedGroupIds = new Set(
  (process.env.MANGADEX_BLOCKED_GROUP_IDS || "").split(",").map((id) => id.trim()).filter(Boolean)
);

function isBlocked(entity: { id?: string; relationships?: { id?: string; type?: string }[] }) {
  return (
    (entity.id && (blockedMangaIds.has(entity.id) || blockedChapterIds.has(entity.id))) ||
    entity.relationships?.some(
      (relationship) =>
        (relationship.type === "manga" && relationship.id && blockedMangaIds.has(relationship.id)) ||
        (relationship.type === "scanlation_group" && relationship.id && blockedGroupIds.has(relationship.id))
    )
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlParam = searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json({ error: "Missing URL param" }, { status: 400 });
  }

  if (!urlParam.startsWith("/") || urlParam.startsWith("//")) {
    return NextResponse.json({ error: "Invalid URL param" }, { status: 400 });
  }

  const requestedPath = new URL(urlParam, MANGADEX_BASE).pathname;
  const requestedId = requestedPath.match(/^\/(?:manga|chapter)\/([^/]+)/)?.[1]
    || requestedPath.match(/^\/at-home\/server\/([^/]+)/)?.[1];
  if (requestedId && (blockedMangaIds.has(requestedId) || blockedChapterIds.has(requestedId))) {
    return NextResponse.json(
      { error: "This content has been removed or blocked." },
      { status: 451 }
    );
  }

  const externalUrl = `${MANGADEX_BASE}${urlParam}`;

  try {
    const res = await fetch(externalUrl);
    const contentType = res.headers.get("content-type") || "application/json";
    const body = await res.text();
    if (contentType.includes("application/json")) {
      const payload = JSON.parse(body);
      if (isBlocked(payload?.data || {})) {
        return NextResponse.json(
          { error: "This content has been removed or blocked." },
          { status: 451 }
        );
      }
      if (Array.isArray(payload?.data)) {
        payload.data = payload.data.filter((entity: { id?: string; relationships?: { id?: string; type?: string }[] }) => !isBlocked(entity));
      }
      return NextResponse.json(payload, { status: res.status });
    }
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": contentType },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
