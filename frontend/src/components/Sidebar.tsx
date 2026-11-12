import { Icon } from "./Icon";

export type PageKey =
  | "dashboard"
  | "students"
  | "attendance"
  | "report"
  | "announcements"
  | "help"
  | "settings";

interface SidebarProps {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
  /** Opens the "add" flow for the page (Report → new assignment, Announcements → new post). */
  onQuickAdd: (page: PageKey) => void;
  unreadCount: number;
  onSignOut: () => void;
}

const MAIN_ITEMS: { key: PageKey; label: string; icon: string; badge?: boolean }[] = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "students", label: "Students", icon: "students" },
  { key: "attendance", label: "Attendance", icon: "attendance" },
  { key: "report", label: "Report", icon: "report", badge: true },
  { key: "announcements", label: "Announcements", icon: "announcements", badge: true },
];

/** Tooltips/labels for the sidebar quick-add (+) buttons. */
const ADD_LABEL: Partial<Record<PageKey, string>> = {
  report: "New assignment",
  announcements: "New announcement",
};

export function Sidebar({ page, onNavigate, onQuickAdd, unreadCount, onSignOut }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path
            d="M12 2s5 4.5 5 9a5 5 0 0 1-10 0c0-1.5.5-3 1.5-4.5C9 9 12 7 12 2z"
            fill="currentColor"
          />
        </svg>
        <span>Scholarly</span>
      </div>

      <p className="sidebar-heading">Main Menu</p>
      <nav className="sidebar-nav">
        {MAIN_ITEMS.map((item) => (
          <div className="sidebar-row" key={item.key}>
            <button
              className={`sidebar-item ${page === item.key ? "active" : ""}`}
              onClick={() => onNavigate(item.key)}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </button>
            {item.badge && (
              <button
                type="button"
                className="sidebar-plus"
                aria-label={ADD_LABEL[item.key]}
                title={ADD_LABEL[item.key]}
                onClick={() => onQuickAdd(item.key)}
              >
                +
              </button>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className={`sidebar-item ${page === "help" ? "active" : ""}`}
          onClick={() => onNavigate("help")}
        >
          <Icon name="help" size={20} />
          <span>Help Center</span>
        </button>
        <button
          className={`sidebar-item ${page === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <Icon name="settings" size={20} />
          <span>Settings</span>
        </button>
        <button className="sidebar-item" onClick={onSignOut}>
          <Icon name="logout" size={20} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="sidebar-bell" title={`${unreadCount} announcements`}>
        <Icon name="bell" size={18} />
        {unreadCount > 0 && <span className="bell-dot">{unreadCount}</span>}
      </div>
    </aside>
  );
}
