"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowRight, ShieldAlert, ArrowLeft, KeyRound } from "lucide-react";
import { authenticateCloudConsole } from "@/lib/cloud-auth";
import { GradientBadge } from "@/components/shared";
import { motion, AnimatePresence } from "framer-motion";

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
      setError("Invalid authorization password. Access denied.");
      setPassword("");
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 relative select-none bg-slate-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md"
      >
        {/* Flat Enterprise Gate Card */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
                <Lock className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <div>
                <div className="font-bold tracking-tight text-sm text-slate-900">
                  Fleet Central Plane
                </div>
                <div className="text-[11px] text-slate-500">
                  Cloud Control • Route: /cloud
                </div>
              </div>
            </div>

            <GradientBadge variant="warning" size="sm" dot>
              GATED
            </GradientBadge>
          </div>

          {/* Form Body */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Operator Authorization</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Cloud Console oversees fleet-wide knowledge promotion and global sync policies. Enter the operator access key to unlock the control plane.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-900">Authentication Failed</div>
                    <div className="text-[11px] text-red-700 mt-0.5">{error}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="console-password-input"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
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
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                <span>Enter Console</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </form>

            {/* Operational Metadata */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Operator: <span className="text-slate-800 font-semibold">Meera S.</span>
              </div>
              <div className="text-[11px] font-mono">
                Default: <code className="text-indigo-700 font-semibold font-mono">edgemind2026</code>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link to Device Console */}
        <div className="mt-5 flex items-center justify-center">
          <Link
            href="/device/device-a"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Air-Gapped Device Console</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
