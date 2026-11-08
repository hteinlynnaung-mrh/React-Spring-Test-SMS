import { useState } from "react";

const PALETTE = ["#F2B9A1", "#B7D7C2", "#F5E6A8", "#C9C6F4", "#F4A9A8", "#A8D8F0", "#EAB6E4", "#BFC9A5"];

function initialsColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** DiceBear avatar that falls back to coloured initials when the image cannot load (e.g. offline). */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent`;
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (failedUrl !== url) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="avatar"
        onError={() => setFailedUrl(url)}
        loading="lazy"
      />
    );
  }
  return (
    <span className="avatar avatar-fallback" style={{ width: size, height: size, background: initialsColor(name) }}>
      {initials}
    </span>
  );
}
