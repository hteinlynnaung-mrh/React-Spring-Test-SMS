import { useState } from "react";
import type { AssignmentSummary } from "../types";

interface Segment {
  label: string;
  value: number;
  color: string;
  hatch?: boolean;
}

/** Donut chart for assignment completion: Completed / Pending / Overdue. */
export function CompletionDonut({ summary }: { summary: AssignmentSummary }) {
  const [hover, setHover] = useState<string | null>(null);

  const segments: Segment[] = [
    { label: "Completed", value: summary.completed, color: "var(--chart-ink)" },
    { label: "Pending", value: summary.pending, color: "#E9848A", hatch: true },
    { label: "Overdue", value: summary.overdue, color: "#FAF4A5" },
  ];
  const total = Math.max(1, segments.reduce((s, seg) => s + seg.value, 0));

  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 200 200" className="donut" role="img" aria-label="Assignment completion">
        <defs>
          <pattern id="donut-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
            <rect width="5" height="5" fill="#E9848A" />
            <line x1="0" y1="0" x2="0" y2="5" stroke="#C96A71" strokeWidth="2.2" />
          </pattern>
        </defs>
        {segments.map((seg) => {
          const frac = seg.value / total;
          const dash = frac * C;
          const el = (
            <circle
              key={seg.label}
              cx="100"
              cy="100"
              r={R}
              fill="none"
              strokeWidth={hover === seg.label ? 38 : 34}
              strokeDasharray={`${Math.max(dash - 3, 0.5)} ${C - dash + 3}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 100 100)"
              strokeLinecap="butt"
              onMouseEnter={() => setHover(seg.label)}
              onMouseLeave={() => setHover(null)}
              // stroke lives in style: var() is only valid in CSS, not SVG attributes.
              style={{ transition: "stroke-width .15s", stroke: seg.color }}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>

      <div className="donut-center">
        <p className="donut-total">
          {hover
            ? Math.round((segments.find((s) => s.label === hover)!.value / total) * 100)
            : summary.total}
          <small>{hover ? "%" : ""}</small>
        </p>
        <p className="donut-center-label">Total<br />Summary</p>
      </div>

      <ul className="donut-legend">
        {segments.map((seg) => (
          <li key={seg.label}>
            <span
              className="legend-dot"
              style={{
                background: seg.hatch
                  ? "repeating-linear-gradient(45deg,#E9848A 0 3px,#C96A71 3px 6px)"
                  : seg.color,
              }}
            />
            {seg.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
