package com.example.demo.controller;

import com.example.demo.repository.AssignmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private static final Set<String> STATUSES = Set.of("PENDING", "COMPLETED", "OVERDUE");

    private final AssignmentRepository repository;

    public AssignmentController(AssignmentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<DashboardData.AssignmentItem> list() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<DashboardData.AssignmentItem> create(@RequestBody DashboardData.AssignmentItem item) {
        if (item.title() == null || item.title().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        String subject = (item.subject() == null || item.subject().isBlank()) ? "General" : item.subject().trim();
        String dueISO = (item.dueISO() == null || item.dueISO().isBlank())
                ? LocalDate.now().plusDays(3).toString()
                : LocalDate.parse(item.dueISO().trim()).toString();
        String dueTime = (item.dueTime() == null || item.dueTime().isBlank()) ? "09:00 am" : item.dueTime().trim();
        String status = (item.status() == null || item.status().isBlank())
                ? "PENDING"
                : item.status().trim().toUpperCase();
        if (!STATUSES.contains(status)) {
            throw new IllegalArgumentException("status must be one of " + STATUSES);
        }

        DashboardData.AssignmentItem created = repository.create(
                new DashboardData.AssignmentItem(null, item.title().trim(), subject, dueISO, dueTime, status)
        );
        URI location = Objects.requireNonNull(
                ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{id}")
                        .buildAndExpand(created.id())
                        .toUri()
        );
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<DashboardData.AssignmentItem> updateStatus(
            @PathVariable long id,
            @RequestBody Map<String, String> body) {
        String raw = body.get("status");
        String status = raw == null ? "" : raw.trim().toUpperCase();
        if (!STATUSES.contains(status)) {
            throw new IllegalArgumentException("status must be one of " + STATUSES);
        }
        return repository.updateStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable long id) {
        return repository.delete(id)
                ? ResponseEntity.ok(Map.of("deleted", true, "id", id))
                : ResponseEntity.notFound().build();
    }
}

