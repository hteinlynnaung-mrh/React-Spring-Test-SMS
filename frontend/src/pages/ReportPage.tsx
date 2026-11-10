import type { DashboardData } from "../types";
import type { PageKey } from "../components/Sidebar";
import { GpaChart } from "../components/GpaChart";
import { StatCards } from "../components/StatCards";
import { Icon } from "../components/Icon";

interface Props {
  data: DashboardData | null;
  onNavigate: (page: PageKey) => void;
}

/** Report page reuses the dashboard widgets for a compact overview. */
export function ReportPage({ data, onNavigate }: Props) {
  if (!data) return <p className="table-empty">Loading report…</p>;

  return (
    <div className="dashboard">
      <div className="students-toolbar">
        <div>
          <h2>Report</h2>
          <p className="muted">Class-level performance, GPA trend and completion summary.</p>
        </div>
        <button className="ghost-btn" onClick={() => window.print()}>
          <Icon name="report" size={14} /> Export PDF
        </button>
      </div>

      <StatCards data={data} onNavigate={onNavigate} />

      <div className="dash-middle-row">
        <section className="card panel gpa-panel">
          <header className="panel-head">
            <h3>Average GPA Trend</h3>
          </header>
          <GpaChart days={data.gpaDays} currentGpa={data.currentGpa} />
        </section>
        <section className="card panel donut-panel">
          <h3 className="donut-title">Assignment Completion</h3>
          <ul className="report-rows">
            <li><span>Completed</span><b>{data.assignmentSummary.completed}</b></li>
            <li><span>Pending</span><b>{data.assignmentSummary.pending}</b></li>
            <li><span>Overdue</span><b>{data.assignmentSummary.overdue}</b></li>
            <li><span>Total</span><b>{data.assignmentSummary.total}</b></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
