import { useEffect, useState } from "react";
import * as api from "../api";
import type {
  AssignmentItem,
  AssignmentSummary,
  AttendanceRecord,
  AttendanceSummary,
  StatCard,
  Student,
} from "../types";
import type { PageKey } from "./Sidebar";
import { Icon } from "./Icon";
import { formatShortDate } from "../dates";

export type StatDetailKey = "course" | "attendance" | "assignments";

const META: Record<StatDetailKey, { title: string; blurb: string }> = {
  course: {
    title: "Course Progress",
    blurb: "Enrolment and performance broken down by course.",
  },
  attendance: {
    title: "Attendance Rate",
    blurb: "Present / late / absent counts and the latest school days.",
  },
  assignments: {
    title: "Assignments",
    blurb: "Completion breakdown and every task behind the number.",
  },
};

const ATTENDANCE_COLOR: Record<AttendanceRecord["status"], string> = {
  PRESENT: "#3BB98F",
  LATE: "#F08A3C",
  ABSENT: "#E9848A",
};

const ASSIGNMENT_CHIP: Record<AssignmentItem["status"], string> = {
  COMPLETED: "chip-green",
  PENDING: "chip-orange",
  OVERDUE: "chip-red",
};

interface Props {
  kind: StatDetailKey;
  stat: StatCard;
  summary: AssignmentSummary;
  assignments: AssignmentItem[];
  onNavigate: (page: PageKey) => void;
  onClose: () => void;
}

/** Detail dialog opened from a dashboard/report KPI card. */
export function StatDetailsModal({ kind, stat, summary, assignments, onNavigate, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const meta = META[kind];
  const up = stat.delta >= 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal stat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stat-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h3 id="stat-detail-title">{meta.title}</h3>
            <p className="muted">{meta.blurb}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="stat-modal-hero">
          <p className="stat-value">
            {Math.round(stat.value)}
            <span>%</span>
          </p>
          <span className="stat-delta">
            {up ? "▲" : "▼"} {Math.abs(Math.round(stat.delta))}%
          </span>
          <p className="stat-sub">{stat.subtitle}</p>
        </div>

        {kind === "course" && <CourseDetail onNavigate={onNavigate} onClose={onClose} />}
        {kind === "attendance" && <AttendanceDetail onNavigate={onNavigate} onClose={onClose} />}
        {kind === "assignments" && (
          <AssignmentsDetail
            summary={summary}
            assignments={assignments}
            onNavigate={onNavigate}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="detail-kpi">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

/** Course Progress: status counts + one row per course (fetched live). */
function CourseDetail({
  onNavigate,
  onClose,
}: {
  onNavigate: (page: PageKey) => void;
  onClose: () => void;
}) {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .getStudents()
      .then((list) => {
        if (alive) {
          setStudents(list);
          setError(null);
        }
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load students");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <div className="table-empty">{error}</div>;
  if (!students) return <div className="table-empty">Loading student breakdown…</div>;
  if (students.length === 0) return <div className="table-empty">No students enrolled yet.</div>;

  const count = (status: Student["status"]) => students.filter((s) => s.status === status).length;
  const average = (pick: (s: Student) => number) =>
    students.reduce((sum, s) => sum + pick(s), 0) / students.length;

  const courses = new Map<string, { total: number; active: number; gpa: number; attendance: number }>();
  for (const s of students) {
    const row = courses.get(s.course) ?? { total: 0, active: 0, gpa: 0, attendance: 0 };
    row.total += 1;
    if (s.status === "ACTIVE") row.active += 1;
    row.gpa += s.gpa;
    row.attendance += s.attendanceRate;
    courses.set(s.course, row);
  }
  const rows = [...courses.entries()].sort(
    (a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0])
  );

  return (
    <>
      <div className="detail-kpis">
        <Kpi label="Students" value={students.length} />
        <Kpi label="Active" value={count("ACTIVE")} />
        <Kpi label="Inactive" value={count("INACTIVE")} />
        <Kpi label="Graduated" value={count("GRADUATED")} />
        <Kpi label="Average GPA" value={average((s) => s.gpa).toFixed(2)} />
        <Kpi label="Avg attendance" value={`${Math.round(average((s) => s.attendanceRate))}%`} />
      </div>

      <div className="detail-scroll">
        <table className="detail-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Students</th>
              <th>Active</th>
              <th>Avg GPA</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([course, row]) => (
              <tr key={course}>
                <td>
                  <b>{course}</b>
                </td>
                <td>{row.total}</td>
                <td>{row.active}</td>
                <td>{(row.gpa / row.total).toFixed(2)}</td>
                <td>
                  <div className="attendance-cell">
                    <div className="bar">
                      <span style={{ width: `${Math.round(row.attendance / row.total)}%` }} />
                    </div>
                    {Math.round(row.attendance / row.total)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="detail-actions">
        <button className="btn-dark" onClick={() => { onNavigate("students"); onClose(); }}>
          Open Students <b>→</b>
        </button>
      </div>
    </>
  );
}

/** Attendance Rate: weekly summary chips + records for the last school days. */
function AttendanceDetail({
  onNavigate,
  onClose,
}: {
  onNavigate: (page: PageKey) => void;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([api.getAttendanceSummary(), api.getAttendance(5)])
      .then(([sum, recs]) => {
        if (alive) {
          setSummary(sum);
          setRecords(recs);
        }
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load attendance");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <div className="table-empty">{error}</div>;
  if (!summary) return <div className="table-empty">Loading attendance…</div>;

  const byDate = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const list = byDate.get(r.date) ?? [];
    list.push(r);
    byDate.set(r.date, list);
  }
  const dates = [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <>
      <div className="summary-chips">
        <span className="chip chip-green">Present {summary.present}</span>
        <span className="chip chip-orange">Late {summary.late}</span>
        <span className="chip chip-red">Absent {summary.absent}</span>
        <span className="chip chip-gray">Total {summary.total}</span>
        <span className="chip chip-gray">Rate {summary.rate}%</span>
      </div>

      {dates.length === 0 ? (
        <div className="table-empty">No attendance recorded in the last 5 school days.</div>
      ) : (
        dates.map(([date, list]) => (
          <div key={date}>
            <p className="detail-group-title">{formatShortDate(date)}</p>
            <ul className="detail-list">
              {list.map((r) => (
                <li key={r.id} className="detail-row">
                  <div>
                    <p className="cell-title">{r.studentName}</p>
                    <p className="cell-sub">{r.course}</p>
                  </div>
                  <span
                    className="activity-status"
                    style={{ color: ATTENDANCE_COLOR[r.status] }}
                  >
                    <span
                      className="status-dot"
                      style={{ background: ATTENDANCE_COLOR[r.status] }}
                    />
                    {r.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      <div className="detail-actions">
        <button className="btn-dark" onClick={() => { onNavigate("attendance"); onClose(); }}>
          Open Attendance <b>→</b>
        </button>
      </div>
    </>
  );
}

/** Assignments: completion bars + the full task list (already on the dashboard). */
function AssignmentsDetail({
  summary,
  assignments,
  onNavigate,
  onClose,
}: {
  summary: AssignmentSummary;
  assignments: AssignmentItem[];
  onNavigate: (page: PageKey) => void;
  onClose: () => void;
}) {
  const total = Math.max(1, summary.total);
  const segments = [
    { key: "completed", label: "Completed", value: summary.completed, color: "#2E2E38" },
    { key: "pending", label: "Pending", value: summary.pending, color: "#E9848A" },
    { key: "overdue", label: "Overdue", value: summary.overdue, color: "#EDE98B" },
  ];

  const sorted = [...assignments].sort(
    (a, b) => a.dueISO.localeCompare(b.dueISO) || a.dueTime.localeCompare(b.dueTime)
  );

  return (
    <>
      <div className="detail-kpis">
        <Kpi label="Completed" value={summary.completed} />
        <Kpi label="Pending" value={summary.pending} />
        <Kpi label="Overdue" value={summary.overdue} />
        <Kpi label="Total" value={summary.total} />
        <Kpi label="Completion" value={`${Math.round((summary.completed / total) * 100)}%`} />
      </div>

      <div className="detail-bars">
        {segments.map((seg) => (
          <div key={seg.key} className="detail-bar-row">
            <span>{seg.label}</span>
            <div className="detail-bar">
              <span style={{ width: `${Math.round((seg.value / total) * 100)}%`, background: seg.color }} />
            </div>
            <b>{seg.value}</b>
          </div>
        ))}
      </div>

      <p className="detail-group-title">All assignments</p>
      {sorted.length === 0 ? (
        <div className="table-empty">No assignments yet.</div>
      ) : (
        <ul className="detail-list">
          {sorted.map((a) => (
            <li key={a.id} className="detail-row">
              <div>
                <p className="cell-title">{a.title}</p>
                <p className="cell-sub">
                  {a.subject} · Due {formatShortDate(a.dueISO)} at {a.dueTime}
                </p>
              </div>
              <span className={`chip ${ASSIGNMENT_CHIP[a.status]}`}>{a.status.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="detail-actions">
        <button className="btn-dark" onClick={() => { onNavigate("report"); onClose(); }}>
          Open Report <b>→</b>
        </button>
      </div>
    </>
  );
}
