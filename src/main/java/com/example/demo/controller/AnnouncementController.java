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
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private static final Path STORE_PATH = Path.of("data", "announcements.json");

    private final Map<Long, Announcement> announcements = new ConcurrentHashMap<>();
    private final AtomicLong nextId = new AtomicLong(1);
    private final ObjectMapper mapper = new ObjectMapper();

    public AnnouncementController() {
        if (!loadFromDisk()) {
            seed("Registration Week",
                    "Course registration for the new term is open until Friday. Meet your advisor to confirm your class list.",
                    "Administration", LocalDate.now().toString(), "ALL STUDENTS");
            seed("Art & Design Exhibition",
                    "Final-year Art & Design projects will be exhibited in Hall B. Families are welcome.",
                    "Mr. Kyaw", LocalDate.now().minusDays(2).toString(), "ART & DESIGN");
            seed("GPA Support Workshops",
                    "Free after-school workshops for anyone below a 2.8 GPA. Sign up at the counseling office.",
                    "Counseling Dept.", LocalDate.now().minusDays(4).toString(), "GRADES 9-12");
            saveToDisk();
        }
    }

    private boolean loadFromDisk() {
        if (!Files.exists(STORE_PATH)) return false;
        try {
            List<Announcement> loaded = mapper.readValue(STORE_PATH.toFile(), new TypeReference<>() {});
            if (loaded == null || loaded.isEmpty()) return false;
            long maxId = 0;
            for (Announcement a : loaded) {
                if (a.id() != null) {
                    announcements.put(a.id(), a);
                    if (a.id() > maxId) maxId = a.id();
                }
            }
            nextId.set(maxId + 1);
            return !announcements.isEmpty();
        } catch (Exception ignored) {
            return false;
        }
    }

    private synchronized void saveToDisk() {
        try {
            Files.createDirectories(STORE_PATH.getParent());
            mapper.writerWithDefaultPrettyPrinter().writeValue(STORE_PATH.toFile(), list());
        } catch (IOException ignored) {
        }
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
                .toList();
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
        long id = nextId.getAndIncrement();
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
        saveToDisk();
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
        if (removed) saveToDisk();
        return removed
                ? ResponseEntity.ok(Map.of("deleted", true, "id", id))
                : ResponseEntity.notFound().build();
    }
}
