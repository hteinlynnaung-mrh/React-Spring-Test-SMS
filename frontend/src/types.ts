/** Shared types mirroring the Spring Boot REST payloads. */

export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED";

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  /** Computed server-side concat of first+last (optional). */
  fullName?: string;
  email: string;
  phone: string;
  course: string;
  gradeLevel: number;
  gpa: number;
  attendanceRate: number;
  status: StudentStatus;
  enrolledDate: string;
}

export interface StatCard {
  title: string;
  value: number;
  delta: number;
  subtitle: string;
}

export interface GpaDay {
  label: string;
  past: number;
  recent: number;
}

export interface AssignmentSummary {
  completed: number;
  pending: number;
  overdue: number;
  total: number;
}

export interface AssignmentItem {
  id: number;
  title: string;
  subject: string;
  dueISO: string;
  dueTime: string;
  status: "PENDING" | "COMPLETED" | "OVERDUE";
}

export interface ActivityItem {
  id: number;
  title: string;
  icon: "languages" | "sports" | "lunch";
  status: "IN_PROGRESS" | "DONE" | "ON_HOLD";
  timeRange: string;
  description: string;
}

export interface SchoolEvent {
  id: number;
  title: string;
  dateLabel: string;
  description: string;
  attendees: number;
  rating: number;
}

export interface DashboardData {
  courseProgress: StatCard;
  attendanceRate: StatCard;
  assignments: StatCard;
  gpaReport: { value: number }[];
  currentGpa: number;
  gpaDays: GpaDay[];
  assignmentSummary: AssignmentSummary;
  currentAssignments: AssignmentItem[];
  activities: ActivityItem[];
  events: SchoolEvent[];
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  course: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  author: string;
  date: string;
  audience: string;
}
