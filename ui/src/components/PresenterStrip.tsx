"use client";

import { useApp, BEAT_LABELS, BEAT_ROUTES } from "@/lib/context";
import { ChevronLeft, ChevronRight, X, Presentation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PresenterStrip() {
  const { presenterMode, setPresenterMode, presenterBeat, setPresenterBeat } = useApp();
  const router = useRouter();

  const goToBeat = (b: number) => {
    const clamped = Math.max(0, Math.min(5, b));
    setPresenterBeat(clamped);
    router.push(BEAT_ROUTES[clamped]);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

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
  }, [presenterMode, presenterBeat]);

  if (!presenterMode) return null;

  return (
    <div className="h-10 bg-[var(--color-accent)] flex items-center justify-between px-4 shrink-0 select-none z-50" style={{ borderRadius: 0 }}>
      <div className="flex items-center gap-3">
        <Presentation className="w-4 h-4 text-[var(--color-accent-ink)]" strokeWidth={1.5} />
        <span className="font-mono text-sm font-bold text-[var(--color-accent-ink)] uppercase tracking-wide">
          BEAT {presenterBeat + 1} / 6 — {BEAT_LABELS[presenterBeat]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-[var(--color-accent-ink)] opacity-80 mr-2 hidden sm:inline">
          SPACE: Next · B: Prev · P: Exit
        </span>
        <button
          onClick={() => goToBeat(presenterBeat - 1)}
          disabled={presenterBeat === 0}
          className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-[var(--color-accent-ink)] text-[var(--color-accent)] disabled:opacity-30 transition-opacity duration-120 hover:opacity-90"
          title="Previous Beat (B)"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button
          onClick={() => goToBeat(presenterBeat + 1)}
          disabled={presenterBeat === 5}
          className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-[var(--color-accent-ink)] text-[var(--color-accent)] disabled:opacity-30 transition-opacity duration-120 hover:opacity-90"
          title="Next Beat (Space)"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <div className="w-px h-5 bg-[var(--color-accent-ink)] opacity-30 mx-1" />
        <button
          onClick={() => setPresenterMode(false)}
          className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-[var(--color-accent-ink)] text-[var(--color-accent)] transition-opacity duration-120 hover:opacity-90"
          title="Exit Presenter Mode (P)"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
