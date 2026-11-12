import type { StatCard as StatCardType } from "../types";
import { Icon } from "./Icon";

/* Card / icon / CTA colors live in CSS (`.tone-*` rules) so dark mode can
   retheme them; inline styles would pin the pastels in both themes. */

interface Props {
  data: StatCardType;
  tone: "yellow" | "pink" | "purple";
  icon: string;
  /** Opens the detail dialog; the whole card and the CTA both trigger it. */
  onDetails?: () => void;
}

export function StatCard({ data, tone, icon, onDetails }: Props) {
  const up = data.delta >= 0;
  return (
    <article
      className={onDetails ? `stat-card tone-${tone} is-clickable` : `stat-card tone-${tone}`}
      onClick={onDetails}
    >
      <div className="stat-head">
        <span className="stat-icon">
          <Icon name={icon} size={18} />
        </span>
        <span className="stat-title">{data.title}</span>
        <span className="stat-more" aria-label={`${data.title} options`}>⋯</span>
      </div>

      <div className="stat-row">
        <p className="stat-value">
          {Math.round(data.value)}
          <span>%</span>
        </p>
        <span className="stat-delta">
          {up ? "▲" : "▼"} {Math.abs(Math.round(data.delta))}%
        </span>
      </div>

      <div className="stat-row">
        <p className="stat-sub">{data.subtitle}</p>
        <button
          className="stat-cta"
          onClick={(e) => {
            e.stopPropagation();
            onDetails?.();
          }}
          aria-label={`See details of ${data.title}`}
        >
          See Details <b>→</b>
        </button>
      </div>
    </article>
  );
}
