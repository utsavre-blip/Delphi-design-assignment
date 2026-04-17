import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Server-side OG meta tag fetcher.
 *
 * Why server-side: Sites like X (Twitter), LinkedIn, etc. block cross-origin
 * browser fetches (CORS). By proxying through this route we can read their
 * HTML and extract og:image / twitter:image without any CORS issues.
 *
 * GET /api/og?url=<encoded-url>
 * Returns: { image: string|null, title: string|null, description: string|null }
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Basic validation — must be an http/https URL
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(parsed.toString(), {
      headers: {
        // Identify as Twitterbot — many platforms (LinkedIn, X, etc.)
        // serve their full OG tags to known crawlers.
        "User-Agent":
          "Mozilla/5.0 (compatible; Twitterbot/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json({ image: null, title: null, description: null });
    }

    // Only parse the first 100 KB — meta tags are always in <head>
    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ image: null, title: null, description: null });
    }

    let html = "";
    const decoder = new TextDecoder();
    const maxBytes = 100_000;
    let bytesRead = 0;

    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      bytesRead += value.byteLength;
      // Stop once we've passed </head> — no need to read the full body
      if (html.includes("</head>")) break;
    }
    reader.cancel();

    const image =
      extractMeta(html, "og:image") ??
      extractMeta(html, "twitter:image") ??
      extractMeta(html, "twitter:image:src");

    const title =
      extractMeta(html, "og:title") ??
      extractMeta(html, "twitter:title");

    const description =
      extractMeta(html, "og:description") ??
      extractMeta(html, "twitter:description");

    return NextResponse.json(
      { image, title, description },
      {
        headers: {
          // Cache for 1 hour; stale-while-revalidate for 24 hours
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    // Timeout, network error, etc. — return empty rather than 5xx
    return NextResponse.json({ image: null, title: null, description: null });
  }
}

/**
 * Extracts the content of an OG/Twitter meta tag from raw HTML.
 * Handles both attribute orderings:
 *   <meta property="og:image" content="…">
 *   <meta content="…" property="og:image">
 */
function extractMeta(html: string, property: string): string | null {
  const esc = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    // property="…" content="…"
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    // content="…" property="…"
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${esc}["']`,
      "i"
    ),
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }

  return null;
}

/** Decode common HTML entities that can appear inside attribute values */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}
