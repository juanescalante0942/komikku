/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GOMANGA_BASE =
  process.env.GOMANGA_API_BASE || "https://gomanga-api.vercel.app/api/search/";

// helper: extract titles & reasons from Gemini’s numbered list
function parseAiText(text: string) {
  const lines = text.split(/\n/).filter(Boolean);
  const suggestions: { title: string; reason: string }[] = [];

  for (const line of lines) {
    const match = line.match(/^\d+\.\s*\*\*(.*?)\*\*:? (.*)$/);
    if (match) {
      suggestions.push({
        title: match[1].trim(),
        reason: match[2].trim(),
      });
    }
  }
  return suggestions;
}

// helper: normalize a title for API search
function normalizeTitleForSearch(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function generateWithRetry(ai: GoogleGenAI, prompt: string) {
  const models = ["gemini-2.5-flash", "gemini-1.5-flash"]; // primary + fallback
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        return res.text || "";
      } catch (err: any) {
        const message = err?.message || "";
        if (
          message.includes("overloaded") ||
          err?.error?.status === "UNAVAILABLE"
        ) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
          continue;
        }
        throw err;
      }
    }
  }
  throw new Error("All model attempts failed due to overload or other issues.");
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query)
      return NextResponse.json({ error: "missing query" }, { status: 400 });

    const ai = new GoogleGenAI({});

    const systemPrompt = `You are a helpful assistant that suggests manga titles matching the user's query.
Return up to 6 suggestions. Do NOT invent titles if unsure — put "unknown" as the title or omit it. Keep reasons short (2-4 sentences). Format as a numbered list:
1. **Title**: Reason
2. **Title**: Reason
...`;

    const text = await generateWithRetry(
      ai,
      `${systemPrompt}\nUser query: "${query}"`
    );

    console.log("Gemini raw output:", text);

    const suggestions = parseAiText(text).slice(0, 6);

    // Search GoManga API for each suggestion
    const results = await Promise.all(
      suggestions.map(async (s) => {
        let apiData = null;
        try {
          const searchTitle = normalizeTitleForSearch(s.title);
          const r = await fetch(
            `${GOMANGA_BASE}${encodeURIComponent(searchTitle)}`
          );
          if (r.ok) {
            const json = await r.json();
            if (json?.count > 0) {
              apiData = json.manga.map((m: any) => ({
                ...m,
                link: `/manga/${m.id}`,
              }));
            }
          }
        } catch (err) {
          console.error(`Error fetching for "${s.title}":`, err);
        }
        return { title: s.title, reason: s.reason, api: apiData || [] };
      })
    );

    const anyFound = results.some((r) => r.api && r.api.length > 0);

    if (!anyFound) {
      const fallbackR = await fetch(
        `${GOMANGA_BASE}${encodeURIComponent(normalizeTitleForSearch(query))}`
      );
      const fallbackData = fallbackR.ok ? await fallbackR.json() : null;
      return NextResponse.json({
        fallback: true,
        query,
        reason:
          "No AI suggestions returned usable manga, searching original query instead.",
        fallbackData,
      });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Internal error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
