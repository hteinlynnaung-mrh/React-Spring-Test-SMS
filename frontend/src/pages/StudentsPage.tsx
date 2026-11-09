import { useEffect, useMemo, useState } from "react";
import * as api from "../api";
import type { Student } from "../types";
import { Avatar } from "../components/Avatar";
import { Icon } from "../components/Icon";
import { localISODate } from "../dates";

/** Convenience concat — falls back when the API omits the precomputed field. */
const fullName = (s: Pick<Student, "firstName" | "lastName" | "fullName">) =>
  s.fullName ?? `${s.firstName} ${s.lastName}`;

const EMPTY: Omit<Student, "id"> = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  course: "Art & Design",
  gradeLevel: 10,
  gpa: 3.0,
  attendanceRate: 90,
  status: "ACTIVE",
  enrolledDate: "",
};

const statusClass = (status: string) =>
  status === "ACTIVE" ? "chip-green" : status === "INACTIVE" ? "chip-red" : "chip-gray";

export function StudentsPage({ search }: { search: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Omit<Student, "id">>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setStudents(await api.getStudents(search));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const stats = useMemo(() => {
    const avg = students.length
      ? students.reduce((s, x) => s + x.gpa, 0) / students.length
      : 0;
    return {
      total: students.length,
      active: students.filter((s) => s.status === "ACTIVE").length,
      avgGpa: avg.toFixed(2),
    };
  }, [students]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, enrolledDate: localISODate() });
    setFormError(null);
    setOpen(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    const { id: _id, fullName: _fullName, ...rest } = student;
    setForm(rest);
    setFormError(null);
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.updateStudent(editing.id, form);
      else await api.createStudent(form);
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    try {
      await api.deleteStudent(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setConfirmDelete(null);
    }
  }

  const set = (k: keyof Omit<Student, "id">) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({
      ...f,
      [k]: ["gradeLevel"].includes(k) ? Number(e.target.value) : e.target.value,
    }));

  const setNumber = (k: "gpa" | "attendanceRate") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  return (
    <div className="students-page">
      <div className="students-toolbar">
        <div>
          <h2>Students</h2>
          <p className="muted">
            {stats.total} enrolled · {stats.active} active · average GPA {stats.avgGpa}
          </p>
        </div>
        <button className="btn-dark" onClick={openCreate}>
          <Icon name="plus" size={16} /> Add Student
        </button>
      </div>

      <section className="card table-card">
        {loading ? (
          <p className="table-empty">Loading students…</p>
        ) : error ? (
          <div className="table-empty">
            {error}
            <button className="ghost-btn" onClick={load}>Retry</button>
          </div>
        ) : students.length === 0 ? (
          <p className="table-empty">No students match “{search || "the criteria"}”.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Grade</th>
                <th>GPA</th>
                <th>Attendance</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th className="th-actions" />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="student-cell">
                      <Avatar name={fullName(s)} size={36} />
                      <div>
                        <p className="cell-title">{fullName(s)}</p>
                        <p className="cell-sub">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{s.course}</td>
                  <td>{s.gradeLevel}</td>
                  <td><b>{s.gpa.toFixed(2)}</b></td>
                  <td>
                    <div className="attendance-cell">
                      <div className="bar">
                        <span style={{ width: `${s.attendanceRate}%` }} />
                      </div>
                      {Math.round(s.attendanceRate)}%
                    </div>
                  </td>
                  <td><span className={`chip ${statusClass(s.status)}`}>{s.status}</span></td>
                  <td>{s.enrolledDate}</td>
                  <td className="td-actions">
                    <button
                      className="icon-btn"
                      onClick={() => openEdit(s)}
                      aria-label={`Edit ${fullName(s)}`}
                    >
                      <Icon name="pen" size={16} />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => setConfirmDelete(s)}
                      aria-label={`Delete ${fullName(s)}`}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <SectionSlot visible={open} onClose={() => setOpen(false)} title={editing ? "Edit Student" : "Add New Student"}>
          <form className="form-grid" onSubmit={submit}>
            <label>
              First name
              <input required value={form.firstName} onChange={set("firstName")} placeholder="e.g. Mithun" />
            </label>
            <label>
              Last name
              <input required value={form.lastName} onChange={set("lastName")} placeholder="e.g. Ray" />
            </label>
            <label>
              Email
              <input required type="email" value={form.email} onChange={set("email")} placeholder="name@scholarly.edu" />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={set("phone")} placeholder="09 xxx xxx xxx" />
            </label>
            <label>
              Course
              <select value={form.course} onChange={set("course")}>
                {["Art & Design", "English Literature", "Mathematics", "Physics", "Biology", "Computer Science"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Grade level
              <input type="number" min={1} max={12} value={form.gradeLevel} onChange={set("gradeLevel")} />
            </label>
            <label>
              GPA
              <input type="number" step="0.01" min={0} max={4} value={form.gpa} onChange={setNumber("gpa")} />
            </label>
            <label>
              Attendance %
              <input type="number" step="1" min={0} max={100} value={form.attendanceRate} onChange={setNumber("attendanceRate")} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={set("status")}>
                <option>ACTIVE</option>
                <option>INACTIVE</option>
                <option>GRADUATED</option>
              </select>
            </label>
            <label>
              Enrolled date
              <input type="date" value={form.enrolledDate} onChange={set("enrolledDate")} />
            </label>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="form-actions">
              <button type="button" className="btn-light" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-dark" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Student"}
              </button>
            </div>
          </form>
        </SectionSlot>

      <SectionSlot
        visible={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete student?"
      >
        <p>
          Are you sure you want to delete <b>{confirmDelete ? fullName(confirmDelete) : ""}</b>? This cannot be undone.
        </p>
        <div className="form-actions">
          <button className="btn-light" onClick={() => setConfirmDelete(null)}>
            Cancel
          </button>
          <button className="btn-danger" onClick={doDelete}>
            <Icon name="trash" size={16} /> Delete
          </button>
        </div>
      </SectionSlot>
    </div>
  );
}

/** Very small modal wrapper (special-cased to `true &&` above for the edit dialog). */
function SectionSlot({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!visible) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="section-slot-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 id="section-slot-title">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
