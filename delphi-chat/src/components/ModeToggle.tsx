"use client";

import { motion } from "framer-motion";
import { Brain, Eye } from "@phosphor-icons/react";

export type AppMode = "preview" | "training";

interface ModeToggleProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      className="relative flex items-center gap-0.5 h-[60px] px-[10px] rounded-[32px]"
      style={{
        background: "rgba(42, 42, 40, 0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        border: "1px solid rgba(111, 109, 102, 0.2)",
        boxShadow:
          "0px 31px 31px 0px rgba(0,0,0,0.06), 0px 17px 17px -8px rgba(0,0,0,0.03), 0px 8px 8px -4px rgba(0,0,0,0.03), 0px 4px 4px -2px rgba(0,0,0,0.03), 0px 1px 1px -0.5px rgba(0,0,0,0.03), 0px 0px 0px 1px rgba(0,0,0,0.04)",
      }}
    >
      {/* Inner rim highlight — matches Composer */}
      <div
        className="absolute inset-0 rounded-[32px] pointer-events-none"
        style={{
          boxShadow:
            "inset 0px -2px 2px 1px rgba(255,255,255,0.04), inset 0px 2px 2px 1px rgba(255,255,255,0.08)",
        }}
      />

      {(["preview", "training"] as const).map((m) => {
        const isActive = mode === m;
        const isTraining = m === "training";
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            aria-label={isTraining ? "Training mode" : "Preview mode"}
            className="relative flex items-center justify-center rounded-full transition-opacity duration-150"
            style={{
              width: 40,
              height: 40,
              color: isActive
                ? isTraining
                  ? "#E8622A"
                  : "#eeeeec"
                : "#5a5956",
              background: isActive
                ? isTraining
                  ? "rgba(232, 98, 42, 0.12)"
                  : "rgba(255,255,255,0.06)"
                : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLElement).style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
          >
            {/* Active button depth shadows — matches Composer send button */}
            {isActive && (
              <>
                <motion.div
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow:
                      "0px 31px 31px 0px rgba(0,0,0,0.06), 0px 17px 17px -8px rgba(0,0,0,0.03), 0px 8px 8px -4px rgba(0,0,0,0.03), 0px 4px 4px -2px rgba(0,0,0,0.03), 0px 1px 1px -0.5px rgba(0,0,0,0.03), 0px 0px 0px 1px rgba(0,0,0,0.04)",
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    boxShadow: isTraining
                      ? "inset 0px -2.07px 2.07px 0px rgba(232,98,42,0.12), inset 0px 2.07px 2.07px 0px rgba(255,255,255,0.14)"
                      : "inset 0px -2.07px 2.07px 0px rgba(255,255,255,0.1), inset 0px 2.07px 2.07px 0px rgba(255,255,255,0.2)",
                  }}
                />
              </>
            )}

            <span className="relative z-10">
              {isTraining ? (
                <Brain size={17} weight={isActive ? "fill" : "regular"} />
              ) : (
                <Eye size={17} weight={isActive ? "fill" : "regular"} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
