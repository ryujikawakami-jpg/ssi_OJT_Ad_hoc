"use client";

export default function Logo({ mono = false, size = 22 }: { mono?: boolean; size?: number }) {
  const color = mono ? "currentColor" : "var(--sd-forest)";
  return (
    <span
      className="inline-flex items-baseline gap-2.5"
      style={{ color, fontFamily: "var(--font-serif-jp)", fontSize: size, letterSpacing: "0.04em", fontWeight: 500 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke={color} strokeWidth="1" />
        <path d="M7 14 L12 8 L17 14 Z" fill="none" stroke={color} strokeWidth="1" />
        <line x1="12" y1="8" x2="12" y2="17" stroke={color} strokeWidth="1" />
      </svg>
      <span>ShopDemo</span>
    </span>
  );
}
