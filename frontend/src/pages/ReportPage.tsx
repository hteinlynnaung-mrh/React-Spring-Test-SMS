import { useState } from "react";
import * as api from "../api";
import type { AssignmentItem, DashboardData } from "../types";
import type { PageKey } from "../components/Sidebar";
import { GpaChart } from "../components/GpaChart";
import { StatCards } from "../components/StatCards";
import { Icon } from "../components/Icon";

interface Props {
  data: DashboardData | null;
  onNavigate: (page: PageKey) => void;
  /** Reloads the dashboard payload (called after an assignment is created). */
  onRefresh?: () => void;
  /** New Assignment dialog — controlled so the sidebar "+" can open it. */
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

const EMPTY_FORM = {
  title: "",
  subject: "",
  dueISO: "",
  dueTime: "09:00 am",
  status: "PENDING" as AssignmentItem["status"],
};

/** Report page reuses the dashboard widgets for a compact overview. */
export function ReportPage({
  data,
  onNavigate,
  onRefresh,
  addOpen,
  onAddOpenChange,
}: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createAssignment({
        title: form.title.trim(),
        subject: form.subject.trim(),
        dueISO: form.dueISO,
        dueTime: form.dueTime.trim(),
        status: form.status,
      });
      setForm(EMPTY_FORM);
      onAddOpenChange(false);
      onRefresh?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <p className="table-empty">Loading report…</p>;

  return (
    <div className="dashboard">
      <div className="students-toolbar">
        <div>
          <h2>Report</h2>
          <p className="muted">Class-level performance, GPA trend and completion summary.</p>
        </div>
        <div className="toolbar-actions">
          <button
            className="btn-dark"
            onClick={() => {
              setFormError(null);
              onAddOpenChange(true);
            }}
          >
            <Icon name="plus" size={16} /> New Assignment
          </button>
          <button className="ghost-btn" onClick={() => window.print()}>
            <Icon name="report" size={14} /> Export PDF
          </button>
        </div>
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

      {addOpen && (
        <div className="modal-backdrop" onClick={() => onAddOpenChange(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3 id="assignment-modal-title">New Assignment</h3>
              <button className="icon-btn" onClick={() => onAddOpenChange(false)} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
            </div>
            <form className="form-grid" onSubmit={submit}>
              <label className="full">
                Title
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label>
                Subject
                <input
                  placeholder="General"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as AssignmentItem["status"] })
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </label>
              <label>
                Due date
                <input
                  type="date"
                  value={form.dueISO}
                  onChange={(e) => setForm({ ...form, dueISO: e.target.value })}
                />
              </label>
              <label>
                Due time
                <input
                  placeholder="09:00 am"
                  value={form.dueTime}
                  onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                />
              </label>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="form-actions">
                <button type="button" className="btn-light" onClick={() => onAddOpenChange(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-dark" disabled={saving}>
                  {saving ? "Adding…" : "Add Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
