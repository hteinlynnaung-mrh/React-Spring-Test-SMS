package com.example.demo.controller;

import com.example.demo.model.Student;
import com.example.demo.repository.StudentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository repository;

    public StudentController(StudentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Student> list(@RequestParam(required = false) String q) {
        return (q == null || q.isBlank()) ? repository.findAll() : repository.search(q.trim());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> get(@PathVariable long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Student> create(@RequestBody Student student) {
        Student created = repository.create(validate(student));
        URI location = Objects.requireNonNull(
                ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{id}")
                        .buildAndExpand(created.id())
                        .toUri()
        );
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> update(@PathVariable long id, @RequestBody Student student) {
        return repository.update(id, validate(student))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private static final Set<String> STATUSES = Set.of("ACTIVE", "INACTIVE", "GRADUATED");

    /**
     * Rejects incomplete or out-of-range input with a 400 (see {@link ApiExceptionHandler})
     * and normalises optional fields, so a bad request can never corrupt the store.
     */
    static Student validate(Student s) {
        String firstName = required(s.firstName(), "firstName");
        String lastName = required(s.lastName(), "lastName");
        String email = required(s.email(), "email");
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new IllegalArgumentException("email is not a valid address");
        }
        String course = required(s.course(), "course");
        if (s.gradeLevel() < 1 || s.gradeLevel() > 12) {
            throw new IllegalArgumentException("gradeLevel must be between 1 and 12");
        }
        if (s.gpa() < 0 || s.gpa() > 4) {
            throw new IllegalArgumentException("gpa must be between 0 and 4");
        }
        if (s.attendanceRate() < 0 || s.attendanceRate() > 100) {
            throw new IllegalArgumentException("attendanceRate must be between 0 and 100");
        }
        String status = s.status() == null || s.status().isBlank() ? "ACTIVE" : s.status().trim().toUpperCase();
        if (!STATUSES.contains(status)) {
            throw new IllegalArgumentException("status must be one of " + STATUSES);
        }
        String enrolled = s.enrolledDate() == null || s.enrolledDate().isBlank()
                ? LocalDate.now().toString()
                : LocalDate.parse(s.enrolledDate().trim()).toString();
        String phone = s.phone() == null ? "" : s.phone().trim();
        return new Student(s.id(), firstName, lastName, email, phone, course,
                s.gradeLevel(), s.gpa(), s.attendanceRate(), status, enrolled);
    }

    private static String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable long id) {
        boolean removed = repository.delete(id);
        return removed
                ? ResponseEntity.ok(Map.of("deleted", true, "id", id))
                : ResponseEntity.notFound().build();
    }
}
