"use client";

import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-gray-900 text-white",
  secondary: "bg-gray-100 text-gray-900",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  outline: "border border-gray-300 text-gray-900",
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}

