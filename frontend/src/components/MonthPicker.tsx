import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

interface Props {
  /** Currently selected month (1–12). */
  value: number;
  onChange: (month: number) => void;
}

/**
 * Month dropdown for the GPA panel: button + 12-month listbox.
 * Closes on outside click, Escape, or picking a month.
 */
export function MonthPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  /** Flip above the button when there is not enough room below (panel sits low). */
  const [flipUp, setFlipUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  /* Measure on open: flip the menu up if it would fall off the viewport. */
  useLayoutEffect(() => {
    if (!open) return;
    const btn = rootRef.current?.getBoundingClientRect();
    const h = menuRef.current?.offsetHeight ?? 0;
    if (btn && btn.bottom + 8 + h > window.innerHeight && btn.top - 8 - h >= 0) {
      setFlipUp(true);
    } else {
      setFlipUp(false);
    }
  }, [open]);

  /* Outside click closes the menu. */
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  /* Escape closes the menu (and keeps focus on the button). */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector<HTMLButtonElement>(".month-picker-btn")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (month: number) => () => {
    onChange(month);
    setOpen(false);
  };

  return (
    <div className="month-picker" ref={rootRef}>
      <button
        type="button"
        className="ghost-btn month-picker-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select month, currently ${MONTHS[value - 1]}`}
        onClick={() => setOpen((o) => !o)}
      >
        {MONTHS[value - 1]} <Icon name="chevronDown" size={12} />
      </button>

      {open && (
        <ul
          ref={menuRef}
          className={flipUp ? "month-menu is-flipped" : "month-menu"}
          role="listbox"
          aria-label="GPA chart month"
        >
          {MONTHS.map((name, i) => {
            const month = i + 1;
            const active = month === value;
            return (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={active ? "month-option is-active" : "month-option"}
                  onClick={pick(month)}
                >
                  {name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
