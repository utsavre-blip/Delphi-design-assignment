export type SourceType =
  | "youtube"
  | "twitter"
  | "linkedin"
  | "video"
  | "pdf"
  | "podcast"
  | "tiktok"
  | "amazon"
  | "web";

export interface Source {
  url: string;
  title: string;
  /** Override auto-detected type */
  type?: SourceType;
  /** Optional preview image URL — auto-derived for YouTube, manual for others */
  image?: string;
  /** Start offset in seconds (used for YouTube embeds) */
  timestamp?: number;
}

/**
 * Parse a YouTube `t` param into seconds.
 * Handles: plain seconds ("123"), compact ("1m23s", "1h2m3s"), ISO-ish ("1:23").
 */
export function parseYouTubeTimestamp(t: string): number {
  // Already plain seconds
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  // h/m/s notation e.g. "1h2m3s", "2m30s", "45s"
  const hms = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (hms) {
    const h = parseInt(hms[1] ?? "0", 10);
    const m = parseInt(hms[2] ?? "0", 10);
    const s = parseInt(hms[3] ?? "0", 10);
    const total = h * 3600 + m * 60 + s;
    if (total > 0) return total;
  }
  // mm:ss or hh:mm:ss
  const colon = t.split(":").map(Number);
  if (colon.length === 2) return colon[0] * 60 + colon[1];
  if (colon.length === 3) return colon[0] * 3600 + colon[1] * 60 + colon[2];
  return 0;
}

/**
 * Extract the start timestamp (in seconds) from a YouTube URL's `t` or `start`
 * query param, or from the URL hash. Returns null if none found.
 */
export function extractYouTubeTimestamp(url: string): number | null {
  try {
    const { searchParams, hash } = new URL(url);
    const t = searchParams.get("t") ?? searchParams.get("start") ?? hash.replace(/^#/, "");
    if (t) {
      const secs = parseYouTubeTimestamp(t);
      if (secs > 0) return secs;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Extract YouTube video ID from any standard YouTube URL format */
export function extractYouTubeId(url: string): string | null {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    const host = hostname.replace(/^www\./, "");
    if (host === "youtu.be") return pathname.slice(1).split("?")[0];
    if (host === "youtube.com") {
      if (pathname.startsWith("/watch")) return searchParams.get("v");
      if (pathname.startsWith("/embed/") || pathname.startsWith("/shorts/"))
        return pathname.split("/")[2];
    }
  } catch {
    // ignore
  }
  return null;
}

/** Best-available YouTube thumbnail URL for a given video ID */
export function youtubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/** Google favicon CDN — works for nearly every domain, no API key required */
export function faviconUrl(url: string, size = 64): string {
  try {
    const { origin } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=${size}`;
  } catch {
    return "";
  }
}

/** Resolve the best preview image for a source (may return null) */
export function resolvePreviewImage(source: Source): string | null {
  if (source.image) return source.image;
  const type = source.type ?? detectSourceType(source.url);
  if (type === "youtube") {
    const id = extractYouTubeId(source.url);
    if (id) return youtubeThumbnail(id);
  }
  // LinkedIn blocks automated HTML/OG fetches (HTTP 999 / auth wall). A large
  // favicon from Google's CDN is reliable and reads as a LinkedIn “preview”.
  if (type === "linkedin") {
    return faviconUrl(source.url, 128);
  }
  return null;
}

export function detectSourceType(url: string): SourceType {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "youtu.be") return "youtube";
    if (host === "twitter.com" || host === "x.com") return "twitter";
    if (host === "linkedin.com") return "linkedin";
    if (host === "tiktok.com") return "tiktok";
    if (host === "amazon.com" || host.startsWith("amazon.")) return "amazon";
    if (
      host === "open.spotify.com" ||
      host === "podcasts.apple.com" ||
      host === "overcast.fm" ||
      host === "pocketcasts.com" ||
      host === "listennotes.com" ||
      host === "anchor.fm" ||
      host === "buzzsprout.com"
    )
      return "podcast";

    const ext = pathname.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "mp4" || ext === "mov" || ext === "webm") return "video";

    return "web";
  } catch {
    return "web";
  }
}

export const SOURCE_LABELS: Record<SourceType, string> = {
  youtube: "YouTube",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  video: "Video",
  pdf: "PDF",
  podcast: "Podcast",
  tiktok: "TikTok",
  amazon: "Amazon",
  web: "Web",
};

/**
 * Returns a human-friendly site name for a web URL.
 * e.g. "https://en.wikipedia.org/wiki/Foo" → "Wikipedia"
 *      "https://www.healthline.com/…"       → "Healthline"
 * Falls back to "Web" if the URL can't be parsed.
 */
export function webSiteName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    // Take the second-level domain (last segment before the TLD)
    const parts = host.split(".");
    const sld = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return sld.charAt(0).toUpperCase() + sld.slice(1);
  } catch {
    return "Web";
  }
}
