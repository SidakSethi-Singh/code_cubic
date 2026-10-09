"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "rounded" | "circle" | "card";
}

export function Skeleton({ className = "", variant = "rounded" }: SkeletonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case "circle":
        return "rounded-full";
      case "card":
        return "rounded-[24px]";
      case "rounded":
      default:
        return "rounded-[16px]";
    }
  };

  return (
    <div
      className={`skeleton-shimmer border border-white/[0.05] ${getVariantClass()} ${className}`}
    />
  );
}
