package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final Map<Long, Announcement> announcements = new ConcurrentHashMap<>();
    private final AtomicLong nextId = new AtomicLong(1);

    public AnnouncementController() {
        seed("Registration Week",
                "Course registration for the new term is open until Friday. Meet your advisor to confirm your class list.",
                "Administration", LocalDate.now().toString(), "ALL STUDENTS");
        seed("Art & Design Exhibition",
                "Final-year Art & Design projects will be exhibited in Hall B. Families are welcome.",
                "Mr. Kyaw", LocalDate.now().minusDays(2).toString(), "ART & DESIGN");
        seed("GPA Support Workshops",
                "Free after-school workshops for anyone below a 2.8 GPA. Sign up at the counseling office.",
                "Counseling Dept.", LocalDate.now().minusDays(4).toString(), "GRADES 9-12");
    }

    private void seed(String title, String body, String author, String date, String audience) {
        long id = nextId.getAndIncrement();
        announcements.put(id, new Announcement(id, title, body, author, date, audience));
    }

    @GetMapping
    public List<Announcement> list() {
        return announcements.values().stream()
                .sorted(Comparator.comparing(Announcement::date).reversed()
                        .thenComparing(Announcement::id, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Announcement> get(@PathVariable long id) {
        Announcement item = announcements.get(id);
        return item != null ? ResponseEntity.ok(item) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Announcement> create(@RequestBody Announcement announcement) {
        if (announcement.title() == null || announcement.title().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        if (announcement.body() == null || announcement.body().isBlank()) {
            throw new IllegalArgumentException("body is required");
        }
        Long id = nextId.getAndIncrement();
        Announcement created = new Announcement(
                id,
                announcement.title().trim(),
                announcement.body().trim(),
                announcement.author() == null || announcement.author().isBlank()
                        ? "Administration" : announcement.author().trim(),
                LocalDate.now().toString(),
                announcement.audience() == null || announcement.audience().isBlank()
                        ? "ALL STUDENTS" : announcement.audience().trim()
        );
        announcements.put(id, created);
        URI location = Objects.requireNonNull(
                ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{id}")
                        .buildAndExpand(id)
                        .toUri()
        );
        return ResponseEntity.created(location).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable long id) {
        boolean removed = announcements.remove(id) != null;
        return removed
                ? ResponseEntity.ok(Map.of("deleted", true, "id", id))
                : ResponseEntity.notFound().build();
    }
}
