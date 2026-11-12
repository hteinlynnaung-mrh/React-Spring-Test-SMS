import { useEffect, useRef, useState } from "react";
import type { Student } from "../types";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";

interface TopbarProps {
  firstName: string;
  role: string;
  greeting: string;
  search: string;
  onSearchChange: (value: string) => void;
  onMenuClick: () => void;
  unreadCount?: number;
  onBellClick?: () => void;
  students?: Student[];
  onSelectStudent?: (student: Student) => void;
  onSignOut?: () => void;
  /** Current color theme — drives which icon the toggle shows. */
  theme?: "light" | "dark";
  /** Flips light ↔ dark. */
  onThemeToggle?: () => void;
}

export function Topbar({
  firstName,
  role,
  greeting,
  search,
  onSearchChange,
  onMenuClick,
  unreadCount = 0,
  onBellClick,
  students = [],
  onSelectStudent,
  onSignOut,
  theme = "light",
  onThemeToggle,
}: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
        <Icon name="kebab" size={20} />
      </button>

      <div className="page-title">
        <p className="app-name">{greeting}</p>
        <p className="app-sub">Student Management</p>
      </div>

      <div className="search-box">
        <Icon name="search" size={18} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search here..."
          aria-label="Search"
        />
        <kbd>F</kbd>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="bell-button theme-toggle"
          onClick={onThemeToggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
        </button>

        <button className="bell-button" title="Notifications" onClick={onBellClick}>
          <Icon name="bell" size={20} />
          {unreadCount > 0 && <span className="bell-dot">{unreadCount}</span>}
        </button>

        <div className="profile-menu-wrap" ref={menuRef}>
          <button
            className="profile-chip"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
          >
            <Avatar name={firstName} size={40} />
            <span className="profile-text">
              <strong>{firstName}</strong>
              <small>{role}</small>
            </span>
            <Icon name="chevronDown" size={16} />
          </button>

          {menuOpen && students.length > 0 && (
            <ul className="profile-dropdown card" role="listbox" aria-label="Switch student account">
              <li className="profile-dropdown-head">Switch Student Account</li>
              {students.map((s) => {
                const name = `${s.firstName} ${s.lastName}`;
                const active = name === firstName;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`profile-dropdown-item ${active ? "active" : ""}`}
                      onClick={() => {
                        onSelectStudent?.(s);
                        setMenuOpen(false);
                      }}
                    >
                      <Avatar name={name} size={30} />
                      <span className="profile-dropdown-text">
                        <strong>{name}</strong>
                        <small>{s.course} · Grade {s.gradeLevel}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
              {onSignOut && (
                <li className="profile-dropdown-footer">
                  <button
                    type="button"
                    className="profile-dropdown-item danger"
                    onClick={() => {
                      setMenuOpen(false);
                      onSignOut();
                    }}
                  >
                    <Icon name="logout" size={16} />
                    <span>Sign Out</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
