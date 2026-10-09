"use client";

import { useApp, BEAT_LABELS, BEAT_ROUTES } from "@/lib/context";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PresenterStrip() {
  const { presenterMode, setPresenterMode, presenterBeat, setPresenterBeat } = useApp();
  const router = useRouter();

  const goToBeat = useCallback(
    (b: number) => {
      const clamped = Math.max(0, Math.min(5, b));
      setPresenterBeat(clamped);
      router.push(BEAT_ROUTES[clamped]);
    },
    [router, setPresenterBeat]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setPresenterMode(!presenterMode);
      } else if (presenterMode) {
        if (e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          goToBeat(presenterBeat + 1);
        } else if (e.key === "b" || e.key === "B" || e.key === "ArrowLeft") {
          e.preventDefault();
          goToBeat(presenterBeat - 1);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [presenterMode, presenterBeat, goToBeat, setPresenterMode]);

  if (!presenterMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -16, opacity: 0 }}
        className="w-full px-4 pt-3 pb-1 z-50 shrink-0"
      >
        <div className="max-w-4xl mx-auto h-11 rounded-xl bg-amber-50 border border-amber-300 shadow-sm flex items-center justify-between px-4 select-none">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-amber-900 tracking-wider uppercase">
                BEAT {presenterBeat + 1} OF 6
              </span>
              <span className="text-amber-400 text-xs">•</span>
              <span className="text-xs font-semibold text-amber-950 truncate max-w-sm">
                {BEAT_LABELS[presenterBeat]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-amber-800 hidden sm:inline mr-2">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-900 font-mono text-[10px]">SPACE</kbd> Next ·{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-900 font-mono text-[10px]">B</kbd> Prev ·{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-900 font-mono text-[10px]">P</kbd> Exit
            </span>

            <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded-lg border border-amber-200">
              <button
                onClick={() => goToBeat(presenterBeat - 1)}
                disabled={presenterBeat === 0}
                className="w-6 h-6 flex items-center justify-center rounded-md text-amber-900 hover:bg-amber-100 disabled:opacity-25 transition-all cursor-pointer"
                title="Previous Beat (B)"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button
                onClick={() => goToBeat(presenterBeat + 1)}
                disabled={presenterBeat === 5}
                className="w-6 h-6 flex items-center justify-center rounded-md text-amber-900 hover:bg-amber-100 disabled:opacity-25 transition-all cursor-pointer"
                title="Next Beat (Space)"
              >
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <div className="w-[1px] h-3.5 bg-amber-200 mx-0.5" />
              <button
                onClick={() => setPresenterMode(false)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-amber-800 hover:text-amber-950 hover:bg-amber-100 transition-all cursor-pointer"
                title="Close Presenter Strip (P)"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
