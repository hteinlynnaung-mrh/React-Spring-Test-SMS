import { useState } from "react";
import type { GpaDay } from "../types";

/** GPA scale shown on the Y axis. */
const GRADES = ["A", "B", "C", "D", "E", "F"];

/**
 * Grouped bar chart: solid dark bars = Past, hatched pink bars = Recent.
 * Live GPA annotates the tallest recent bar with a dashed connector.
 */
export function GpaChart({ days, currentGpa }: { days: GpaDay[]; currentGpa: number }) {
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const W = 420;
  const H = 220;
  const pad = { top: 40, right: 10, bottom: 28, left: 30 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const max = 4;
  const y = (v: number) => pad.top + chartH - (v / max) * chartH;

  const groupW = chartW / Math.max(1, days.length);
  const barW = Math.min(10, groupW / 3.2);
  const peakIdx = days.length === 0 ? 0 : days.reduce((best, d, i) => (d.recent > days[best].recent ? i : best), 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="gpa-chart" role="img" aria-label="Average GPA bar chart">
      <defs>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#F6C4C6" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#E9848A" strokeWidth="2.4" />
        </pattern>
      </defs>

      {/* Y grid + labels */}
      {[5, 4, 3, 2, 1, 0].map((i) => {
        const gradeValue = ((5 - i) / 5) * max;
        return (
          <g key={i}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={y(gradeValue)}
              y2={y(gradeValue)}
              stroke={i === 0 ? "#E5E7EE" : "#F1F2F5"}
            />
            {i < 6 && GRADES[i] && (
              <text x={pad.left - 10} y={y(gradeValue) + 4} className="chart-label">
                {GRADES[i]}
              </text>
            )}
          </g>
        );
      })}

      {days.map((d, i) => {
        const cx = pad.left + groupW * i + groupW / 2;
        const pastX = cx - barW - 3;
        const recentX = cx + 3;
        const active = highlighted === i;
        return (
          <g key={d.label} onMouseEnter={() => setHighlighted(i)} onMouseLeave={() => setHighlighted(null)}>
            <rect x={pad.left + groupW * i} y={pad.top} width={groupW} height={chartH} fill={active ? "#FBFBFC" : "none"} />
            <rect
              x={pastX}
              y={y(d.past)}
              width={barW}
              height={pad.top + chartH - y(d.past)}
              fill="#5B6270"
              rx={barW / 2}
            />
            <rect
              x={recentX}
              y={y(d.recent)}
              width={barW}
              height={pad.top + chartH - y(d.recent)}
              fill="url(#hatch)"
              stroke="#E9848A"
              strokeWidth="1"
              rx={barW / 2}
            />
            <text x={cx} y={H - 8} className="chart-label" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Live GPA annotation */}
      <line
        x1={pad.left}
        x2={pad.left + groupW * peakIdx + groupW / 2 + 4}
        y1={y(currentGpa)}
        y2={y(currentGpa)}
        stroke="#2E2E38"
        strokeDasharray="3 3"
      />
      <rect
        x={pad.left + groupW * peakIdx + groupW / 2 + 6}
        y={y(currentGpa) - 11}
        rx={8}
        width={44}
        height={22}
        fill="#2E2E38"
      />
      <text
        x={pad.left + groupW * peakIdx + groupW / 2 + 28}
        y={y(currentGpa) + 4}
        textAnchor="middle"
        fill="#fff"
        fontSize="10"
        fontWeight={600}
      >
        GPA {currentGpa.toFixed(1)}
      </text>
    </svg>
  );
}
