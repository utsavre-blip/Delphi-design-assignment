"use client";

import { useState, useRef, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  YoutubeLogo,
  TwitterLogo,
  LinkedinLogo,
  TiktokLogo,
  Globe,
  FilePdf,
  VideoCamera,
  Microphone,
  ShoppingBag,
} from "@phosphor-icons/react";
import { detectSourceType, SOURCE_LABELS, resolvePreviewImage, faviconUrl, webSiteName } from "@/lib/sourceType";
import type { Source, SourceType } from "@/lib/sourceType";

// ── Source type icon (Phosphor) ───────────────────────────────────────────────

function SourceIcon({ type, size = 11 }: { type: SourceType; size?: number }) {
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

// ── Hover card ───────────────────────────────────────────────────────────────

interface HoverCardProps {
  source: Source;
  sourceType: SourceType;
  anchorRect: DOMRect;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

function HoverCard({ source, sourceType, anchorRect, onMouseEnter, onMouseLeave, onClick }: HoverCardProps) {
  const label = sourceType === "web" ? webSiteName(source.url) : SOURCE_LABELS[sourceType];
  const favicon = faviconUrl(source.url, 64);
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const staticImage = resolvePreviewImage(source);

  const [ogImage, setOgImage] = useState<string | null>(null);
  const [ogDescription, setOgDescription] = useState<string | null>(null);
  const [ogFetching, setOgFetching] = useState(!staticImage);

  useEffect(() => {
    if (staticImage) return;
    let cancelled = false;
    setOgFetching(true);
    fetch(`/api/og?url=${encodeURIComponent(source.url)}`)
      .then((r) => r.json())
      .then((data: { image?: string | null; description?: string | null }) => {
        if (cancelled) return;
        if (data.image) setOgImage(data.image);
        if (data.description) setOgDescription(data.description);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setOgFetching(false);
      });
    return () => { cancelled = true; };
  }, [source.url, staticImage]);

  const effectiveImage = staticImage ?? ogImage;
  const hasImage = !!effectiveImage && !imgError;
  const isLoading = !staticImage && ogFetching;

  const CARD_W = 300;
  const IMG_W = 116;
  const IMG_H = 72;

  const cardLeft = anchorRect.left + anchorRect.width / 2 - CARD_W / 2;
  const cardTop = anchorRect.bottom + 6;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="fixed z-[9999] cursor-pointer"
      style={{ width: CARD_W, top: cardTop, left: cardLeft }}
    >
      {/* Invisible bridge so mouse can travel chip → card without triggering leave */}
      <div className="absolute -top-[8px] left-0 right-0 h-[8px]" />

      <div
        className="relative rounded-[14px] overflow-hidden flex flex-row"
        style={{
          background: "#2e2d2b",
          minHeight: IMG_H,
          boxShadow:
            "0px 8px 32px 0px rgba(0,0,0,0.44), inset 0px 1px 2px 0px rgba(255,255,255,0.06), inset 0px -1px 2px 0px rgba(0,0,0,0.2)",
        }}
      >
        {/* Left: image / shimmer */}
        <div className="flex-shrink-0 relative overflow-hidden" style={{ width: IMG_W, height: IMG_H }}>
          {hasImage ? (
            <img
              src={effectiveImage!}
              alt={source.title}
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          ) : isLoading ? (
            <div className="absolute inset-0 animate-pulse" style={{ background: "rgba(111,109,102,0.12)" }} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(111,109,102,0.08)" }}>
              <span style={{ color: "#4a4946", opacity: 0.6 }}>
                <SourceIcon type={sourceType} size={28} />
              </span>
            </div>
          )}
          <div
            className="absolute inset-y-0 right-0 w-6 pointer-events-none"
            style={{ background: "linear-gradient(to right, transparent, #2e2d2b)" }}
          />
        </div>

        {/* Right: text */}
        <div className="flex flex-col justify-between flex-1 min-w-0 px-2.5 py-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className="font-semibold leading-tight text-[#eeeeec] truncate min-w-0 block"
              style={{ fontSize: "12px" }}
              title={source.title}
            >
              {source.title}
            </span>
            {ogDescription && (
              <span className="leading-tight truncate text-[#8a8a84]" style={{ fontSize: "10px" }}>
                {ogDescription}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-[4px] overflow-hidden"
              style={{ width: 14, height: 14, background: "rgba(111,109,102,0.14)" }}
            >
              {favicon && !faviconError ? (
                <img
                  src={favicon}
                  alt={label}
                  width={10}
                  height={10}
                  onError={() => setFaviconError(true)}
                  className="rounded-[2px]"
                  draggable={false}
                />
              ) : (
                <span className="text-[#6b6a65] flex items-center justify-center">
                  <SourceIcon type={sourceType} size={8} />
                </span>
              )}
            </div>
            <span className="font-medium text-[#6b6a65] truncate leading-none" style={{ fontSize: "10.5px" }}>
              {label}
            </span>
          </div>
        </div>
      </div>

      {/* Caret */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-[5px] size-[10px] rotate-45 rounded-[2px]"
        style={{ background: "#2e2d2b" }}
      />
    </motion.div>,
    document.body
  );
}

// ── Citation highlight context ────────────────────────────────────────────────

export type CitationHighlight =
  | { paragraphIndex: number; sentenceIndex: number }
  | { paragraphIndex: number; sentenceIndex: "all" };

interface CitationHighlightContextType {
  /** Displayed highlight: hover takes priority over panel-active highlight */
  highlight: CitationHighlight | null;
  /**
   * Set hover highlight. `owner` is the citation number of the chip making the
   * call. Clearing only takes effect when the caller is still the current owner,
   * preventing a delayed timer on chip A from wiping chip B's highlight.
   */
  setHoverHighlight: (h: CitationHighlight | null, owner: number) => void;
  /** Which source key is currently open in the panel (null = panel closed) */
  activeKey: number | null;
  /** Open the panel for a specific source key + set its highlight */
  openPanel: (key: number, highlight: CitationHighlight | null) => void;
  /** Close the panel */
  closePanel: () => void;
  /** Navigate panel to a different key + update highlight */
  navigatePanel: (key: number, highlight: CitationHighlight | null) => void;
}

const CitationHighlightContext =
  createContext<CitationHighlightContextType | null>(null);

export function CitationHighlightProvider({ children }: { children: ReactNode }) {
  const [hoverHighlight, setHoverHighlightState] = useState<CitationHighlight | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<CitationHighlight | null>(null);
  const [activeKey, setActiveKey] = useState<number | null>(null);
  // Tracks which chip citation-number last claimed hover. Clears only happen
  // when the caller is still the current owner, so a lagged timer on chip A
  // can never wipe the highlight that chip B already set.
  const hoverOwnerRef = useRef<number | null>(null);

  const highlight = hoverHighlight ?? activeHighlight;

  const setHoverHighlight = useCallback((h: CitationHighlight | null, owner: number) => {
    if (h !== null) {
      hoverOwnerRef.current = owner;
      setHoverHighlightState(h);
    } else if (hoverOwnerRef.current === owner) {
      hoverOwnerRef.current = null;
      setHoverHighlightState(null);
    }
  }, []);

  function openPanel(key: number, h: CitationHighlight | null) {
    setActiveKey(key);
    setActiveHighlight(h);
  }

  function closePanel() {
    setActiveKey(null);
    setActiveHighlight(null);
  }

  function navigatePanel(key: number, h: CitationHighlight | null) {
    setActiveKey(key);
    setActiveHighlight(h);
  }

  return (
    <CitationHighlightContext.Provider
      value={{ highlight, setHoverHighlight, activeKey, openPanel, closePanel, navigatePanel }}
    >
      {children}
    </CitationHighlightContext.Provider>
  );
}

export function useCitationHighlight() {
  const ctx = useContext(CitationHighlightContext);
  if (!ctx) throw new Error("useCitationHighlight must be used within CitationHighlightProvider");
  return ctx;
}

function useCitationHighlightOptional() {
  return useContext(CitationHighlightContext);
}

// ── Citation chip ─────────────────────────────────────────────────────────────

interface CitationChipProps {
  number: number;
  source: Source;
  paragraphIndex: number;
  footnoteIndex: number;
  sentenceAligned: boolean;
}

export default function CitationChip({
  number,
  source,
  paragraphIndex,
  footnoteIndex,
  sentenceAligned,
}: CitationChipProps) {
  const [hovered, setHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const ctx = useCitationHighlightOptional();
  const sourceType = source.type ?? detectSourceType(source.url);
  const label = sourceType === "web" ? webSiteName(source.url) : SOURCE_LABELS[sourceType];

  const chipHighlight: CitationHighlight = {
    paragraphIndex,
    sentenceIndex: sentenceAligned ? footnoteIndex : "all",
  };

  const isActive = ctx?.activeKey === number;

  function handleChipEnter() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (chipRef.current) setAnchorRect(chipRef.current.getBoundingClientRect());
    setHovered(true);
    ctx?.setHoverHighlight(chipHighlight, number);
  }

  // The card's enter handler must NOT update anchorRect — doing so repositions
  // the card while the pointer is already over it, causing onMouseLeave to
  // silently miss and leaving the card stuck open.
  function handleCardEnter() {
    if (timerRef.current) clearTimeout(timerRef.current);
    ctx?.setHoverHighlight(chipHighlight, number);
  }

  function hideHover() {
    const myNumber = number;
    timerRef.current = setTimeout(() => {
      setHovered(false);
      ctx?.setHoverHighlight(null, myNumber);
    }, 150);
  }

  function handleClick() {
    if (ctx) {
      if (isActive) {
        ctx.closePanel();
      } else {
        ctx.openPanel(number, chipHighlight);
      }
    } else {
      window.open(source.url, "_blank", "noopener,noreferrer");
    }
    setHovered(false);
    ctx?.setHoverHighlight(null, number);
  }

  return (
    <span className="relative inline-flex items-center" style={{ verticalAlign: "middle" }}>
      <motion.button
        ref={chipRef}
        onMouseEnter={handleChipEnter}
        onMouseLeave={hideHover}
        onClick={handleClick}
        whileTap={{ scale: 0.91 }}
        className="inline-flex items-center gap-[4px] h-[18px] rounded-full px-[7px] py-px ml-[2px] cursor-pointer select-none transition-colors duration-100"
        style={{
          background: isActive
            ? "rgba(111, 109, 102, 0.22)"
            : "rgba(111, 109, 102, 0.1)",
          border: "1px solid rgba(0, 0, 0, 0)",
        }}
        aria-label={`Citation ${number}: ${source.title}`}
        aria-pressed={isActive}
      >
        <span className="text-[#b4b3ad] flex items-center justify-center leading-none">
          <SourceIcon type={sourceType} size={11} />
        </span>
        <span
          className="font-medium text-center leading-[15.68px] text-[#b4b3ad] whitespace-nowrap"
          style={{ fontSize: "11.2px" }}
        >
          {label}
        </span>
      </motion.button>

      <AnimatePresence>
        {hovered && anchorRect && !isActive && (
          <HoverCard
            source={source}
            sourceType={sourceType}
            anchorRect={anchorRect}
            onMouseEnter={handleCardEnter}
            onMouseLeave={hideHover}
            onClick={handleClick}
          />
        )}
      </AnimatePresence>
    </span>
  );
}
