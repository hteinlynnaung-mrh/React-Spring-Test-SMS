import type {
  Announcement,
  AssignmentItem,
  AttendanceRecord,
  AttendanceSummary,
  DashboardData,
  Student,
} from "./types";

/** Defaults to the Vite dev proxy (see vite.config.ts); override with VITE_API_URL. */
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const body = JSON.parse(text) as { message?: string };
      if (body.message) throw new Error(body.message);
    } catch (e) {
      if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
    }
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ---------------------------------- students --------------------------------- */

export const getStudents = (q?: string) =>
  request<Student[]>(`/students${q && q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);

export const createStudent = (student: Omit<Student, "id">) =>
  request<Student>("/students", { method: "POST", body: JSON.stringify(student) });

export const updateStudent = (id: number, student: Omit<Student, "id">) =>
  request<Student>(`/students/${id}`, { method: "PUT", body: JSON.stringify(student) });

export const deleteStudent = (id: number) =>
  request<{ deleted: boolean; id: number }>(`/students/${id}`, { method: "DELETE" });

/* --------------------------------- dashboard --------------------------------- */

/** `month` filters the GPA chart to that calendar month (1–12); omit for the current month. */
export const getDashboard = (month?: number) =>
  request<DashboardData>(month && month >= 1 && month <= 12 ? `/dashboard?month=${month}` : "/dashboard");

/* --------------------------------- attendance -------------------------------- */

export const getAttendance = (days = 5) =>
  request<AttendanceRecord[]>(`/attendance?days=${days}`);

export const getAttendanceSummary = () =>
  request<AttendanceSummary>("/attendance/summary");

export const markAttendance = (payload: {
  studentId: number;
  date: string;
  status: AttendanceRecord["status"];
}) =>
  request<AttendanceRecord>("/attendance", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

/* -------------------------------- announcements ------------------------------ */

export const getAnnouncements = () => request<Announcement[]>("/announcements");

export const createAnnouncement = (announcement: { title: string; body: string; author: string; audience: string }) =>
  request<Announcement>("/announcements", { method: "POST", body: JSON.stringify(announcement) });

export const deleteAnnouncement = (id: number) =>
  request<{ deleted: boolean; id: number }>(`/announcements/${id}`, { method: "DELETE" });

/* --------------------------------- assignments ------------------------------- */

export const createAssignment = (item: Omit<AssignmentItem, "id">) =>
  request<AssignmentItem>("/assignments", { method: "POST", body: JSON.stringify(item) });

export const updateAssignmentStatus = (id: number, status: AssignmentItem["status"]) =>
  request<AssignmentItem>(`/assignments/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

export const deleteAssignment = (id: number) =>
  request<{ deleted: boolean; id: number }>(`/assignments/${id}`, { method: "DELETE" });
