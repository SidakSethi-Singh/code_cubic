"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowRight, ShieldAlert, ArrowLeft, KeyRound } from "lucide-react";
import { authenticateCloudConsole } from "@/lib/cloud-auth";

interface CloudPasswordGateProps {
  onSuccess: () => void;
}

export default function CloudPasswordGate({ onSuccess }: CloudPasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError("Please enter the authorization password.");
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    const isValid = authenticateCloudConsole(password.trim());

    if (isValid) {
      onSuccess();
    } else {
      // Wrong password: inline error message, no page reload, input clears
      setError("Invalid authorization password. Access denied.");
      setPassword("");
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-md">
        {/* Terminal Header Bar */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-2)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[2px] bg-[var(--color-accent-dim)] border border-[var(--color-accent)] flex items-center justify-center">
                <Lock className="w-4 h-4 text-[var(--color-accent)]" strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-mono font-bold tracking-wider text-sm text-[var(--color-text)]">
                  EDGEMIND FLEET CLOUD
                </div>
                <div className="font-mono text-[10px] text-[var(--color-muted)]">
                  CENTRAL CONTROL PLANE • ROUTE: /cloud
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-amber-950/40 border border-amber-600/50 font-mono text-[10px] text-amber-400">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>GATED</span>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-text)] font-semibold flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                Fleet Operator Authorization
              </div>
              <p className="font-sans text-xs text-[var(--color-muted)] leading-relaxed">
                The Cloud Console controls fleet-wide knowledge promotion and global sync policies. Enter the shared console access key to unlock the control plane.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-[2px] bg-red-950/40 border border-red-800/80 text-red-300 font-mono text-xs animate-in fade-in duration-150"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-200">AUTHENTICATION FAILED</div>
                  <div className="text-[11px] text-red-300/90">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="console-password-input"
                  className="block font-mono text-[11px] tracking-wide text-[var(--color-muted)] uppercase"
                >
                  Console Password
                </label>
                <input
                  id="console-password-input"
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter console password..."
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-120"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-[2px] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-mono text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 hover:brightness-110 active:brightness-95 transition-all duration-120 cursor-pointer disabled:opacity-50"
              >
                <span>Enter Console</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </form>

            {/* Operational Metadata & Hackathon Demo Notice */}
            <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] font-mono text-[var(--color-muted)]">
              <div>Operator: <span className="text-[var(--color-text)] font-semibold">Meera S.</span></div>
              <div className="text-[10px] text-[var(--color-muted)]">
                Default: <code className="text-amber-400 font-mono">edgemind2026</code>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link to Device Console */}
        <div className="mt-4 flex items-center justify-center">
          <Link
            href="/device/device-a"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors duration-120"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Air-Gapped Device Console (Plant North)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
