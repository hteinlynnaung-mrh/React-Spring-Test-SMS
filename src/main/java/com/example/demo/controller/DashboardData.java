package com.example.demo.controller;

import java.util.List;

/**
 * Aggregated payload for the Scholarly dashboard view.
 */
public record DashboardData(
        StatCard courseProgress,
        StatCard attendanceRate,
        StatCard assignments,
        List<GpaBar> gpaReport,
        double currentGpa,
        List<GpaDay> gpaDays,
        AssignmentSummary assignmentSummary,
        List<AssignmentItem> currentAssignments,
        List<ActivityItem> activities,
        List<SchoolEvent> events
) {

    /** Small KPI card shown across the top of the dashboard. */
    public record StatCard(String title, double value, double delta, String subtitle) {
    }

    /** One day of the Average GPA bar chart. */
    public record GpaDay(String label, double past, double recent) {
    }

    /** Current overall GPA shown as the chart annotation. */
    public record GpaBar(double value) {
    }

    /** Completed / pending / overdue breakdown used by the donut chart. */
    public record AssignmentSummary(int completed, int pending, int overdue, int total) {
    }

    /** An item in the "Current Assignment" panel. {@code dueISO} is an ISO date, e.g. 2026-11-14. */
    public record AssignmentItem(Long id, String title, String subject, String dueISO, String dueTime, String status) {
    }

    /** An item in the "Activities Schedule" panel. */
    public record ActivityItem(Long id, String title, String icon, String status, String timeRange, String description) {
    }

    /** An item in the "Upcoming Events" panel. */
    public record SchoolEvent(Long id, String title, String dateLabel, String description, int attendees, double rating) {
    }
}
