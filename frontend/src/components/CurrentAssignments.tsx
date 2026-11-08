import { useState } from "react";
import * as api from "../api";
import type { AssignmentItem } from "../types";
import { Icon } from "./Icon";
import { formatShortDate, localISODate } from "../dates";

const DAY_LETTERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const NEXT_STATUS: Record<AssignmentItem["status"], AssignmentItem["status"]> = {
  PENDING: "COMPLETED",
  COMPLETED: "OVERDUE",
  OVERDUE: "PENDING",
};

function currentWeekDays(today = new Date()) {
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const idx = (i + 1) % 7; // Mon..Sat
    return { date: d.getDate(), letter: DAY_LETTERS[idx], iso: localISODate(d) };
  });
}

/** Parse "08:24 am" / "01:00 pm" into minutes since midnight for chronological sort. */
function minutesOfDay(time: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(time.trim());
  if (!m) return 0;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const mer = m[3]?.toLowerCase();
  if (mer === "pm" && h !== 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  return h * 60 + min;
}

/** Week strip + upcoming assignment list. */
export function CurrentAssignments({
  assignments,
  onChanged,
}: {
  assignments: AssignmentItem[];
  onChanged?: () => void;
}) {
  const [days] = useState(currentWeekDays);
  const [selectedISO, setSelectedISO] = useState(localISODate);
  const [showAll, setShowAll] = useState(false);

  const selectedDate = days.find((d) => d.iso === selectedISO);
  const selectedLabel = selectedDate
    ? `${selectedDate.letter}^${selectedDate.date}`
    : assignments[0] && formatShortDate(assignments[0].dueISO);

  const sorted = [...assignments].sort(
    (a, b) => a.dueISO.localeCompare(b.dueISO) || minutesOfDay(a.dueTime) - minutesOfDay(b.dueTime)
  );
  const list = showAll ? sorted : sorted.slice(0, 3);

  async function toggleStatus(item: AssignmentItem) {
    try {
      await api.updateAssignmentStatus(item.id, NEXT_STATUS[item.status]);
      onChanged?.();
    } catch {
      // ignore transient errors
    }
  }

  return (
    <section className="card panel">
      <header className="panel-head">
        <h3>Current Assignment</h3>
        <button className="ghost-btn" onClick={() => setShowAll((v) => !v)}>
          <Icon name="book" size={14} /> {showAll ? "Top 3" : `All Task (${assignments.length})`}
        </button>
      </header>

      <div className="week-strip">
        {days.map((d) => {
          const active = d.iso === selectedISO;
          return (
            <button
              key={d.iso}
              className={`week-day ${active ? "active" : ""}`}
              onClick={() => setSelectedISO(d.iso)}
            >
              <span className="week-num">{d.date}</span>
              <span className="week-letter">{d.letter}</span>
            </button>
          );
        })}
      </div>

      <ul className="assignment-list">
        {list.map((a) => (
          <li key={a.id} className="assignment-item">
            <div className="assignment-due">
              <small>Before {formatShortDate(a.dueISO)}</small>
              <strong>{a.dueTime}</strong>
            </div>
            <div className="assignment-info">
              <p className="assignment-title">{a.title}</p>
              <p className="assignment-subject">{a.subject}</p>
              <p className="assignment-date">Due {formatShortDate(a.dueISO)} · {a.status.toLowerCase()}</p>
            </div>
            <button
              className="icon-btn"
              onClick={() => toggleStatus(a)}
              title={`Status: ${a.status} (click to cycle)`}
              aria-label={`Toggle status for ${a.title}`}
            >
              <Icon name="chevronRight" size={16} />
            </button>
          </li>
        ))}
      </ul>

      <p className="week-note">
        Selected: <b>{selectedLabel?.replace("^", " ")}</b>
      </p>
    </section>
  );
}
