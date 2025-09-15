"use client";

import React from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-3 py-2";

const variants = {
  default: "bg-black text-white hover:bg-black/90 focus-visible:ring-black/30",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-300",
  outline:
    "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 focus-visible:ring-gray-300",
  ghost: "hover:bg-gray-100 text-gray-900",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300",
};

export const Button = React.forwardRef(function Button(
  { className, variant = "default", asChild = false, ...props },
  ref
) {
  const Comp = asChild ? "span" : "button";
  return (
    <Comp
      ref={ref}
      className={cn(base, variants[variant] || variants.default, className)}
      {...props}
    />
  );
});

