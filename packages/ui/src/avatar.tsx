import * as React from "react";

const palette = ["#FF5A5A", "#3B82F6", "#19A974", "#E8A317", "#8B5CF6", "#0EA5E9"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name, size = 36, src }: { name: string; size?: number; src?: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="inline-block shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const color = palette[name.length % palette.length];
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full font-bold text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}
