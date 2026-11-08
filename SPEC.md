# Scholarly — Student Management System Specification (`SPEC.md`)

**Scholarly** is a full-stack Student Management System built with a **Spring Boot 4.1.2 (Java 24)** REST backend and a **React 19 + TypeScript + Vite 8** frontend.

---

## 1. Architecture & Code Structure

```text
Student Management System/
├── pom.xml                                  # Maven build configuration (Spring Boot 4.1.2, Java 24)
├── data/                                    # Local JSON persistence store (git-ignored)
│   ├── students.json                        # Persisted student roster
│   ├── announcements.json                   # Persisted school-wide announcements
│   └── attendance.json                      # Persisted attendance status overrides
├── src/
│   ├── main/
│   │   ├── java/com/example/demo/
│   │   │   ├── DemoApplication.java         # Spring Boot entry point
│   │   │   ├── CorsConfig.java              # CORS configuration for http://localhost:5173
│   │   │   ├── HelloController.java         # Health/smoke-test endpoint (/api/hello)
│   │   │   ├── model/
│   │   │   │   └── Student.java             # Student record model (id, name, email, course, GPA, etc.)
│   │   │   ├── repository/
│   │   │   │   └── StudentRepository.java   # Thread-safe student store backed by data/students.json
│   │   │   └── controller/
│   │   │       ├── StudentController.java      # CRUD + search endpoints (/api/students)
│   │   │       ├── DashboardController.java    # Aggregated KPI & chart endpoint (/api/dashboard)
│   │   │       ├── DashboardData.java          # DTO records for dashboard widgets
│   │   │       ├── AttendanceController.java   # Attendance list, summary & marking (/api/attendance)
│   │   │       ├── AttendanceRecord.java       # Attendance record DTO
│   │   │       ├── AnnouncementController.java # Announcements CRUD (/api/announcements)
│   │   │       ├── Announcement.java           # Announcement record DTO
│   │   │       └── ApiExceptionHandler.java    # Global @RestControllerAdvice returning clean 400 JSON errors
│   │   └── resources/
│   │       └── application.properties       # Server port (8080) & application name
│   └── test/
│       └── java/com/example/demo/
│           └── DemoApplicationTests.java    # Spring context smoke test
└── frontend/
    ├── package.json                         # React 19, Vite 8, TypeScript 7, Oxlint
    ├── vite.config.ts                       # Dev server & /api proxy -> http://localhost:8080
    ├── index.html                           # App shell & Plus Jakarta Sans font
    └── src/
        ├── main.tsx                         # React root mount
        ├── App.tsx                          # Hash router, layout shell, account switcher & sign-in state
        ├── api.ts                           # Typed fetch client for all /api/* endpoints
        ├── types.ts                         # Shared TypeScript interfaces mirroring backend records
        ├── dates.ts                         # Local-timezone ISO date & short-date formatting helpers
        ├── index.css                        # Design tokens, responsive grid, cards, tables & modals
        ├── components/
        │   ├── Sidebar.tsx                  # Navigation drawer, Quick Add card & Sign Out action
        │   ├── Topbar.tsx                   # Page header, search bar, notification bell & account switcher
        │   ├── StatCard.tsx                 # Top-row KPI summary cards
        │   ├── GpaChart.tsx                 # SVG grouped bar chart (Past vs Recent GPA + live GPA line)
        │   ├── CompletionDonut.tsx          # Interactive SVG donut chart for assignment completion
        │   ├── CurrentAssignments.tsx       # Week strip selector & upcoming assignments panel
        │   ├── DashboardPanels.tsx          # Activities Schedule & Upcoming Events panels
        │   ├── Avatar.tsx                   # DiceBear SVG avatar with deterministic initials fallback
        │   └── Icon.tsx                     # Inline SVG icon set & activity badge icons
        └── pages/
            ├── DashboardPage.tsx            # Overview KPIs, GPA chart, completion donut, schedule & events
            ├── StudentsPage.tsx             # Student search, KPI summary, table & Add/Edit/Delete modals
            ├── AttendancePage.tsx           # 3-day attendance table, weekly summary chips & click-to-toggle status
            ├── ReportPage.tsx               # Printable class performance report with PDF export
            ├── AnnouncementsPage.tsx        # School announcements grid & New Announcement modal
            └── MiscPages.tsx                # Help Center & Settings pages
```

---

## 2. REST API Contract

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/hello` | Health check returning `"Hello from Spring Boot!"` |
| `GET` | `/api/dashboard` | Aggregated KPI cards, GPA trend (`gpaDays`), assignment summary, current assignments, activities & events |
| `GET` | `/api/students?q={query}` | List all students (sorted by full name) or filter by name, email, course, or grade level |
| `GET` | `/api/students/{id}` | Fetch a single student by ID (`404` if not found) |
| `POST` | `/api/students` | Validate and create a student (`201 Created` with `Location` header) |
| `PUT` | `/api/students/{id}` | Validate and update an existing student (`200 OK` or `404 Not Found`) |
| `DELETE` | `/api/students/{id}` | Delete a student (`200 OK` with `{"deleted": true, "id": ...}` or `404`) |
| `GET` | `/api/attendance?days={n}&date={iso}` | List attendance records for the last `n` weekdays (or a specific ISO date) |
| `PUT` | `/api/attendance` | Mark/update a student's attendance (`PRESENT`, `LATE`, `ABSENT`) for a given date |
| `GET` | `/api/attendance/summary` | 5-day attendance counts (`present`, `late`, `absent`, `total`) and weighted `rate` % |
| `GET` | `/api/announcements` | List all announcements ordered newest-first |
| `GET` | `/api/announcements/{id}` | Fetch a single announcement by ID |
| `POST` | `/api/announcements` | Validate and post a new announcement (`201 Created`) |
| `DELETE` | `/api/announcements/{id}` | Remove an announcement by ID |

---

## 3. Present Work Plan (Completed & Active Capabilities)

### 3.1 Backend (Spring Boot 4)
- [x] **Java 24 Alignment:** Configured `pom.xml` `<java.version>24</java.version>` so `./mvnw spring-boot:run` and `./mvnw test` work out of the box with the installed JDK 24 runtime.
- [x] **Student Management CRUD & Search:** Full create, read, update, delete, and multi-field search (`fullName`, `email`, `course`, `gradeLevel`) in `StudentController` and `StudentRepository`.
- [x] **Request Validation & Error Handling:** Server-side validation on student and announcement payloads (required fields, email format, grade range `1–12`, GPA range `0.0–4.0`, attendance `0–100%`, enum status, ISO dates) with `ApiExceptionHandler` returning structured `400 Bad Request` JSON responses.
- [x] **Interactive Attendance Marking:** `PUT /api/attendance` records per-student, per-day status overrides and updates the weekly summary calculation in real time.
- [x] **Live Dashboard Aggregation:** `GET /api/dashboard` computes active student progress, average attendance rate, average GPA, and current-week GPA trend dates directly from the student roster.
- [x] **Disk Persistence (`data/*.json`):** Students, announcements, and attendance overrides are automatically saved to `data/students.json`, `data/announcements.json`, and `data/attendance.json` so changes survive server restarts without requiring an external database server.

### 3.2 Frontend (React 19 + TypeScript + Vite)
- [x] **Dashboard & Reporting Views:** Responsive KPI cards, interactive SVG Average GPA bar chart, Assignment Completion donut chart, Current Assignments week strip, Activities Schedule, Upcoming Events, and printable Report page (`window.print()`).
- [x] **Students Management UI:** Debounced search, live enrollment/GPA stats, status badges, attendance progress bars, and validated Add / Edit / Delete modal workflows with inline error display.
- [x] **Attendance Tracking UI:** 3-day school attendance table with click-to-cycle status (`PRESENT → LATE → ABSENT`) and live weekly summary chips.
- [x] **Announcements Feed:** Post and delete school-wide announcements with live unread badge synchronization in both the sidebar and topbar notification bell.
- [x] **Account Switching & Persistent Session:** Topbar profile dropdown and Sign In screen allow switching between any student account; active account (`scholarly.userName`, `scholarly.userRole`) and sign-out state (`scholarly.signedOut`) are persisted in `localStorage` across browser refreshes.
- [x] **Code Quality & Static Analysis:** Passes `tsc -b` typechecking, `vite build` production bundling, and `oxlint` (React Compiler purity + hooks rules) with **0 warnings and 0 errors**.

---

## 4. Future Work Plan (Roadmap)

### Phase 1 — Relational Database & Migrations (PostgreSQL + Spring Data JPA)
- [ ] **PostgreSQL Integration:** Add `spring-boot-starter-data-jpa` and `org.postgresql:postgresql` driver, with connection settings in `application.properties` (and environment variable overrides `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`).
- [ ] **JPA Entities & Repositories:** Convert `Student`, `Announcement`, and `AttendanceRecord` into `@Entity` classes backed by `JpaRepository` interfaces.
- [ ] **Schema Migrations:** Introduce Flyway (`db/migration/V1__init.sql`) to version-control schema creation and initial seed data.

### Phase 2 — Real Authentication & Role-Based Access Control (RBAC)
- [ ] **Spring Security + JWT / Session Auth:** Replace the demo account switcher with real login (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`) and password hashing (`BCryptPasswordEncoder`).
- [ ] **Roles & Permissions:** Support `ADMIN`, `TEACHER`, and `STUDENT` roles:
  - **Admin / Teacher:** Create/edit/delete students, post/delete announcements, mark attendance, manage assignments.
  - **Student:** Read-only access to own profile, GPA history, attendance record, and assignment submissions.

### Phase 3 — Assignments, Courses & Grading Module
- [ ] **Assignments CRUD API (`/api/assignments`):** Replace the static assignment list in `DashboardController` with a full CRUD resource (title, course, due date/time, status, student submissions) so the completion donut and KPI card reflect live assignment data.
- [ ] **Courses & Enrollment:** Model courses, teachers, class schedules, and student-course enrollments (`ManyToMany`) so GPA is calculated from actual graded coursework.
- [ ] **Activities & Events CRUD:** Add backend endpoints and UI modals to create, edit, and filter school activities and upcoming events.

### Phase 4 — UX Polish, Filtering & Export Enhancements
- [ ] **Attendance Date Picker & Filters:** Add a date range picker, course filter, and bulk "Mark All Present" action on the Attendance page.
- [ ] **Pagination & Sorting:** Add server-side pagination (`Pageable`), column sorting, and course/status filter dropdowns on the Students table, plus CSV/Excel import & export.
- [ ] **Interactive Settings:** Persist theme selection (Light / Dark mode) and default start page (`Dashboard` / `Students` / `Attendance`) in `localStorage` and apply them across the app.

### Phase 5 — Testing, CI/CD & Deployment
- [ ] **Backend Integration Tests:** Add `@WebMvcTest` and `@SpringBootTest` suites covering `StudentController`, `AttendanceController`, `AnnouncementController`, and validation error cases (`400` / `404`).
- [ ] **Frontend Component & E2E Tests:** Add Vitest + React Testing Library unit tests and Playwright end-to-end flows for student CRUD, attendance toggling, and sign-in/sign-out.
- [ ] **Containerization & CI:** Provide a multi-stage `Dockerfile` and `docker-compose.yml` (Spring Boot API + Nginx/Vite frontend + PostgreSQL) and a GitHub Actions workflow running `./mvnw test`, `tsc -b`, and `oxlint` on every push.

