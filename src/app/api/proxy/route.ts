import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlParam = searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json({ error: "Missing URL param" }, { status: 400 });
  }

  const externalUrl = `https://gomanga-api.vercel.app${urlParam}`;

  try {
    const res = await fetch(externalUrl);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
