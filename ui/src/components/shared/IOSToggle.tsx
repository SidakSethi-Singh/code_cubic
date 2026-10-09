"use client";

import React from "react";
import { motion } from "framer-motion";

interface IOSToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: "sm" | "md";
  color?: "green" | "orange" | "blue";
  disabled?: boolean;
}

export function IOSToggle({
  checked,
  onChange,
  label,
  size = "md",
  color = "green",
  disabled = false,
}: IOSToggleProps) {
  const getActiveTrackBg = () => {
    switch (color) {
      case "orange":
        return "bg-gradient-to-r from-[#FF9F0A] to-[#FF6B35]";
      case "blue":
        return "bg-gradient-to-r from-[#0A84FF] to-[#5E5CE6]";
      case "green":
      default:
        return "bg-[#30D158]";
    }
  };

  const isSmall = size === "sm";
  const trackWidth = isSmall ? "w-9 h-5" : "w-12 h-7";
  const thumbSize = isSmall ? "w-4 h-4" : "w-5 h-5";
  const travelDistance = isSmall ? 16 : 20;

  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      }`}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`relative ${trackWidth} rounded-full transition-colors duration-300 p-1 border border-white/[0.1] shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] ${
          checked ? getActiveTrackBg() : "bg-white/[0.12]"
        }`}
      >
        <motion.div
          className={`${thumbSize} rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.4)]`}
          animate={{ x: checked ? travelDistance : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
      {label && (
        <span className="text-xs font-medium text-[#A1A1A6] select-none">
          {label}
        </span>
      )}
    </label>
  );
}
