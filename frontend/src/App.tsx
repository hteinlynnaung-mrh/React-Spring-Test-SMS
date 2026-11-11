import { useCallback, useEffect, useState } from "react";
import * as api from "./api";
import type { DashboardData, Student } from "./types";
import type { PageKey } from "./components/Sidebar";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Avatar } from "./components/Avatar";
import { DashboardPage } from "./pages/DashboardPage";
import { StudentsPage } from "./pages/StudentsPage";
import { AttendancePage } from "./pages/AttendancePage";
import { ReportPage } from "./pages/ReportPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { HelpPage, SettingsPage } from "./pages/MiscPages";

const VALID: PageKey[] = ["dashboard", "students", "attendance", "report", "announcements", "help", "settings"];

const STORAGE_USER_NAME = "scholarly.userName";
const STORAGE_USER_ROLE = "scholarly.userRole";
const STORAGE_SIGNED_OUT = "scholarly.signedOut";
const STORAGE_THEME = "scholarly.theme";
const STORAGE_START_PAGE = "scholarly.startPage";

function savedStartPage(): PageKey {
  const saved = localStorage.getItem(STORAGE_START_PAGE) as PageKey;
  return VALID.includes(saved) ? saved : "dashboard";
}

function currentHash(): PageKey {
  const key = location.hash.replace(/^#\//, "") as PageKey;
  return VALID.includes(key) ? key : savedStartPage();
}

const TITLES: Record<PageKey, string> = {
  dashboard: "Dashboard",
  students: "Students",
  attendance: "Attendance",
  report: "Report",
  announcements: "Announcements",
  help: "Help Center",
  settings: "Settings",
};

export default function App() {
  const [page, setPage] = useState<PageKey>(currentHash);
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window === "undefined" ? true : window.innerWidth > 880
  );
  const [search, setSearch] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  /** GPA-chart month (1–12); defaults to the current month, matches the backend. */
  const [dashboardMonth, setDashboardMonth] = useState(() => new Date().getMonth() + 1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [signedOut, setSignedOut] = useState(
    () => localStorage.getItem(STORAGE_SIGNED_OUT) === "true"
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem(STORAGE_USER_NAME) || "Mithun Ray"
  );
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem(STORAGE_USER_ROLE) || "Student"
  );
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem(STORAGE_THEME) === "dark" ? "dark" : "light"
  );
  const [startPage, setStartPage] = useState<PageKey>(savedStartPage);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  const changeStartPage = useCallback((next: PageKey) => {
    setStartPage(next);
    localStorage.setItem(STORAGE_START_PAGE, next);
  }, []);

  const selectAccount = useCallback((name: string, role: string) => {
    setUserName(name);
    setUserRole(role);
    setSignedOut(false);
    localStorage.setItem(STORAGE_USER_NAME, name);
    localStorage.setItem(STORAGE_USER_ROLE, role);
    localStorage.setItem(STORAGE_SIGNED_OUT, "false");
  }, []);

  useEffect(() => {
    const onHash = () => setPage(currentHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  /* Keep the drawer in sync with the viewport so it never covers content. */
  const [narrow, setNarrow] = useState(() => window.innerWidth <= 880);
  useEffect(() => {
    const onResize = () => {
      const isNarrow = window.innerWidth <= 880;
      setNarrow(isNarrow);
      setSidebarOpen(!isNarrow);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navigate = useCallback((key: PageKey) => {
    location.hash = `#/${key}`;
    setPage(key);
    if (window.innerWidth <= 880) setSidebarOpen(false);
  }, []);

  /* No parameters: it is also passed straight to <EmptyState onRetry={...}>,
     which would otherwise hand it a MouseEvent. Month comes from state. */
  const loadDashboard = useCallback(() => {
    api
      .getDashboard(dashboardMonth)
      .then((data) => {
        setDashboard(data);
        setDashboardError(null);
      })
      .catch((e) => setDashboardError(e instanceof Error ? e.message : "Failed to load dashboard"));
  }, [dashboardMonth]);

  /* Load dashboard whenever it is relevant (or the picked month changes) */
  const needsDashboard = page === "dashboard" || page === "report";
  useEffect(() => {
    if (needsDashboard) loadDashboard();
  }, [needsDashboard, loadDashboard]);

  /* Announcements badge & student account list */
  useEffect(() => {
    api
      .getAnnouncements()
      .then((list) => setUnreadCount(list.length))
      .catch(() => setUnreadCount(0));
    api
      .getStudents()
      .then(setStudents)
      .catch(() => undefined);
  }, [page]);

  /* Derive the current user's display name from the newest student search (demo touch) */
  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    api
      .getStudents(q)
      .then((list) => {
        if (list.length > 0) {
          selectAccount(`${list[0].firstName} ${list[0].lastName}`, list[0].course);
        }
      })
      .catch(() => undefined);
  }, [search, selectAccount]);

  const signOut = useCallback(() => {
    setSignedOut(true);
    localStorage.setItem(STORAGE_SIGNED_OUT, "true");
  }, []);

  if (signedOut) {
    return (
      <div className="login-screen">
        <div className="login-card card">
          <div className="sidebar-brand login-brand">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <path
                d="M12 2s5 4.5 5 9a5 5 0 0 1-10 0c0-1.5.5-3 1.5-4.5C9 9 12 7 12 2z"
                fill="#1F2432"
              />
            </svg>
            <span>Scholarly</span>
          </div>
          <h2>Sign In</h2>
          <p className="muted">Choose a student account to continue.</p>

          {students.length > 0 ? (
            <ul className="login-list">
              {students.map((s) => {
                const name = `${s.firstName} ${s.lastName}`;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => selectAccount(name, s.course)}
                    >
                      <Avatar name={name} size={36} />
                      <span className="profile-dropdown-text">
                        <strong>{name}</strong>
                        <small>{s.email} · {s.course}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <button
              type="button"
              className="btn-dark"
              onClick={() => selectAccount(userName, userRole)}
            >
              Continue as {userName}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {narrow && sidebarOpen && (
        <div className="drawer-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar page={page} onNavigate={navigate} unreadCount={unreadCount} onSignOut={signOut} />

      <main className="main">
        <Topbar
          firstName={userName}
          role={userRole}
          greeting={TITLES[page]}
          search={search}
          onSearchChange={setSearch}
          onMenuClick={() => setSidebarOpen((o) => !o)}
          unreadCount={unreadCount}
          onBellClick={() => navigate("announcements")}
          students={students}
          onSelectStudent={(s) => selectAccount(`${s.firstName} ${s.lastName}`, s.course)}
          onSignOut={signOut}
        />

        {page === "dashboard" &&
          (dashboard ? (
            <DashboardPage
              data={dashboard}
              month={dashboardMonth}
              onMonthChange={setDashboardMonth}
              onNavigate={navigate}
              onRefresh={loadDashboard}
            />
          ) : (
            <EmptyState error={dashboardError} onRetry={loadDashboard} />
          ))}

        {page === "students" && <StudentsPage search={search} />}
        {page === "attendance" && <AttendancePage />}
        {page === "report" && <ReportPage data={dashboard} onNavigate={navigate} />}
        {page === "announcements" && <AnnouncementsPage onCountChange={setUnreadCount} />}
        {page === "help" && <HelpPage />}
        {page === "settings" && (
          <SettingsPage
            theme={theme}
            onThemeChange={setTheme}
            startPage={startPage}
            onStartPageChange={changeStartPage}
          />
        )}
      </main>
    </div>
  );
}

function EmptyState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="table-empty card">
      {error ?? "Loading dashboard…"}
      {error && (
        <button className="ghost-btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
