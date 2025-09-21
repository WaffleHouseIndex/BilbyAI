"use client";

// Small wrapper to render a subtle background gradient behind page content.
// Keeps motion very subtle and respects prefers-reduced-motion.
export default function PageSurface({ children, animate = true, className = "" }) {
  return (
    <div className={`bilby-gradient-container min-h-screen bg-white ${className}`}>
      <div className={`bilby-gradient-bg ${animate ? "animate" : ""}`} />
      {children}
    </div>
  );
}
