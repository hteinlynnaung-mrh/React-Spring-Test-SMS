import { useState } from "react";
import type { DashboardData, StatCard as StatCardData } from "../types";
import type { PageKey } from "./Sidebar";
import { StatCard } from "./StatCard";
import { StatDetailsModal, type StatDetailKey } from "./StatDetailsModal";

interface Props {
  data: DashboardData;
  onNavigate: (page: PageKey) => void;
}

/**
 * The three KPI cards plus the detail dialog they open.
 * Shared by the Dashboard and the Report page so both behave the same.
 */
export function StatCards({ data, onNavigate }: Props) {
  const [detail, setDetail] = useState<{ key: StatDetailKey; stat: StatCardData } | null>(null);

  const open = (key: StatDetailKey, stat: StatCardData) => () => setDetail({ key, stat });

  return (
    <>
      <div className="stat-grid">
        <StatCard
          data={data.courseProgress}
          tone="yellow"
          icon="flame"
          onDetails={open("course", data.courseProgress)}
        />
        <StatCard
          data={data.attendanceRate}
          tone="pink"
          icon="students"
          onDetails={open("attendance", data.attendanceRate)}
        />
        <StatCard
          data={data.assignments}
          tone="purple"
          icon="report"
          onDetails={open("assignments", data.assignments)}
        />
      </div>

      {detail && (
        <StatDetailsModal
          kind={detail.key}
          stat={detail.stat}
          summary={data.assignmentSummary}
          assignments={data.currentAssignments}
          onNavigate={onNavigate}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
