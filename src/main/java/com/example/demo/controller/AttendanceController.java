package com.example.demo.controller;

import com.example.demo.repository.StudentRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private static final Path STORE_PATH = Path.of("data", "attendance.json");

    private static final Set<String> VALID_STATUSES = Set.of(
            AttendanceRecord.PRESENT,
            AttendanceRecord.ABSENT,
            AttendanceRecord.LATE
    );

    private final StudentRepository studentRepository;
    private final Map<String, String> overrides = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();

    public AttendanceController(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
        loadFromDisk();
    }

    private void loadFromDisk() {
        if (!Files.exists(STORE_PATH)) return;
        try {
            Map<String, String> loaded = mapper.readValue(STORE_PATH.toFile(), new TypeReference<>() {});
            if (loaded != null) overrides.putAll(loaded);
        } catch (Exception ignored) {
        }
    }

    private synchronized void saveToDisk() {
        try {
            Files.createDirectories(STORE_PATH.getParent());
            mapper.writerWithDefaultPrettyPrinter().writeValue(STORE_PATH.toFile(), overrides);
        } catch (IOException ignored) {
        }
    }

    private static String key(long studentId, LocalDate day) {
        return studentId + ":" + day;
    }

    /**
     * Attendance records. With no date parameter the most recent school day is used;
     * with {@code ?days=n} the last n weekdays are returned.
     */
    @GetMapping
    public List<AttendanceRecord> list(
            @RequestParam(required = false) String date,
            @RequestParam(required = false, defaultValue = "1") int days) {

        List<LocalDate> dates = new ArrayList<>();
        if (date != null && !date.isBlank()) {
            dates.add(LocalDate.parse(date));
        } else {
            LocalDate cursor = LocalDate.now();
            while (dates.size() < Math.max(1, Math.min(days, 10))) {
                if (!(cursor.getDayOfWeek() == java.time.DayOfWeek.SATURDAY
                        || cursor.getDayOfWeek() == java.time.DayOfWeek.SUNDAY)) {
                    dates.add(cursor);
                }
                cursor = cursor.minusDays(1);
            }
        }

        List<AttendanceRecord> records = new ArrayList<>();
        long id = 1;
        for (LocalDate day : dates) {
            for (var student : studentRepository.findAll()) {
                records.add(new AttendanceRecord(
                        id++,
                        student.id(),
                        student.fullName(),
                        student.course(),
                        day.toString(),
                        statusFor(student, day)
                ));
            }
        }
        return records;
    }

    /** Mark or update a single student's attendance status for a given date. */
    @PutMapping
    public AttendanceRecord mark(@RequestBody AttendanceMarkRequest request) {
        if (request.studentId() == null) {
            throw new IllegalArgumentException("studentId is required");
        }
        var student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + request.studentId()));
        LocalDate day = (request.date() == null || request.date().isBlank())
                ? LocalDate.now()
                : LocalDate.parse(request.date().trim());
        String status = request.status() == null ? "" : request.status().trim().toUpperCase();
        if (!VALID_STATUSES.contains(status)) {
            throw new IllegalArgumentException("status must be one of " + VALID_STATUSES);
        }
        overrides.put(key(student.id(), day), status);
        saveToDisk();
        return new AttendanceRecord(
                student.id(),
                student.id(),
                student.fullName(),
                student.course(),
                day.toString(),
                status
        );
    }

    public record AttendanceMarkRequest(Long studentId, String date, String status) {
    }

    /** Weekly attendance summary for the report page. */
    @GetMapping("/summary")
    public Map<String, Object> summary() {
        List<AttendanceRecord> records = list(null, 5);
        long present = records.stream().filter(r -> AttendanceRecord.PRESENT.equals(r.status())).count();
        long absent = records.stream().filter(r -> AttendanceRecord.ABSENT.equals(r.status())).count();
        long late = records.stream().filter(r -> AttendanceRecord.LATE.equals(r.status())).count();
        long total = records.size();
        double rate = total == 0 ? 0 : Math.round((present + late * 0.5) * 100.0 / total);
        return Map.of(
                "present", present,
                "absent", absent,
                "late", late,
                "total", total,
                "rate", rate
        );
    }

    /** Returns any recorded override, falling back to deterministic demo data. */
    private String statusFor(com.example.demo.model.Student student, LocalDate day) {
        String override = overrides.get(key(student.id(), day));
        if (override != null) {
            return override;
        }
        int seed = (int) ((student.id() * 31 + day.toEpochDay()) % 11);
        if (student.attendanceRate() < 75 && seed % 3 == 0) {
            return AttendanceRecord.ABSENT;
        }
        if (seed % 7 == 0) {
            return AttendanceRecord.LATE;
        }
        return AttendanceRecord.PRESENT;
    }
}
