package com.example.demo.repository;

import com.example.demo.model.Student;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Repository
public class StudentRepository {

    private static final Path STORE_PATH = Path.of("data", "students.json");

    private final Map<Long, Student> students = new ConcurrentHashMap<>();
    private final AtomicLong nextId = new AtomicLong(1);
    private final ObjectMapper mapper = new ObjectMapper();

    public StudentRepository() {
        if (!loadFromDisk()) {
            seed();
            saveToDisk();
        }
    }

    private boolean loadFromDisk() {
        if (!Files.exists(STORE_PATH)) return false;
        try {
            List<Student> loaded = mapper.readValue(STORE_PATH.toFile(), new TypeReference<>() {});
            if (loaded == null || loaded.isEmpty()) return false;
            long maxId = 0;
            for (Student s : loaded) {
                if (s.id() != null) {
                    students.put(s.id(), s);
                    if (s.id() > maxId) maxId = s.id();
                }
            }
            nextId.set(maxId + 1);
            return !students.isEmpty();
        } catch (Exception ignored) {
            return false;
        }
    }

    private synchronized void saveToDisk() {
        try {
            Files.createDirectories(STORE_PATH.getParent());
            mapper.writerWithDefaultPrettyPrinter().writeValue(STORE_PATH.toFile(), findAll());
        } catch (IOException ignored) {
        }
    }

    /** Pre-populate the store so the dashboard has realistic data on first boot. */
    private void seed() {
        List<Student> seedStudents = List.of(
                new Student(null, "Mithun", "Ray", "mithun.ray@scholarly.edu", "09401122331", "Art & Design", 11, 3.80, 92.0, "ACTIVE", "2024-06-02"),
                new Student(null, "May", "Thiri", "may.thiri@scholarly.edu", "09401122332", "English Literature", 10, 3.60, 88.0, "ACTIVE", "2024-06-02"),
                new Student(null, "Aung", "Kyaw", "aung.kyaw@scholarly.edu", "09401122333", "Mathematics", 12, 3.20, 74.0, "ACTIVE", "2024-06-03"),
                new Student(null, "Hnin", "Phyu", "hnin.phyu@scholarly.edu", "09401122334", "Physics", 11, 3.90, 95.0, "ACTIVE", "2024-06-05"),
                new Student(null, "Ko", "Zin", "ko.zin@scholarly.edu", "09401122335", "Art & Design", 10, 2.80, 65.0, "INACTIVE", "2024-07-14"),
                new Student(null, "Su", "Su", "su.su@scholarly.edu", "09401122336", "Biology", 12, 3.55, 90.0, "ACTIVE", "2024-07-14"),
                new Student(null, "Thet", "Naing", "thet.naing@scholarly.edu", "09401122337", "Mathematics", 9, 3.10, 81.0, "ACTIVE", "2024-08-01"),
                new Student(null, "Ei", "Mon", "ei.mon@scholarly.edu", "09401122338", "English Literature", 10, 3.70, 89.0, "ACTIVE", "2024-08-01"),
                new Student(null, "Phoe", "Thaw", "phoe.thaw@scholarly.edu", "09401122339", "Physics", 12, 2.95, 70.0, "ACTIVE", "2024-08-20"),
                new Student(null, "Wai", "Yan", "wai.yan@scholarly.edu", "09401122340", "Biology", 11, 3.40, 86.0, "ACTIVE", "2024-08-20"),
                new Student(null, "Yuki", "Tanaka", "yuki.tanaka@scholarly.edu", "09401122341", "Computer Science", 11, 3.85, 94.0, "ACTIVE", "2024-09-02"),
                new Student(null, "Lwin", "Moe", "lwin.moe@scholarly.edu", "09401122342", "Computer Science", 12, 3.05, 77.0, "ACTIVE", "2024-09-02")
        );

        seedStudents.forEach(s -> {
            long id = nextId.getAndIncrement();
            students.put(id, new Student(id, s.firstName(), s.lastName(), s.email(),
                    s.phone(), s.course(), s.gradeLevel(), s.gpa(),
                    s.attendanceRate(), s.status(), s.enrolledDate()));
        });
    }

    public List<Student> findAll() {
        return students.values().stream()
                .sorted((a, b) -> a.fullName().compareToIgnoreCase(b.fullName()))
                .collect(Collectors.toList());
    }

    public List<Student> search(String query) {
        String q = query.toLowerCase();
        return findAll().stream()
                .filter(s -> s.fullName().toLowerCase().contains(q)
                        || s.email().toLowerCase().contains(q)
                        || s.course().toLowerCase().contains(q)
                        || String.valueOf(s.gradeLevel()).contains(q))
                .collect(Collectors.toList());
    }

    public Optional<Student> findById(long id) {
        return Optional.ofNullable(students.get(id));
    }

    public Student create(Student student) {
        long id = nextId.getAndIncrement();
        Student saved = new Student(id, student.firstName(), student.lastName(), student.email(),
                student.phone(), student.course(), student.gradeLevel(), student.gpa(),
                student.attendanceRate(), student.status(), student.enrolledDate());
        students.put(id, saved);
        saveToDisk();
        return saved;
    }

    public Optional<Student> update(long id, Student updated) {
        Optional<Student> res = Optional.ofNullable(students.computeIfPresent(id, (key, existing) ->
                new Student(id, updated.firstName(), updated.lastName(), updated.email(),
                        updated.phone(), updated.course(), updated.gradeLevel(), updated.gpa(),
                        updated.attendanceRate(), updated.status(), updated.enrolledDate())
        ));
        if (res.isPresent()) saveToDisk();
        return res;
    }

    public boolean delete(long id) {
        boolean removed = students.remove(id) != null;
        if (removed) saveToDisk();
        return removed;
    }
}
