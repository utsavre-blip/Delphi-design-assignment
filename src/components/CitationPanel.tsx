"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretLeft,
  CaretRight,
  ArrowSquareOut,
  X,
  Plus,
  YoutubeLogo,
  TwitterLogo,
  LinkedinLogo,
  TiktokLogo,
  Globe,
  FilePdf,
  VideoCamera,
  Microphone,
  ShoppingBag,
  MagnifyingGlass,
  Trash,
  UploadSimple,
  Link,
} from "@phosphor-icons/react";
import {
  detectSourceType,
  SOURCE_LABELS,
  faviconUrl,
  webSiteName,
  extractYouTubeId,
  extractYouTubeTimestamp,
} from "@/lib/sourceType";
import type { Source, SourceType } from "@/lib/sourceType";

// ── Source type icon (Phosphor) ───────────────────────────────────────────────

function SourceTypeIcon({ type, size = 16 }: { type: SourceType; size?: number }) {
  const p = { size, weight: "fill" as const };
  switch (type) {
    case "youtube":  return <YoutubeLogo {...p} />;
    case "twitter":  return <TwitterLogo {...p} />;
    case "linkedin": return <LinkedinLogo {...p} />;
    case "tiktok":   return <TiktokLogo {...p} />;
    case "podcast":  return <Microphone {...p} />;
    case "pdf":      return <FilePdf {...p} />;
    case "video":    return <VideoCamera {...p} />;
    case "amazon":   return <ShoppingBag {...p} />;
    default:         return <Globe {...p} />;
  }
}

// Per-type accent colors
const TYPE_COLOR: Record<SourceType, string> = {
  youtube:  "#FF4444",
  twitter:  "#1D9BF0",
  linkedin: "#0A66C2",
  tiktok:   "#69C9D0",
  podcast:  "#9F5BFF",
  pdf:      "#E45B28",
  video:    "#5856D6",
  amazon:   "#FF9900",
  web:      "#8a8a84",
};

function sourceLabel(source: Source): string {
  const type = source.type ?? detectSourceType(source.url);
  if (type === "web") return webSiteName(source.url);
  return SOURCE_LABELS[type];
}

// ── Inline source picker (slides in within the panel) ────────────────────────

interface InlinePickerProps {
  available: Array<{ key: number; source: Source }>;
  onAdd: (key: number, source: Source) => void;
  onClose: () => void;
  onUpload?: (file: File) => void;
  onAddUrl?: (url: string) => void;
}

function InlinePicker({ available, onAdd, onClose, onUpload, onAddUrl }: InlinePickerProps) {
  const [query, setQuery] = useState("");
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = available.filter(
    ({ source }) =>
      !query ||
      source.title.toLowerCase().includes(query.toLowerCase()) ||
      sourceLabel(source).toLowerCase().includes(query.toLowerCase())
  );

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload?.(file);
    e.target.value = "";
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    onAddUrl?.(trimmed);
    setUrlValue("");
    setUrlMode(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col"
    >
      {/* Search row */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <MagnifyingGlass size={12} color="#5a5956" weight="bold" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sources…"
          className="flex-1 bg-transparent border-none outline-none text-[#eeeeec] placeholder:text-[#3a3936] font-medium"
          style={{ fontSize: "12px" }}
        />
      </div>

      {/* Source list */}
      <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 240 }}>
        {/* Upload action */}
        <button
          onClick={handleUploadClick}
          className="flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100 group"
          style={{ background: "transparent" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "transparent")
          }
        >
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-[5px]"
            style={{ width: 22, height: 22, background: "rgba(232,98,42,0.12)", color: "#E8622A" }}
          >
            <UploadSimple size={11} weight="bold" />
          </div>
          <span
            className="text-[#c8c7c1] font-medium leading-none group-hover:text-[#eeeeec] transition-colors flex-1"
            style={{ fontSize: "12px" }}
          >
            Upload file
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Add link / URL action */}
        {urlMode ? (
          <form
            onSubmit={handleUrlSubmit}
            className="flex items-center gap-2 px-3 py-2"
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-[5px]"
              style={{ width: 22, height: 22, background: "rgba(138,138,132,0.12)", color: "#8a8a84" }}
            >
              <Link size={11} weight="bold" />
            </div>
            <input
              autoFocus
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="Paste URL…"
              className="flex-1 bg-transparent border-none outline-none text-[#eeeeec] placeholder:text-[#3a3936] font-medium"
              style={{ fontSize: "12px" }}
            />
            <button
              type="button"
              onClick={() => { setUrlMode(false); setUrlValue(""); }}
              className="flex-shrink-0 opacity-30 hover:opacity-60 transition-opacity"
              style={{ color: "#b4b3ad" }}
            >
              <X size={11} weight="bold" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setUrlMode(true)}
            className="flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100 group"
            style={{ background: "transparent" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-[5px]"
              style={{ width: 22, height: 22, background: "rgba(138,138,132,0.12)", color: "#8a8a84" }}
            >
              <Link size={11} weight="bold" />
            </div>
            <span
              className="text-[#c8c7c1] font-medium leading-none group-hover:text-[#eeeeec] transition-colors flex-1"
              style={{ fontSize: "12px" }}
            >
              Add link / URL
            </span>
          </button>
        )}

        {/* Available sources */}
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-5">
            <span className="text-[#3a3936]" style={{ fontSize: "11.5px" }}>
              No sources available
            </span>
          </div>
        ) : (
          filtered.map(({ key, source }) => {
            const type = source.type ?? detectSourceType(source.url);
            const color = TYPE_COLOR[type];
            const favicon = faviconUrl(source.url, 32);
            return (
              <button
                key={key}
                onClick={() => onAdd(key, source)}
                className="flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100 group"
                style={{ background: "transparent" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-[5px]"
                  style={{ width: 22, height: 22, background: `${color}15`, color }}
                >
                  {favicon ? (
                    <img src={favicon} alt="" width={12} height={12} className="rounded-[3px]" draggable={false} />
                  ) : (
                    <SourceTypeIcon type={type} size={11} />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span
                    className="text-[#c8c7c1] font-medium leading-none truncate group-hover:text-[#eeeeec] transition-colors"
                    style={{ fontSize: "12px" }}
                  >
                    {source.title}
                  </span>
                  <span className="text-[#4a4946] leading-none truncate" style={{ fontSize: "10px" }}>
                    {sourceLabel(source)}
                  </span>
                </div>
                <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#E8622A" }}>
                  <Plus size={12} weight="bold" />
                </span>
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// ── Embed: YouTube ────────────────────────────────────────────────────────────

function YouTubeEmbed({ videoId, start }: { videoId: string; start?: number }) {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (start && start > 0) params.set("start", String(start));

  return (
    <div
      className="relative w-full overflow-hidden rounded-[10px]"
      style={{ aspectRatio: "16 / 9" }}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}

// ── Embed: Listen Notes podcast ───────────────────────────────────────────────

function ListenNotesEmbed({ url }: { url: string }) {
  const embedUrl = url.endsWith("/") ? url + "embed/" : url + "/embed/";
  return (
    <div className="overflow-hidden -mx-3 -mb-3">
      <iframe
        src={embedUrl}
        height="180"
        style={{ width: "1px", minWidth: "100%", display: "block" }}
        frameBorder={0}
        scrolling="no"
        loading="lazy"
        title="Podcast episode"
      />
    </div>
  );
}

// ── Embed: OG preview card ────────────────────────────────────────────────────

interface OGData {
  image?: string | null;
  description?: string | null;
}

function OGPreviewEmbed({
  source,
  sourceType,
}: {
  source: Source;
  sourceType: SourceType;
}) {
  const [ogData, setOgData] = useState<OGData>({});
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [loading, setLoading] = useState(true);

  const staticImage = source.image ?? null;

  useEffect(() => {
    if (staticImage) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/og?url=${encodeURIComponent(source.url)}`)
      .then((r) => r.json())
      .then((data: OGData) => { if (!cancelled) setOgData(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [source.url, staticImage]);

  const image = staticImage ?? ogData.image;
  const description = ogData.description;
  const favicon = faviconUrl(source.url, 64);
  const siteName = sourceType === "web" ? webSiteName(source.url) : SOURCE_LABELS[sourceType];
  const accentColor = TYPE_COLOR[sourceType];
  const IMG_W = 130;
  const CARD_H = 88;

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-row no-underline group cursor-pointer rounded-[10px] overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        minHeight: CARD_H,
      }}
    >
      <div className="flex-shrink-0 relative overflow-hidden" style={{ width: IMG_W, minHeight: CARD_H }}>
        {loading ? (
          <div className="absolute inset-0 animate-pulse" style={{ background: "rgba(111,109,102,0.12)" }} />
        ) : image && !imgError ? (
          <img
            src={image}
            alt={source.title}
            onError={() => setImgError(true)}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(111,109,102,0.06)" }}>
            <span style={{ color: accentColor, opacity: 0.45 }}>
              <SourceTypeIcon type={sourceType} size={28} />
            </span>
          </div>
        )}
        <div
          className="absolute inset-y-0 right-0 w-5 pointer-events-none"
          style={{ background: "linear-gradient(to right, transparent, rgba(30,30,28,0.6))" }}
        />
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0 px-3 py-2.5">
        <span
          className="font-semibold text-[#eeeeec] leading-snug"
          style={{
            fontSize: "12.5px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {source.title}
        </span>
        {description && (
          <span
            className="text-[#8a8a84] leading-snug"
            style={{
              fontSize: "11px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </span>
        )}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-[3px] overflow-hidden"
            style={{ width: 14, height: 14, background: "rgba(111,109,102,0.18)" }}
          >
            {favicon && !faviconError ? (
              <img
                src={favicon}
                alt=""
                width={10}
                height={10}
                onError={() => setFaviconError(true)}
                className="rounded-[2px]"
                draggable={false}
              />
            ) : (
              <span style={{ color: accentColor }}>
                <SourceTypeIcon type={sourceType} size={9} />
              </span>
            )}
          </div>
          <span className="text-[#6b6a65] truncate flex-1" style={{ fontSize: "10.5px" }}>{siteName}</span>
          <span className="flex-shrink-0 text-[#6b6a65] group-hover:text-[#b4b3ad] transition-colors duration-150">
            <ArrowSquareOut size={12} />
          </span>
        </div>
      </div>
    </a>
  );
}

// ── Embed router ──────────────────────────────────────────────────────────────

function EmbedContent({ source, sourceType }: { source: Source; sourceType: SourceType }) {
  if (sourceType === "youtube") {
    const videoId = extractYouTubeId(source.url);
    if (videoId) {
      const start = source.timestamp ?? extractYouTubeTimestamp(source.url) ?? undefined;
      return <YouTubeEmbed videoId={videoId} start={start} />;
    }
  }
  if (sourceType === "podcast") {
    try {
      const hostname = new URL(source.url).hostname.replace(/^www\./, "");
      if (hostname === "listennotes.com") return <ListenNotesEmbed url={source.url} />;
    } catch { /* fall through */ }
  }
  return <OGPreviewEmbed source={source} sourceType={sourceType} />;
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export interface CitationPanelItem {
  key: number;
  source: Source;
  clipCount: number;
}

interface CitationPanelProps {
  items: CitationPanelItem[];
  activeKey: number;
  onNavigate: (key: number) => void;
  onClose: () => void;
  isTraining?: boolean;
  onRemoveSource?: (key: number) => void;
  onAddSource?: (key: number, source: Source) => void;
  availableSources?: Array<{ key: number; source: Source }>;
}

const contentVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -28 }),
};

export default function CitationPanel({
  items,
  activeKey,
  onNavigate,
  onClose,
  isTraining,
  onRemoveSource,
  onAddSource,
  availableSources = [],
}: CitationPanelProps) {
  const [showPicker, setShowPicker] = useState(false);
  const activeIndex = items.findIndex((it) => it.key === activeKey);
  const activeItem = items[activeIndex];
  const directionRef = useRef<number>(1);
  const prevKeyRef = useRef(activeKey);

  const oldIndex = items.findIndex((it) => it.key === prevKeyRef.current);
  if (prevKeyRef.current !== activeKey) {
    directionRef.current = activeIndex >= oldIndex ? 1 : -1;
    prevKeyRef.current = activeKey;
  }

  // Close picker when panel closes
  useEffect(() => {
    setShowPicker(false);
  }, [activeKey]);

  if (!activeItem) return null;

  const sourceType = activeItem.source.type ?? detectSourceType(activeItem.source.url);
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;

  const go = useCallback(
    (delta: 1 | -1) => {
      const next = activeIndex + delta;
      if (next >= 0 && next < items.length) {
        onNavigate(items[next].key);
        setShowPicker(false);
      }
    },
    [activeIndex, items, onNavigate]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [go]);

  function handleRemove() {
    if (items.length > 1) {
      const nextItem = canNext ? items[activeIndex + 1] : items[activeIndex - 1];
      onNavigate(nextItem.key);
    } else {
      onClose();
    }
    onRemoveSource?.(activeKey);
  }

  function handleAdd(key: number, source: Source) {
    onAddSource?.(key, source);
    setShowPicker(false);
    onNavigate(key);
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "#191918",
        border: "1px solid rgba(255,255,255,0.04)",
        borderTop: "none",
        borderRadius: "0 0 16px 16px",
      }}
    >
      {/* ── Header row ── */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
        <span className="font-medium text-[#eeeeec] leading-none select-none" style={{ fontSize: "12.5px" }}>
          Sources
        </span>

        {/* Prev / Next */}
        <div className="flex items-center gap-0.5 ml-1">
          <button
            onClick={() => go(-1)}
            disabled={!canPrev}
            className="flex items-center justify-center rounded-full transition-colors duration-100 disabled:opacity-20"
            style={{ width: 20, height: 20, color: "#b4b3ad" }}
            aria-label="Previous source"
          >
            <CaretLeft size={11} weight="bold" />
          </button>
          <button
            onClick={() => go(1)}
            disabled={!canNext}
            className="flex items-center justify-center rounded-full transition-colors duration-100 disabled:opacity-20"
            style={{ width: 20, height: 20, color: "#b4b3ad" }}
            aria-label="Next source"
          >
            <CaretRight size={11} weight="bold" />
          </button>
        </div>

        {/* Counter */}
        {items.length > 1 && (
          <span className="font-medium text-[#6b6a65] leading-none" style={{ fontSize: "11px" }}>
            {activeIndex + 1} / {items.length}
          </span>
        )}

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-1.5">
          {isTraining ? (
            <>
              {/* Remove current source */}
              {!showPicker && (
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-1 rounded-[7px] px-2 py-1 transition-all duration-150"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "#8a8a84",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#E8622A";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,98,42,0.22)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(232,98,42,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#8a8a84";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  }}
                  aria-label="Remove source"
                >
                  <Trash size={11} />
                  <span className="font-medium leading-none" style={{ fontSize: "11px" }}>
                    Remove
                  </span>
                </button>
              )}

              {/* Add source */}
              <button
                onClick={() => setShowPicker((v) => !v)}
                className="flex items-center gap-1 rounded-[7px] px-2 py-1 transition-all duration-150"
                style={{
                  background: showPicker ? "rgba(232,98,42,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${showPicker ? "rgba(232,98,42,0.22)" : "rgba(255,255,255,0.07)"}`,
                  color: showPicker ? "#E8622A" : "#8a8a84",
                }}
                aria-label="Add source"
              >
                <Plus
                  size={11}
                  weight="bold"
                  style={{
                    transform: showPicker ? "rotate(45deg)" : "rotate(0deg)",
                    transition: "transform 0.18s ease",
                  }}
                />
                <span className="font-medium leading-none" style={{ fontSize: "11px" }}>
                  {showPicker ? "Close" : "Add"}
                </span>
              </button>
            </>
          ) : (
            <span
              className="font-normal text-[#b4b3ad] leading-none cursor-pointer hover:text-[#eeeeec] transition-colors duration-150 select-none"
              style={{ fontSize: "12px" }}
            >
              View all
            </span>
          )}

          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full transition-colors duration-150 hover:opacity-100 opacity-50"
            style={{ width: 20, height: 20, color: "#b4b3ad" }}
            aria-label="Close sources"
          >
            <X size={12} weight="bold" />
          </button>
        </div>
      </div>

      {/* ── Body: picker or embed ── */}
      <AnimatePresence mode="wait" initial={false}>
        {showPicker ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <InlinePicker
              available={availableSources}
              onAdd={handleAdd}
              onClose={() => setShowPicker(false)}
            />
            {/* Bottom padding so the panel height is stable */}
            <div style={{ height: 12 }} />
          </motion.div>
        ) : (
          <motion.div
            key="embed-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
          >
            {/* Sliding embed area */}
            <div className="relative overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false} custom={directionRef.current}>
                <motion.div
                  key={activeKey}
                  custom={directionRef.current}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="px-3 pb-3 flex flex-col gap-2"
                  style={{ width: "100%" }}
                >
                  <EmbedContent source={activeItem.source} sourceType={sourceType} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
