"use client";

import { useState } from "react";
import DateDivider from "@/components/DateDivider";
import UserMessage from "@/components/UserMessage";
import Response from "@/components/Response";
import Composer from "@/components/Composer";
import ModeToggle, { type AppMode } from "@/components/ModeToggle";
import type { Source } from "@/lib/sourceType";

const INITIAL_RESPONSE = [
  {
    text: "MindCraft opens plasticity with neuroscience, then anchors identity-level change with aligned intention. Emily teaches this at Emonthebrain and through coaching. She unpacks it on Motion with JB Copeland.",
    footnotes: [1, 2, 7],
  },
  {
    text: "We start by regulating state—breath patterns, vagal toning, 432 Hz frequencies to calm arousal and lift alpha activity. Then we layer in focused repetition, because neurons that fire together wire together. Visualization, gratitude, and deliberate self-suggestion all ride the dopaminergic system to encode new circuits faster.",
    footnotes: [3, 4, 5],
  },
  {
    text: "We time it when the brain is most plastic—around sleep and novelty—then anchor everything in identity: who you're becoming and the energy you carry into each day.",
    footnotes: [6],
  },
];

const INITIAL_SOURCES: Record<number, Source> = {
  1: { url: "https://www.emonthebrain.com/meetemily", title: "Meet Emily — Emonthebrain" },
  2: { url: "https://www.linkedin.com/in/emonthebrain", title: "Emily McDonald — LinkedIn" },
  3: {
    url: "https://www.youtube.com/watch?v=TdaKY4YiWXc",
    title: "How to Rewire Your Reality",
    timestamp: 312,
  },
  4: { url: "https://planetem.podbean.com/", title: "Planet Em Podcast" },
  5: { url: "https://www.tiktok.com/@emonthebrain", title: "@emonthebrain on TikTok" },
  6: {
    url: "https://www.youtube.com/watch?v=W1fK0eIQu2I",
    title: "Stop Self-Sabotaging: Rewire Your Brain",
    timestamp: 187,
  },
  7: {
    url: "https://www.listennotes.com/podcasts/motion-jb-copeland/neuroscientist-emonthebrain-NGvg4Dh2_-3/",
    title: "Neuroscientist Emonthebrain — Motion w/ JB Copeland",
    type: "podcast",
  },
};

const SECOND_RESPONSE = [
  {
    text: "The brain's most underestimated plasticity window isn't a meditation app—it's the four to seven minutes right before you fall asleep. In that hypnagogic threshold, the prefrontal cortex dials down and the subconscious becomes fully permeable. Theta waves dominate, and whatever you feed the mind in that state bypasses the critical filter that blocks change during waking hours.",
    footnotes: [7, 10],
  },
  {
    text: "That's why my sleep-scripting protocol is the cornerstone of MindCraft. I pair low-frequency binaural beats with identity-based voice notes—spoken in first person, present tense, emotionally charged—right at sleep onset. Memory consolidation research shows new patterns replay during slow-wave sleep across multiple cycles, so you're essentially printing the upgrade while you rest. Each morning I add a two-minute somatic anchor: cold water on the face, three deep breaths, and a single identity statement said out loud. That sequence bridges the night's work into the nervous system's waking state.",
    footnotes: [8, 9, 11],
  },
  {
    text: "Students inside MindCraft Academy report measurable shifts in their stress response within 21 days. Not because of motivation—motivation is a feeling, and feelings are unreliable. It works because consistency plus correct timing is neural engineering. You're not trying to feel better; you're building a different brain.",
    footnotes: [12],
  },
];

const SECOND_SOURCES: Record<number, Source> = {
  7: {
    url: "https://www.youtube.com/watch?v=_ld1NZvZRzM",
    title: "Get the BEST Sleep Using Neuroscience",
    timestamp: 156,
  },
  8: { url: "https://www.youtube.com/watch?v=zAg-2u8xOxY", title: "Morning Affirmations with Em on the Brain" },
  9: { url: "https://www.instagram.com/emonthebrain", title: "@emonthebrain on Instagram" },
  10: {
    url: "https://www.tiktok.com/@emonthebrain/video/7377596405797358878",
    title: "This Is How You Can Learn in Your Sleep",
  },
  11: { url: "https://twitter.com/emonthebrain", title: "@emonthebrain on X" },
  12: {
    url: "https://www.youtube.com/watch?v=E_uYbLaN3CE",
    title: "Reprogram Your Brain for Consistent Results",
    timestamp: 88,
  },
};

// Pool of all available sources for adding to any response
const ALL_SOURCES: Record<number, Source> = {
  ...INITIAL_SOURCES,
  ...SECOND_SOURCES,
};

/** Mirror of the same helper in Response.tsx — keeps page-level logic self-contained */
function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);
  return parts.length ? parts : [trimmed];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text?: string;
  paragraphs?: { text: string; footnotes?: number[] }[];
  sources?: Record<number, Source>;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "user",
      text: "How does your MindCraft Method blend science and spirituality for lasting mindset transformation?",
    },
    {
      id: "2",
      role: "assistant",
      paragraphs: INITIAL_RESPONSE,
      sources: INITIAL_SOURCES,
    },
  ]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<AppMode>("preview");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // ── Training mode: save edited response text ──────────────────────────────
  function handleSaveTextEdit(msgId: string, text: string) {
    const rawParas = text
      .split(/\n\n+/)
      .map((t) => t.trim())
      .filter(Boolean);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || m.role !== "assistant") return m;
        const origParas = m.paragraphs ?? [];

        // Build map: text-prefix → footnotes for matching
        const origFnMap = new Map<string, number[]>();
        for (const p of origParas) {
          if (p.footnotes?.length) {
            origFnMap.set(p.text.slice(0, 40), [...p.footnotes]);
          }
        }

        const usedKeys = new Set<number>();
        const newParagraphs = rawParas.map((t, i) => {
          const mapped = origFnMap.get(t.slice(0, 40));
          if (mapped) {
            mapped.forEach((k) => usedKeys.add(k));
            return { text: t, footnotes: mapped };
          }
          // Last paragraph gets any unmatched footnotes
          if (i === rawParas.length - 1) {
            const remaining = Object.keys(m.sources ?? {})
              .map(Number)
              .filter((k) => !usedKeys.has(k));
            return { text: t, footnotes: remaining };
          }
          return { text: t, footnotes: [] };
        });

        return { ...m, paragraphs: newParagraphs };
      })
    );

    setEditingMessageId(null);
  }

  // ── Training mode: add source to a response ───────────────────────────────
  function handleAddSource(msgId: string, key: number, source: Source) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || m.role !== "assistant") return m;
        const paras = m.paragraphs ?? [];
        const newSources = { ...m.sources, [key]: source };
        // Add a new paragraph for the source — Response animates it in after the shimmer
        const newParagraphs = [...paras, { text: "", footnotes: [key] }];
        return { ...m, paragraphs: newParagraphs, sources: newSources };
      })
    );
  }

  // ── Training mode: remove source from a response ──────────────────────────
  function handleRemoveSource(msgId: string, key: number) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || m.role !== "assistant") return m;
        const newSources = { ...m.sources };
        delete newSources[key];

        const newParagraphs = (m.paragraphs ?? []).flatMap((p) => {
          const footnoteList = p.footnotes ?? [];
          const keyIdx = footnoteList.indexOf(key);

          // Citation not in this paragraph — leave unchanged
          if (keyIdx === -1) return [p];

          const newFootnotes = footnoteList.filter((k) => k !== key);
          const sentences = splitSentences(p.text);

          // Sentence-aligned: each footnote maps 1-to-1 to a sentence
          if (sentences.length === footnoteList.length) {
            const newText = sentences
              .filter((_, si) => si !== keyIdx)
              .join(" ");

            // Drop the whole paragraph if it's now empty
            if (!newText.trim() && newFootnotes.length === 0) return [];
            return [{ ...p, text: newText, footnotes: newFootnotes }];
          }

          // Not aligned — just remove the footnote reference
          return [{ ...p, footnotes: newFootnotes }];
        });

        return { ...m, paragraphs: newParagraphs, sources: newSources };
      })
    );
  }

  function handleSubmit(value: string) {
    const newUserMsg: Message = { id: Date.now().toString(), role: "user", text: value };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsStreaming(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          paragraphs: SECOND_RESPONSE,
          sources: SECOND_SOURCES,
        },
      ]);
      setIsStreaming(false);
    }, 1800);
  }

  return (
    <div
      className="relative flex flex-col h-screen overflow-hidden"
      style={{ background: "#1e1e1d" }}
    >
      {/* Scrollable messages area */}
      <main
        className="flex-1 overflow-y-auto pb-[200px]"
        style={{ scrollbarGutter: "stable", overflowAnchor: "none" }}
      >
        <div
          className="mx-auto max-w-[768px] w-full px-4 flex flex-col gap-4 pt-12"
          style={{ overflowAnchor: "none" }}
        >
          <DateDivider label="Yesterday" time="10:55 AM" />

          {messages.map((msg) => {
            if (msg.role === "user") {
              return <UserMessage key={msg.id}>{msg.text}</UserMessage>;
            }

            // Compute sources available to add (not already in this response)
            const msgSourceKeys = new Set(Object.keys(msg.sources ?? {}).map(Number));
            const availableSources = Object.fromEntries(
              Object.entries(ALL_SOURCES).filter(([k]) => !msgSourceKeys.has(Number(k)))
            ) as Record<number, Source>;

            const isEditing = editingMessageId === msg.id;

            return (
              <div key={msg.id} className="flex flex-col">
                <Response
                  paragraphs={msg.paragraphs ?? []}
                  sources={msg.sources}
                  isTraining={mode === "training"}
                  isEditing={isEditing}
                  availableSources={availableSources}
                  onSaveTextEdit={(text) => handleSaveTextEdit(msg.id, text)}
                  onCancelEdit={() => setEditingMessageId(null)}
                  onAddSource={(key, source) => handleAddSource(msg.id, key, source)}
                  onRemoveSource={(key) => handleRemoveSource(msg.id, key)}
                />

                {/* Training mode action row (hidden while editing — Response shows save/cancel) */}
                {mode === "training" && !isEditing && (
                  <div
                    className="flex items-center gap-2 mt-1.5"
                    style={{ paddingLeft: 50 }}
                  >
                    <button
                      onClick={() => setEditingMessageId(msg.id)}
                      className="text-[#E8622A] font-medium transition-opacity duration-150 hover:opacity-70"
                      style={{ fontSize: "12.5px" }}
                    >
                      Edit answer
                    </button>
                    <span style={{ color: "#3a3936", fontSize: "12px" }}>·</span>
                    <button
                      className="text-[#5a5956] font-medium transition-colors duration-150 hover:text-[#8a8a84]"
                      style={{ fontSize: "12.5px" }}
                    >
                      Send feedback
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-start justify-start w-full pr-[147px]">
              <div className="flex flex-col max-w-[589px]">
                <div
                  className="px-3 py-3 rounded-[20px] flex items-center gap-1"
                  style={{ background: "#272725" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7d7b74] animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7d7b74] animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7d7b74] animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed composer at bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 pb-10 pointer-events-none z-50">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent 0%, #1e1e1d 35%)" }}
        />
        <div className="relative w-full max-w-[736px] pointer-events-auto flex items-end gap-3">
          <div className="flex-1">
            <Composer
              placeholder="Ask Emily anything about neuroscience, mindset, or MindCraft…"
              onSubmit={handleSubmit}
              isStreaming={isStreaming}
              onStop={() => setIsStreaming(false)}
            />
          </div>
          <div className="flex-shrink-0">
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
        </div>
      </div>
    </div>
  );
}
