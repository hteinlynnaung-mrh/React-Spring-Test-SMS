import type { DashboardData } from "../types";
import type { PageKey } from "../components/Sidebar";
import { StatCards } from "../components/StatCards";
import { GpaChart } from "../components/GpaChart";
import { MonthPicker } from "../components/MonthPicker";
import { CompletionDonut } from "../components/CompletionDonut";
import { CurrentAssignments } from "../components/CurrentAssignments";
import { ActivitySchedule, UpcomingEvents } from "../components/DashboardPanels";
import { Icon } from "../components/Icon";

interface Props {
  data: DashboardData;
  /** GPA chart month (1–12) and its setter — drives the panel's month dropdown. */
  month: number;
  onMonthChange: (month: number) => void;
  onNavigate: (page: PageKey) => void;
  onRefresh?: () => void;
}

export function DashboardPage({ data, month, onMonthChange, onNavigate, onRefresh }: Props) {
  return (
    <div className="dashboard">
      {/* KPI row */}
      <StatCards data={data} onNavigate={onNavigate} />

      {/* Middle row: GPA + donut, right rail */}
      <div className="dash-middle">
        <div className="dash-left">
          <div className="dash-middle-row">
            <section className="card panel gpa-panel">
              <header className="panel-head">
                <h3>Average GPA</h3>
                <div className="panel-head-right">
                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: "#5B6270" }} /> Past
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: "#E9848A" }} /> Recent
                  </span>
                  <MonthPicker value={month} onChange={onMonthChange} />
                </div>
              </header>
              <GpaChart days={data.gpaDays} currentGpa={data.currentGpa} />
            </section>

            <section className="card panel donut-panel">
              <h3 className="donut-title">Assignment Completion</h3>
              <CompletionDonut summary={data.assignmentSummary} />
            </section>
          </div>

          <ActivitySchedule activities={data.activities} />
        </div>

        <div className="dash-right">
          <CurrentAssignments assignments={data.currentAssignments} onChanged={onRefresh} />
          <UpcomingEvents events={data.events} />
        </div>
      </div>

      <button className="fab" onClick={() => onNavigate("students")} title="Manage students">
        <Icon name="plus" size={20} /> Students
      </button>
    </div>
  );
}
