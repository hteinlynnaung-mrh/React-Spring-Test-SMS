package com.example.demo.controller;

import com.example.demo.repository.AssignmentRepository;
import com.example.demo.repository.StudentRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final StudentRepository studentRepository;
    private final AssignmentRepository assignmentRepository;

    public DashboardController(StudentRepository studentRepository, AssignmentRepository assignmentRepository) {
        this.studentRepository = studentRepository;
        this.assignmentRepository = assignmentRepository;
    }

    /**
     * Aggregated dashboard payload.
     *
     * @param month optional GPA-chart month filter, {@code 1..12} (defaults to the
     *              current month) — powers the month picker on the GPA panel.
     */
    @GetMapping
    public DashboardData dashboard(@RequestParam(required = false) Integer month) {
        var students = studentRepository.findAll();
        int totalStudents = students.size();
        long activeCount = students.stream().filter(s -> "ACTIVE".equalsIgnoreCase(s.status())).count();

        double avgAttendance = students.stream().mapToDouble(s -> s.attendanceRate()).average().orElse(0.0);
        double avgGpa = students.stream().mapToDouble(s -> s.gpa()).average().orElse(0.0);

        double activePct = totalStudents == 0 ? 0 : Math.round(activeCount * 100.0 / totalStudents);
        DashboardData.StatCard courseProgress =
                new DashboardData.StatCard("Course Progress", activePct, 12,
                        activeCount + " out of " + totalStudents + " active");
        DashboardData.StatCard attendanceRate =
                new DashboardData.StatCard("Attendance Rate", Math.round(avgAttendance), -2,
                        "Based on " + totalStudents + " students");

        LocalDate today = LocalDate.now();
        int chartMonth = resolveMonth(month, today);
        // Current month → this week's five weekdays; any other month → that month's
        // first school week (Mon–Fri), so the chart always labels days inside the month.
        LocalDate monday = chartMonth == today.getMonthValue()
                ? today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                : LocalDate.of(today.getYear(), chartMonth, 1)
                        .with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
        DateTimeFormatter monthDay = DateTimeFormatter.ofPattern("LLL d", Locale.ENGLISH);

        // Average GPA chart — five weekdays scaled around the live average GPA.
        double[] pastOffsets = {-1.1, 0.3, -0.9, -0.2, 0.1};
        double[] recentOffsets = {-0.6, 0.7, 0.1, -0.9, 0.5};
        List<DashboardData.GpaDay> gpaDays = new ArrayList<>(5);
        for (int i = 0; i < 5; i++) {
            String label = monday.plusDays(i).format(monthDay);
            double past = Math.clamp(Math.round((avgGpa + pastOffsets[i]) * 10) / 10.0, 0.5, 4.0);
            double recent = Math.clamp(Math.round((avgGpa + recentOffsets[i]) * 10) / 10.0, 0.5, 4.0);
            gpaDays.add(new DashboardData.GpaDay(label, past, recent));
        }

        DashboardData.AssignmentSummary summary = assignmentRepository.summary();
        double completionPct = summary.total() == 0
                ? 0
                : Math.round(summary.completed() * 100.0 / summary.total());
        DashboardData.StatCard assignmentsCard =
                new DashboardData.StatCard("Assignments", completionPct, 18,
                        summary.completed() + " of " + summary.total() + " completed");

        List<DashboardData.AssignmentItem> assignments = assignmentRepository.findAll();

        List<DashboardData.ActivityItem> activities = List.of(
                new DashboardData.ActivityItem(1L, "English Spoken Practice", "languages", "IN_PROGRESS",
                        "11:00 am - 12:00 pm", "Conversation club — practise everyday phrases with classmates."),
                new DashboardData.ActivityItem(2L, "Physical Education", "sports", "DONE",
                        "09:00 am - 10:00 am", "Basketball drills and a friendly house match."),
                new DashboardData.ActivityItem(3L, "Lunch and Advisory", "lunch", "ON_HOLD",
                        "01:00 pm - 02:00 pm", "Grade-level lunch block followed by mentor check-in.")
        );

        List<DashboardData.SchoolEvent> events = List.of(
                new DashboardData.SchoolEvent(1L, "Annual Book Fair", "23 Sep, 2026",
                        "Haven for Book Lovers of All Ages", 2343, 4.5),
                new DashboardData.SchoolEvent(2L, "Sports Day 2026", "14 Oct, 2026",
                        "Inter-house athletics championship", 1820, 4.8)
        );

        return new DashboardData(
                courseProgress, attendanceRate, assignmentsCard,
                List.of(new DashboardData.GpaBar(Math.round(avgGpa * 10) / 10.0)),
                Math.round(avgGpa * 10) / 10.0,
                gpaDays,
                summary,
                assignments,
                activities,
                events
        );
    }

    /** Validates {@code ?month=1..12}; absent means the current month. */
    private static int resolveMonth(Integer month, LocalDate today) {
        if (month == null) {
            return today.getMonthValue();
        }
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("month must be between 1 and 12");
        }
        return month;
    }
}
