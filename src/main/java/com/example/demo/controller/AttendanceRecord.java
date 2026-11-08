package com.example.demo.controller;

/**
 * A single attendance record for one student on one day.
 */
public record AttendanceRecord(
        Long id,
        Long studentId,
        String studentName,
        String course,
        String date,
        String status) {

    public static final String PRESENT = "PRESENT";
    public static final String ABSENT = "ABSENT";
    public static final String LATE = "LATE";
}
