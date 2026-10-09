"use client";

import React from "react";
import { motion } from "framer-motion";
import { GradientBadge } from "./GradientBadge";

interface ConfidenceRailProps {
  confidence: number; // 0 to 1
  label?: string;
  className?: string;
}

export function ConfidenceRail({
  confidence,
  label,
  className = "",
}: ConfidenceRailProps) {
  const percentage = Math.round(confidence * 100);
  const isHigh = confidence >= 0.75;
  const isMedium = confidence >= 0.45 && confidence < 0.75;

  const gradient = isHigh
    ? "linear-gradient(90deg, #30D158, #00C7BE)"
    : isMedium
    ? "linear-gradient(90deg, #FF9F0A, #FF6B35)"
    : "linear-gradient(90deg, #FF453A, #FF375F)";

  const badgeVariant = isHigh ? "success" : isMedium ? "warning" : "danger";
  const statusText = label || (isHigh ? "High" : isMedium ? "Medium" : "Low");

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative w-28 md:w-36 h-2 rounded-full bg-white/[0.08] overflow-hidden p-0.5 border border-white/[0.06]">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: gradient }}
        />
      </div>

      <GradientBadge variant={badgeVariant} size="sm">
        {percentage}% {statusText}
      </GradientBadge>
    </div>
  );
}
