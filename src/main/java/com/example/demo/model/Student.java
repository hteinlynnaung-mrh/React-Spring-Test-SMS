package com.example.demo.model;

/**
 * A student enrolled at the school.
 *
 * @param id             unique identifier
 * @param firstName      given name
 * @param lastName       family name
 * @param email          contact email
 * @param phone          contact phone
 * @param course         the student's main course / major
 * @param gradeLevel     year or grade (1-12, or 1-4 for college)
 * @param gpa            grade point average (0.0 - 4.0)
 * @param attendanceRate attendance percentage (0 - 100)
 * @param status         ACTIVE | INACTIVE | GRADUATED
 * @param enrolledDate   ISO date the student enrolled, e.g. 2024-08-12
 */
public record Student(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String course,
        int gradeLevel,
        double gpa,
        double attendanceRate,
        String status,
        String enrolledDate) {

    public String fullName() {
        return firstName + " " + lastName;
    }
}
