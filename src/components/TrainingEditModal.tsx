"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  CheckCircle,
} from "@phosphor-icons/react";
import {
  detectSourceType,
  SOURCE_LABELS,
  faviconUrl,
  webSiteName,
} from "@/lib/sourceType";
import type { Source, SourceType } from "@/lib/sourceType";

// ── Source type icon (mirrors CitationPanel) ────────────────────────────────

function SourceTypeIcon({ type, size = 14 }: { type: SourceType; size?: number }) {
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

// ── Source row chip inside the modal ────────────────────────────────────────

interface SourceChipProps {
  sourceKey: number;
  source: Source;
  isNew?: boolean;
  onRemove: (key: number) => void;
}

function SourceChip({ sourceKey, source, isNew, onRemove }: SourceChipProps) {
  const type = source.type ?? detectSourceType(source.url);
  const color = TYPE_COLOR[type];
  const [shimmerDone, setShimmerDone] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const favicon = faviconUrl(source.url, 32);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setShimmerDone(true), 900);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 6, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center gap-2.5 px-3 py-2 rounded-[11px] overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Shimmer sweep on newly added sources */}
      {isNew && !shimmerDone && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-[11px]"
          style={{ zIndex: 10 }}
        >
          <div
            className="shimmer-sweep absolute inset-y-0"
            style={{
              width: "60%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
            }}
          />
        </div>
      )}

      {/* Icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-[6px]"
        style={{
          width: 26,
          height: 26,
          background: `${color}18`,
          color,
        }}
      >
        {favicon && !faviconError ? (
          <img
            src={favicon}
            alt=""
            width={13}
            height={13}
            className="rounded-[3px]"
            draggable={false}
            onError={() => setFaviconError(true)}
          />
        ) : (
          <SourceTypeIcon type={type} size={13} />
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span
          className="text-[#eeeeec] font-medium leading-none truncate"
          style={{ fontSize: "12.5px" }}
        >
          {source.title}
        </span>
        <span
          className="text-[#6b6a65] leading-none truncate"
          style={{ fontSize: "10.5px" }}
        >
          {sourceLabel(source)}
        </span>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(sourceKey)}
        className="flex-shrink-0 flex items-center justify-center rounded-full opacity-30 hover:opacity-70 transition-opacity duration-150"
        style={{ width: 20, height: 20, color: "#b4b3ad" }}
        aria-label="Remove source"
      >
        <X size={11} weight="bold" />
      </button>
    </motion.div>
  );
}

// ── Source picker panel (slides in below the add button) ────────────────────

interface SourcePickerProps {
  available: Array<{ key: number; source: Source }>;
  onAdd: (key: number, source: Source) => void;
  onClose: () => void;
}

function SourcePickerPanel({ available, onAdd, onClose }: SourcePickerProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = available.filter(
    ({ source }) =>
      !query ||
      source.title.toLowerCase().includes(query.toLowerCase()) ||
      sourceLabel(source).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col rounded-[14px] overflow-hidden"
      style={{
        background: "#191918",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Search header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <MagnifyingGlass size={13} color="#5a5956" weight="bold" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sources…"
          className="flex-1 bg-transparent border-none outline-none text-[#eeeeec] placeholder:text-[#4a4946] font-medium"
          style={{ fontSize: "12.5px" }}
        />
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-30 hover:opacity-60 transition-opacity"
          style={{ color: "#b4b3ad" }}
        >
          <X size={12} weight="bold" />
        </button>
      </div>

      {/* Source list */}
      <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 220 }}>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <span className="text-[#4a4946]" style={{ fontSize: "12px" }}>
              No sources available
            </span>
          </div>
        ) : (
          filtered.map(({ key, source }) => {
            const type = source.type ?? detectSourceType(source.url);
            const color = TYPE_COLOR[type];
            return (
              <button
                key={key}
                onClick={() => {
                  onAdd(key, source);
                  onClose();
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-100 group"
                style={{ background: "transparent" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.03)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                {/* Icon */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-[5px]"
                  style={{
                    width: 24,
                    height: 24,
                    background: `${color}15`,
                    color,
                  }}
                >
                  <SourceTypeIcon type={type} size={12} />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span
                    className="text-[#c8c7c1] font-medium leading-none truncate group-hover:text-[#eeeeec] transition-colors"
                    style={{ fontSize: "12px" }}
                  >
                    {source.title}
                  </span>
                  <span
                    className="text-[#4a4946] leading-none truncate"
                    style={{ fontSize: "10px" }}
                  >
                    {sourceLabel(source)}
                  </span>
                </div>

                {/* Add indicator */}
                <div
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ color: "#E8622A" }}
                >
                  <Plus size={13} weight="bold" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────

interface TrainingEditModalProps {
  question: string;
  paragraphs: Array<{ text: string; footnotes?: number[] }>;
  sources: Record<number, Source>;
  allAvailableSources: Record<number, Source>;
  onSave: (
    paragraphs: Array<{ text: string; footnotes?: number[] }>,
    sources: Record<number, Source>
  ) => void;
  onDismiss: () => void;
}

export default function TrainingEditModal({
  question,
  paragraphs,
  sources,
  allAvailableSources,
  onSave,
  onDismiss,
}: TrainingEditModalProps) {
  // Draft state
  const [draftText, setDraftText] = useState(
    () => paragraphs.map((p) => p.text).join("\n\n")
  );
  const [draftSources, setDraftSources] = useState<Record<number, Source>>(
    () => ({ ...sources })
  );
  // Flat ordered list of footnote keys present in this response
  const [draftFootnotes, setDraftFootnotes] = useState<number[]>(() => {
    const seen = new Set<number>();
    const ordered: number[] = [];
    for (const p of paragraphs) {
      for (const k of p.footnotes ?? []) {
        if (!seen.has(k) && sources[k]) {
          seen.add(k);
          ordered.push(k);
        }
      }
    }
    return ordered;
  });
  const [newlyAddedKey, setNewlyAddedKey] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`;
  }, [draftText]);

  // Close picker on outside click via Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showPicker) {
          setShowPicker(false);
        } else {
          onDismiss();
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showPicker, onDismiss]);

  const handleRemoveSource = useCallback((key: number) => {
    setDraftSources((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDraftFootnotes((prev) => prev.filter((k) => k !== key));
  }, []);

  const handleAddSource = useCallback((key: number, source: Source) => {
    setDraftSources((prev) => ({ ...prev, [key]: source }));
    setDraftFootnotes((prev) =>
      prev.includes(key) ? prev : [...prev, key]
    );
    setNewlyAddedKey(key);
    setTimeout(() => setNewlyAddedKey(null), 1200);
  }, []);

  function handleSave() {
    // Re-build paragraphs: split draft text back into chunks, re-attach footnotes
    const rawParas = draftText
      .split(/\n\n+/)
      .map((t) => t.trim())
      .filter(Boolean);

    // Distribute footnotes: preserve original para-footnote mapping where text matches,
    // otherwise append remaining footnotes to the last paragraph
    const originalFootnoteMap = new Map<string, number[]>();
    for (const p of paragraphs) {
      if (p.footnotes?.length) {
        originalFootnoteMap.set(
          p.text.slice(0, 40),
          p.footnotes.filter((k) => draftSources[k] !== undefined)
        );
      }
    }

    const usedKeys = new Set<number>();
    const newParagraphs = rawParas.map((text, i) => {
      const matchKey = text.slice(0, 40);
      const mapped = originalFootnoteMap.get(matchKey);
      if (mapped) {
        mapped.forEach((k) => usedKeys.add(k));
        return { text, footnotes: mapped };
      }
      // Last paragraph gets any remaining footnotes
      if (i === rawParas.length - 1) {
        const remaining = draftFootnotes.filter((k) => !usedKeys.has(k));
        return { text, footnotes: remaining };
      }
      return { text, footnotes: [] };
    });

    onSave(newParagraphs, draftSources);
  }

  // Available sources = all known - already in response
  const available = Object.entries(allAvailableSources)
    .map(([k, s]) => ({ key: Number(k), source: s }))
    .filter(({ key }) => !draftSources[key]);

  const hasChanges =
    draftText !== paragraphs.map((p) => p.text).join("\n\n") ||
    JSON.stringify(draftSources) !== JSON.stringify(sources);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !showPicker) onDismiss();
        }}
      />

      {/* Modal card */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
      >
        <div
          className="relative flex flex-col pointer-events-auto w-full"
          style={{
            maxWidth: 620,
            maxHeight: "88vh",
            background: "#1a1a19",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Inner top rim */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[24px]"
            style={{
              boxShadow:
                "inset 0px 1px 2px 0px rgba(255, 255, 255, 0.06), inset 0px -1px 2px 0px rgba(0, 0, 0, 0.25)",
            }}
          />

          {/* ── Header ── */}
          <div
            className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            {/* Delphi mark */}
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(232, 98, 42, 0.15)",
                border: "1px solid rgba(232, 98, 42, 0.2)",
              }}
            >
              <span
                className="font-semibold"
                style={{ fontSize: "13px", color: "#E8622A", letterSpacing: "-0.02em" }}
              >
                D
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span
                className="text-[#eeeeec] font-semibold leading-none"
                style={{ fontSize: "14px" }}
              >
                Edit this response
              </span>
              <span
                className="text-[#5a5956] leading-none"
                style={{ fontSize: "11.5px" }}
              >
                Changes are saved to your training data
              </span>
            </div>

            {/* Close */}
            <button
              onClick={onDismiss}
              className="ml-auto flex items-center justify-center rounded-full opacity-30 hover:opacity-60 transition-opacity duration-150"
              style={{ width: 28, height: 28, color: "#b4b3ad" }}
              aria-label="Close"
            >
              <X size={13} weight="bold" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex flex-col gap-5 px-5 py-5 overflow-y-auto flex-1">
            {/* Question */}
            <div className="flex flex-col gap-2">
              <span
                className="font-semibold uppercase tracking-wider text-[#4a4946] leading-none"
                style={{ fontSize: "10px", letterSpacing: "0.08em" }}
              >
                Question
              </span>
              <div
                className="px-3.5 py-3 rounded-[12px]"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p
                  className="text-[#8a8a84] font-medium leading-relaxed m-0"
                  style={{ fontSize: "14px" }}
                >
                  {question}
                </p>
              </div>
            </div>

            {/* Answer */}
            <div className="flex flex-col gap-2">
              <span
                className="font-semibold uppercase tracking-wider text-[#4a4946] leading-none"
                style={{ fontSize: "10px", letterSpacing: "0.08em" }}
              >
                Answer
              </span>
              <div
                className="rounded-[12px] overflow-hidden"
                style={{
                  background: "#272725",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow:
                    "inset 0px 1px 2px 0px rgba(255,255,255,0.04), inset 0px -1px 2px 0px rgba(0,0,0,0.15)",
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[#eeeeec] font-medium leading-6 px-3.5 py-3"
                  style={{
                    fontSize: "14.5px",
                    minHeight: 110,
                    maxHeight: 260,
                    overflowY: "auto",
                    lineHeight: "1.65",
                  }}
                  spellCheck={false}
                  placeholder="Enter the response text…"
                />
              </div>
            </div>

            {/* Sources */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span
                  className="font-semibold uppercase tracking-wider text-[#4a4946] leading-none"
                  style={{ fontSize: "10px", letterSpacing: "0.08em" }}
                >
                  Sources
                </span>
                <span
                  className="text-[#4a4946] leading-none"
                  style={{ fontSize: "10.5px" }}
                >
                  {draftFootnotes.length} attached
                </span>
              </div>

              {/* Current sources */}
              <div className="flex flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  {draftFootnotes.map((key) =>
                    draftSources[key] ? (
                      <SourceChip
                        key={key}
                        sourceKey={key}
                        source={draftSources[key]}
                        isNew={key === newlyAddedKey}
                        onRemove={handleRemoveSource}
                      />
                    ) : null
                  )}
                </AnimatePresence>

                {draftFootnotes.length === 0 && (
                  <div
                    className="flex items-center justify-center py-4 rounded-[11px]"
                    style={{
                      border: "1px dashed rgba(255,255,255,0.07)",
                      color: "#3a3936",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>No sources attached</span>
                  </div>
                )}
              </div>

              {/* Add source button + picker */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowPicker((v) => !v)}
                  className="flex items-center gap-1.5 self-start rounded-[9px] px-3 py-1.5 transition-all duration-150"
                  style={{
                    background: showPicker
                      ? "rgba(232, 98, 42, 0.12)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${showPicker ? "rgba(232,98,42,0.2)" : "rgba(255,255,255,0.07)"}`,
                    color: showPicker ? "#E8622A" : "#8a8a84",
                  }}
                >
                  <Plus
                    size={12}
                    weight="bold"
                    style={{
                      transform: showPicker ? "rotate(45deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                  <span
                    className="font-medium leading-none"
                    style={{ fontSize: "12px" }}
                  >
                    {showPicker ? "Close picker" : "Add source"}
                  </span>
                </button>

                <AnimatePresence>
                  {showPicker && (
                    <SourcePickerPanel
                      available={available}
                      onAdd={handleAddSource}
                      onClose={() => setShowPicker(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex items-center justify-end gap-2.5 px-5 py-4 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <button
              onClick={onDismiss}
              className="flex items-center justify-center px-5 h-10 rounded-full font-medium transition-all duration-150"
              style={{
                fontSize: "14px",
                color: "#8a8a84",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#eeeeec")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#8a8a84")
              }
            >
              Dismiss
            </button>

            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-5 h-10 rounded-full font-semibold transition-all duration-150"
              style={{
                fontSize: "14px",
                color: "#fff",
                background: hasChanges
                  ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                  : "rgba(37, 99, 235, 0.4)",
                boxShadow: hasChanges
                  ? "0 2px 12px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.12)"
                  : "none",
                opacity: hasChanges ? 1 : 0.55,
              }}
            >
              {hasChanges && <CheckCircle size={15} weight="fill" />}
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
