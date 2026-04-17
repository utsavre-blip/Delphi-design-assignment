"use client";

import { useMemo, useRef, useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CitationChip, {
  CitationHighlightProvider,
  useCitationHighlight,
} from "@/components/CitationChip";
import CitationPanel from "@/components/CitationPanel";
import type { CitationPanelItem } from "@/components/CitationPanel";
import type { CitationHighlight } from "@/components/CitationChip";
import type { Source } from "@/lib/sourceType";

interface ResponseParagraph {
  text: string;
  footnotes?: number[];
}

interface ResponseProps {
  paragraphs: ResponseParagraph[];
  sources?: Record<number, Source>;
  // Training-mode props
  isTraining?: boolean;
  isEditing?: boolean;
  /** Sources NOT in this response (available to add) */
  availableSources?: Record<number, Source>;
  onSaveTextEdit?: (text: string) => void;
  onCancelEdit?: () => void;
  onAddSource?: (key: number, source: Source) => void;
  onRemoveSource?: (key: number) => void;
}

/** Split on sentence boundaries */
function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);
  return parts.length ? parts : [trimmed];
}

function isSentenceAligned(text: string, footnoteCount: number): boolean {
  if (footnoteCount === 0) return false;
  return splitSentences(text).length === footnoteCount;
}

function highlightStyle(active: boolean): CSSProperties {
  return {
    backgroundColor: active ? "rgba(255, 245, 220, 0.14)" : "transparent",
    borderRadius: "4px",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
    transition: "background-color 0.18s ease-out",
  };
}

function ResponseBody({
  paragraphs,
  sources = {},
  isTraining,
  isEditing,
  availableSources = {},
  onSaveTextEdit,
  onCancelEdit,
  onAddSource,
  onRemoveSource,
}: ResponseProps) {
  const { highlight, activeKey, openPanel, closePanel, navigatePanel } =
    useCitationHighlight();

  // ── Inline text editing state ──
  const [draftText, setDraftText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Shimmer: fires when a source is added ──
  const [shimmer, setShimmer] = useState(false);
  const prevSourceKeysRef = useRef(new Set(Object.keys(sources).map(Number)));

  useEffect(() => {
    const currentKeys = new Set(Object.keys(sources).map(Number));
    const hasNew = [...currentKeys].some((k) => !prevSourceKeysRef.current.has(k));
    prevSourceKeysRef.current = currentKeys;
    if (hasNew) {
      setShimmer(true);
      const t = setTimeout(() => setShimmer(false), 820);
      return () => clearTimeout(t);
    }
  }, [sources]);

  // ── Track newly added paragraph so it can animate in after the shimmer ──
  const prevParaLengthRef = useRef(paragraphs.length);
  const [newlyAddedIdx, setNewlyAddedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (paragraphs.length > prevParaLengthRef.current) {
      setNewlyAddedIdx(paragraphs.length - 1);
      const t = setTimeout(() => setNewlyAddedIdx(null), 2000);
      return () => clearTimeout(t);
    }
    prevParaLengthRef.current = paragraphs.length;
  }, [paragraphs.length]);

  // Initialise draft text whenever editing starts
  useEffect(() => {
    if (isEditing) {
      setDraftText(paragraphs.map((p) => p.text).join("\n\n"));
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || !isEditing) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draftText, isEditing]);

  // Build ordered citation items from the response text
  const citationItems = useMemo<CitationPanelItem[]>(() => {
    const seen = new Set<number>();
    const ordered: number[] = [];
    for (const para of paragraphs) {
      for (const k of para.footnotes ?? []) {
        if (!seen.has(k) && sources[k]) {
          seen.add(k);
          ordered.push(k);
        }
      }
    }
    return ordered.map((key) => ({
      key,
      source: sources[key],
      clipCount: paragraphs.reduce(
        (n, p) => n + (p.footnotes ?? []).filter((k) => k === key).length,
        0
      ),
    }));
  }, [paragraphs, sources]);

  // Convert availableSources Record → Array for CitationPanel
  const availableSourcesList = useMemo(
    () =>
      Object.entries(availableSources).map(([k, s]) => ({
        key: Number(k),
        source: s,
      })),
    [availableSources]
  );

  function getHighlightForKey(key: number): CitationHighlight | null {
    for (let pi = 0; pi < paragraphs.length; pi++) {
      const footnotes = paragraphs[pi].footnotes ?? [];
      const fi = footnotes.indexOf(key);
      if (fi !== -1) {
        const aligned = isSentenceAligned(paragraphs[pi].text, footnotes.length);
        return { paragraphIndex: pi, sentenceIndex: aligned ? fi : "all" };
      }
    }
    return null;
  }

  function handleNavigate(key: number) {
    navigatePanel(key, getHighlightForKey(key));
  }

  const isPanelOpen = activeKey !== null;

  // Border radius: squared bottom corners when panel is open
  const cardRadius = isPanelOpen ? "20px 20px 0 0" : "20px";

  return (
    <div className="flex items-start justify-start w-full" style={{ paddingRight: "147px" }}>
      {/* ── Avatar ── */}
      <img
        src="/emily.webp"
        alt="Emily McDonald"
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          objectFit: "cover",
          objectPosition: "center top",
          boxShadow: "0 0 0 1.5px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.4)",
          marginRight: 8,
          marginTop: 23,
          flexShrink: 0,
        }}
      />

      <div className="flex flex-col flex-1" style={{ maxWidth: "589px" }}>
        {/* ── Name ── */}
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "#7d7b74",
            marginBottom: 5,
            letterSpacing: "0.01em",
            paddingLeft: 12,
          }}
        >
          Emily McDonald
        </span>

        {/* ── Response card ── */}
        <div
          className="relative px-3 py-2 overflow-visible flex flex-col gap-4"
          style={{
            borderRadius: cardRadius,
            transition: "border-radius 0.18s ease",
          }}
        >
          {/* Background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isEditing ? "#2c2b28" : "#272725",
              borderRadius: "inherit",
              transition: "background 0.2s ease",
            }}
          />
          {/* Inner ring */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "inherit",
              boxShadow: isEditing
                ? "inset 0px 1px 2px 0px rgba(255, 255, 255, 0.08), inset 0px -1px 2px 0px rgba(0, 0, 0, 0.2), 0 0 0 1.5px rgba(232,98,42,0.18)"
                : "inset 0px 1px 2px 0px rgba(255, 255, 255, 0.06), inset 0px -1px 2px 0px rgba(0, 0, 0, 0.2)",
            }}
          />

          {/* Shimmer sweep — clipped to card shape, sits below text (z-[2]) */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ borderRadius: "inherit", zIndex: 2 }}
          >
            <AnimatePresence>
              {shimmer && (
                <motion.div
                  key="shimmer-sweep"
                  initial={{ x: "-100%" }}
                  animate={{ x: "260%" }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.72, ease: "easeInOut" }}
                  className="absolute inset-y-0 left-0 pointer-events-none"
                  style={{
                    width: "55%",
                    background:
                      "linear-gradient(90deg, transparent, rgba(232,98,42,0.09), transparent)",
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ── Edit textarea or formatted paragraphs ── */}
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[#eeeeec] font-medium relative z-10"
              style={{
                fontSize: "15.8px",
                resize: "none",
                minHeight: 80,
                lineHeight: "24px",
                overflowY: "hidden",
              }}
              spellCheck={false}
              autoFocus
              placeholder="Enter the response text…"
            />
          ) : (
            paragraphs.map((para, i) => {
              const sentences = splitSentences(para.text);
              const footnoteList = para.footnotes ?? [];
              const sentenceAligned = isSentenceAligned(para.text, footnoteList.length);
              const activeInPara =
                isPanelOpen && footnoteList.some((k) => k === activeKey);
              const isEmpty = para.text.trim() === "";
              const isNewPara = newlyAddedIdx === i;

              return (
                <motion.p
                  key={i}
                  className="relative font-medium leading-6 text-[#eeeeec] m-0 z-10"
                  style={{ fontSize: "15.8px" }}
                  initial={isNewPara ? { opacity: 0, y: 6 } : false}
                  animate={isNewPara ? { opacity: 1, y: 0 } : {}}
                  transition={isNewPara ? { duration: 0.32, delay: 0.72, ease: [0.16, 1, 0.3, 1] } : {}}
                >
                  {sentenceAligned ? (
                    <>
                      {sentences.map((sentence, si) => {
                        const hoverActive =
                          highlight?.paragraphIndex === i &&
                          highlight.sentenceIndex !== "all" &&
                          highlight.sentenceIndex === si;
                        const panelActive =
                          activeInPara &&
                          highlight?.paragraphIndex === i &&
                          highlight.sentenceIndex !== "all" &&
                          highlight.sentenceIndex === si;
                        return (
                          <span key={si} style={highlightStyle(hoverActive || panelActive)}>
                            {sentence}
                            {si < sentences.length - 1 ? " " : null}
                          </span>
                        );
                      })}
                      <AnimatePresence>
                        {footnoteList.map((n, fi) =>
                          sources[n] ? (
                            <motion.span
                              key={n}
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                              style={{ display: "inline" }}
                            >
                              <CitationChip
                                number={n}
                                source={sources[n]}
                                paragraphIndex={i}
                                footnoteIndex={fi}
                                sentenceAligned={true}
                              />
                            </motion.span>
                          ) : null
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <>
                      {isEmpty && isTraining ? (
                        <span
                          style={{
                            color: "#4a4945",
                            fontStyle: "italic",
                            fontSize: "15px",
                          }}
                        >
                          Add context for this source…
                        </span>
                      ) : (
                        <span
                          style={highlightStyle(
                            highlight?.paragraphIndex === i && highlight.sentenceIndex === "all"
                          )}
                        >
                          {para.text}
                        </span>
                      )}
                      <AnimatePresence>
                        {footnoteList.map((n, fi) =>
                          sources[n] ? (
                            <motion.span
                              key={n}
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                              style={{ display: "inline" }}
                            >
                              <CitationChip
                                number={n}
                                source={sources[n]}
                                paragraphIndex={i}
                                footnoteIndex={fi}
                                sentenceAligned={false}
                              />
                            </motion.span>
                          ) : null
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.p>
              );
            })
          )}
        </div>

        {/* ── Inline save / cancel (editing mode only) ── */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              key="edit-actions"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 mt-2"
            >
              <button
                onClick={() => onSaveTextEdit?.(draftText)}
                className="flex items-center justify-center px-4 h-8 rounded-full font-semibold transition-all duration-150"
                style={{
                  fontSize: "13px",
                  color: "#fff",
                  background: "linear-gradient(135deg, #E8622A, #d45522)",
                  boxShadow: "0 2px 10px rgba(232,98,42,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                Save
              </button>
              <button
                onClick={() => onCancelEdit?.()}
                className="flex items-center justify-center px-4 h-8 rounded-full font-medium transition-all duration-150"
                style={{
                  fontSize: "13px",
                  color: "#5a5956",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#8a8a84")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#5a5956")
                }
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Citation panel (below the card) ── */}
        <AnimatePresence initial={false}>
          {isPanelOpen && citationItems.length > 0 && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "top center" }}
            >
              <CitationPanel
                items={citationItems}
                activeKey={activeKey!}
                onNavigate={handleNavigate}
                onClose={closePanel}
                isTraining={isTraining}
                onRemoveSource={onRemoveSource}
                onAddSource={onAddSource}
                availableSources={availableSourcesList}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Response(props: ResponseProps) {
  return (
    <CitationHighlightProvider>
      <ResponseBody {...props} />
    </CitationHighlightProvider>
  );
}
