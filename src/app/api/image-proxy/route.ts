import { NextRequest, NextResponse } from "next/server";

const MANGADEX_REFERER = "https://mangadex.org/";
const USER_AGENT = "Komikku image proxy/1.0";

function isMangaDexImageHost(hostname: string) {
  return (
    hostname === "uploads.mangadex.org" ||
    hostname.endsWith(".mangadex.network") ||
    hostname.endsWith(".mangadex.org")
  );
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(urlParam);
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  if (imageUrl.protocol !== "https:" || !isMangaDexImageHost(imageUrl.hostname)) {
    return NextResponse.json({ error: "Unsupported image host" }, { status: 400 });
  }

  try {
    const upstream = await fetch(imageUrl, {
      headers: {
        Referer: MANGADEX_REFERER,
        "User-Agent": USER_AGENT,
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new NextResponse(null, {
        status: upstream.status,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const isCover = imageUrl.hostname === "uploads.mangadex.org";
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
        "Cache-Control": isCover
          ? "public, max-age=86400, immutable"
          : "no-store",
      },
    });
  } catch (error) {
    console.error("MangaDex image proxy failed:", error);
    return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });
  }
}
