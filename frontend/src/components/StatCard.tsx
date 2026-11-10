import type { StatCard as StatCardType } from "../types";
import { Icon } from "./Icon";

const CARD_STYLES: Record<string, { bg: string; iconBg: string; badge: string }> = {
  yellow: { bg: "#FAF4A5", iconBg: "rgba(0,0,0,.82)", badge: "#EDE98B" },
  pink: { bg: "#FBD9DA", iconBg: "#1F2432", badge: "#F6C4C6" },
  purple: { bg: "#E3DDFB", iconBg: "#1F2432", badge: "#D3CBF7" },
};

interface Props {
  data: StatCardType;
  tone: "yellow" | "pink" | "purple";
  icon: string;
  /** Opens the detail dialog; the whole card and the CTA both trigger it. */
  onDetails?: () => void;
}

export function StatCard({ data, tone, icon, onDetails }: Props) {
  const style = CARD_STYLES[tone];
  const up = data.delta >= 0;
  return (
    <article
      className={onDetails ? "stat-card is-clickable" : "stat-card"}
      style={{ background: style.bg }}
      onClick={onDetails}
    >
      <div className="stat-head">
        <span className="stat-icon" style={{ background: style.iconBg }}>
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
          style={{ background: style.badge }}
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
