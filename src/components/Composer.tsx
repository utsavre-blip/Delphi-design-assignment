"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Plus,
  Stop,
  ArrowUp,
  File,
  ChatDots,
  YoutubeLogo,
  NotePencil,
  LinkSimple,
  Microphone,
} from "@phosphor-icons/react";

interface ComposerProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
}

// ── Add-items menu ────────────────────────────────────────────────────────────

const ADD_ITEMS = [
  { id: "file",    label: "File",           Icon: File },
  { id: "qa",      label: "Q&A",            Icon: ChatDots },
  { id: "youtube", label: "YouTube Video",  Icon: YoutubeLogo },
  { id: "note",    label: "Quick Note",     Icon: NotePencil },
  { id: "url",     label: "URL",            Icon: LinkSimple },
  { id: "podcast", label: "Podcast Episode",Icon: Microphone },
] as const;

const COLS = 2;

interface AddItemsMenuProps {
  onClose: () => void;
}

function AddItemsMenu({ onClose }: AddItemsMenuProps) {
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((idx: number) => {
    // TODO: wire up per-item action
    console.log("selected:", ADD_ITEMS[idx].id);
    onClose();
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          setHighlighted((i) => (i + 1) % ADD_ITEMS.length);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setHighlighted((i) => (i - 1 + ADD_ITEMS.length) % ADD_ITEMS.length);
          break;
        case "ArrowDown":
          e.preventDefault();
          setHighlighted((i) => Math.min(i + COLS, ADD_ITEMS.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlighted((i) => Math.max(i - COLS, 0));
          break;
        case "Enter":
          e.preventDefault();
          handleSelect(highlighted);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [highlighted, handleSelect, onClose]);

  // Close when clicking outside
  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // slight delay so the opening click doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", onPointer), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [onClose]);

  // Pairs: [left-col item, right-col item]
  const rows = [
    [ADD_ITEMS[0], ADD_ITEMS[1]],
    [ADD_ITEMS[2], ADD_ITEMS[3]],
    [ADD_ITEMS[4], ADD_ITEMS[5]],
  ] as const;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-[calc(100%+10px)] left-0 z-50"
      style={{
        width: 360,
        background: "rgba(30, 30, 29, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 20,
        border: "1px solid rgba(111, 109, 102, 0.15)",
        boxShadow:
          "0px 24px 48px rgba(0,0,0,0.5), 0px 8px 16px rgba(0,0,0,0.25), inset 0px 1px 0px rgba(255,255,255,0.05)",
        padding: "8px",
      }}
    >
      {rows.map((pair, rowIdx) => (
        <div key={rowIdx} className="flex gap-1">
          {pair.map(({ id, label, Icon }) => {
            const idx = ADD_ITEMS.findIndex((item) => item.id === id);
            const isActive = idx === highlighted;
            return (
              <button
                key={id}
                onMouseEnter={() => setHighlighted(idx)}
                onClick={() => handleSelect(idx)}
                className="flex items-center gap-3 rounded-[13px] transition-colors duration-100 outline-none flex-1"
                style={{
                  padding: "11px 14px",
                  background: isActive
                    ? "rgba(255,255,255,0.07)"
                    : "transparent",
                }}
              >
                {/* Icon square */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-[10px]"
                  style={{
                    width: 38,
                    height: 38,
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Icon
                    size={18}
                    weight="regular"
                    color={isActive ? "#eeeeec" : "#8a8a84"}
                  />
                </div>

                {/* Label */}
                <span
                  className="font-medium leading-none text-left"
                  style={{
                    fontSize: "14px",
                    color: isActive ? "#eeeeec" : "#8a8a84",
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Composer({
  placeholder = "Ask anything…",
  onSubmit,
  isStreaming = false,
  onStop,
}: ComposerProps) {
  const [value, setValue] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Auto-grow textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    /* TAB autofills placeholder */
    if (e.key === "Tab" && !value) {
      e.preventDefault();
      setValue(placeholder);
    }
  }

  function handleSend() {
    if (!value.trim()) return;
    onSubmit?.(value.trim());
    setValue("");
  }

  const hasText = value.trim().length > 0;

  return (
    /* Outer pill wrapper */
    <div
      className="relative flex items-center h-[60px] rounded-[32px] px-2"
      style={{
        background: "rgba(42, 42, 40, 0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        border: "1px solid rgba(111, 109, 102, 0.2)",
        boxShadow:
          "0px 31px 31px 0px rgba(0,0,0,0.06), 0px 17px 17px -8px rgba(0,0,0,0.03), 0px 8px 8px -4px rgba(0,0,0,0.03), 0px 4px 4px -2px rgba(0,0,0,0.03), 0px 1px 1px -0.5px rgba(0,0,0,0.03), 0px 0px 0px 1px rgba(0,0,0,0.04)",
      }}
    >
      {/* Inner rim highlight */}
      <div
        className="absolute inset-0 rounded-[32px] pointer-events-none"
        style={{
          boxShadow:
            "inset 0px -2px 2px 1px rgba(255,255,255,0.04), inset 0px 2px 2px 1px rgba(255,255,255,0.08)",
        }}
      />

      {/* Left — Attach button */}
      <div className="relative flex items-center shrink-0 pl-[2px]">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-opacity duration-150"
          aria-label="Add item"
          style={{ opacity: showMenu ? 1 : 0.5 }}
          onMouseEnter={(e) => { if (!showMenu) (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
          onMouseLeave={(e) => { if (!showMenu) (e.currentTarget as HTMLElement).style.opacity = "0.5"; }}
        >
          <Plus
            size={17}
            color="#eeeeec"
            weight="regular"
            style={{
              transform: showMenu ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>

        {showMenu && <AddItemsMenu onClose={() => setShowMenu(false)} />}
      </div>

      {/* Centre — Textarea + placeholder */}
      <div className="relative flex flex-1 items-center min-w-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="w-full bg-transparent border-none outline-none resize-none font-medium text-[#eeeeec] leading-7 placeholder:text-transparent py-0 pl-1 pr-3"
          style={{
            fontSize: "17.6px",
            minHeight: "28px",
            maxHeight: "200px",
            overflowY: "auto",
            lineHeight: "28px",
          }}
          spellCheck={false}
        />

        {/* Placeholder with TAB hint — shown only when empty */}
        {!value && (
          <div
            className="absolute inset-0 flex items-center pl-1 pr-1 pointer-events-none gap-2"
            aria-hidden="true"
          >
            <span
              className="truncate text-[#6f6d66] font-normal leading-7"
              style={{ fontSize: "17.6px" }}
            >
              {placeholder}
            </span>

            {/* TAB badge */}
            <kbd
              className="inline-flex items-center shrink-0 px-[7px] py-px rounded-[8px] h-[26px]"
              style={{
                background: "rgba(125, 123, 116, 0.2)",
                border: "1px solid rgba(125, 123, 116, 0.2)",
              }}
            >
              <span
                className="font-mono text-[12px] leading-6"
                style={{ color: "rgba(181, 179, 173, 0.5)" }}
              >
                TAB
              </span>
            </kbd>
          </div>
        )}
      </div>

      {/* Right — Stop / Send button */}
      <div className="flex items-center shrink-0 pr-[2px]">
        <button
          onClick={isStreaming ? onStop : handleSend}
          disabled={!isStreaming && !hasText}
          aria-label={isStreaming ? "Stop generating" : "Send message"}
          className="relative flex items-center justify-center w-10 h-10 rounded-full transition-opacity duration-150"
          style={{
            background: "rgba(255, 255, 255, 0.06)",
          }}
        >
          {/* Button depth shadow ring */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow:
                "0px 31px 31px 0px rgba(0,0,0,0.06), 0px 17px 17px -8px rgba(0,0,0,0.03), 0px 8px 8px -4px rgba(0,0,0,0.03), 0px 4px 4px -2px rgba(0,0,0,0.03), 0px 1px 1px -0.5px rgba(0,0,0,0.03), 0px 0px 0px 1px rgba(0,0,0,0.04)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow:
                "inset 0px -2.07px 2.07px 0px rgba(255,255,255,0.1), inset 0px 2.07px 2.07px 0px rgba(255,255,255,0.2)",
            }}
          />

          {isStreaming ? (
            <Stop size={17} color="#eeeeec" weight="fill" />
          ) : (
            <ArrowUp
              size={17}
              color="#eeeeec"
              weight="bold"
              className={hasText ? "opacity-100" : "opacity-30"}
            />
          )}
        </button>
      </div>
    </div>
  );
}
