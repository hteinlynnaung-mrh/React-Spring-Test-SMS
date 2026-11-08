import type { PageKey } from "../components/Sidebar";
import { Icon } from "../components/Icon";

export function HelpPage() {
  return (
    <div className="students-page">
      <h2>Help Center</h2>
      <p className="muted"> How to get things done in Scholarly.</p>
      <div className="announcement-grid">
        {[
          { icon: "students", title: "Manage students", body: "Open the Students page to search, add, edit and remove enrolled students. Changes are saved to the Spring Boot API." },
          { icon: "attendance", title: "Track attendance", body: "The Attendance page lists the last three school days. Present / Late / Absent summaries are computed on the backend." },
          { icon: "report", title: "Read reports", body: "The Report page mirrors the dashboard KPIs plus the GPA trend so you can export a quick summary." },
        ].map((c) => (
          <article key={c.title} className="card announcement-card">
            <div className="announcement-head">
              <span className="event-badge"><Icon name={c.icon} size={16} /></span>
              <h3>{c.title}</h3>
            </div>
            <p>{c.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

interface SettingsProps {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  startPage: PageKey;
  onStartPageChange: (page: PageKey) => void;
}

export function SettingsPage({
  theme,
  onThemeChange,
  startPage,
  onStartPageChange,
}: SettingsProps) {
  return (
    <div className="students-page">
      <h2>Settings</h2>
      <p className="muted">Preferences are stored locally in your browser.</p>
      <section className="card table-card">
        <ul className="report-rows">
          <li>
            <span>Theme</span>
            <select
              className="settings-select"
              value={theme}
              onChange={(e) => onThemeChange(e.target.value as "light" | "dark")}
              aria-label="Theme"
            >
              <option value="light">Scholarly light</option>
              <option value="dark">Scholarly dark</option>
            </select>
          </li>
          <li>
            <span>Start page</span>
            <select
              className="settings-select"
              value={startPage}
              onChange={(e) => onStartPageChange(e.target.value as PageKey)}
              aria-label="Start page"
            >
              <option value="dashboard">Dashboard</option>
              <option value="students">Students</option>
              <option value="attendance">Attendance</option>
              <option value="report">Report</option>
              <option value="announcements">Announcements</option>
            </select>
          </li>
        </ul>
      </section>
    </div>
  );
}
