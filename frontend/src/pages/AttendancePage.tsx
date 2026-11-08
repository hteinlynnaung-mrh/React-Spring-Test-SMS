import { useCallback, useEffect, useState } from "react";
import * as api from "../api";
import type { AttendanceRecord, AttendanceSummary } from "../types";
import { Icon } from "../components/Icon";

const STATUS_AI: Record<string, string> = {
  PRESENT: "#3BB98F",
  ABSENT: "#E9848A",
  LATE: "#F08A3C",
};

const NEXT_STATUS: Record<AttendanceRecord["status"], AttendanceRecord["status"]> = {
  PRESENT: "LATE",
  LATE: "ABSENT",
  ABSENT: "PRESENT",
};

export function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return Promise.all([api.getAttendance(3), api.getAttendanceSummary()])
      .then(([recs, sum]) => {
        setRecords(recs);
        setSummary(sum);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load attendance"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cycleStatus(record: AttendanceRecord) {
    const next = NEXT_STATUS[record.status];
    try {
      await api.markAttendance({
        studentId: record.studentId,
        date: record.date,
        status: next,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update attendance");
    }
  }

  return (
    <div className="students-page">
      <div className="students-toolbar">
        <div>
          <h2>Attendance</h2>
          <p className="muted">Last 3 school days, one record per enrolled student. Click a status to toggle it.</p>
        </div>
        <div className="summary-chips">
          <span className="chip chip-green"><Icon name="attendance" size={14} /> Present {summary?.present ?? "–"}</span>
          <span className="chip chip-orange"><Icon name="clock" size={14} /> Late {summary?.late ?? "–"}</span>
          <span className="chip chip-red"><Icon name="close" size={14} /> Absent {summary?.absent ?? "–"}</span>
          <span className="chip chip-gray">Weekly rate {summary?.rate ?? "–"}%</span>
        </div>
      </div>

      <section className="card table-card">
        {loading ? (
          <p className="table-empty">Loading attendance…</p>
        ) : error ? (
          <p className="table-empty">{error}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.studentName}</b></td>
                  <td>{r.course}</td>
                  <td>{r.date}</td>
                  <td>
                    <button
                      type="button"
                      className="ghost-btn activity-status"
                      onClick={() => cycleStatus(r)}
                      title="Click to cycle status (Present → Late → Absent)"
                      style={{
                        color: r.status === "PRESENT" ? "#3BB98F" : r.status === "LATE" ? "#F08A3C" : "#E9848A",
                      }}
                    >
                      <span className="status-dot" style={{ background: STATUS_AI[r.status] }} />
                      {r.status.toLowerCase()}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
