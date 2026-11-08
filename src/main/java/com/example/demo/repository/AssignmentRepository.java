package com.example.demo.repository;

import com.example.demo.controller.DashboardData.AssignmentItem;
import com.example.demo.controller.DashboardData.AssignmentSummary;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class AssignmentRepository {

    private static final Path STORE_PATH = Path.of("data", "assignments.json");

    private final Map<Long, AssignmentItem> assignments = new ConcurrentHashMap<>();
    private final AtomicLong nextId = new AtomicLong(1);
    private final ObjectMapper mapper = new ObjectMapper();

    public AssignmentRepository() {
        if (!loadFromDisk()) {
            seed();
            saveToDisk();
        }
    }

    private boolean loadFromDisk() {
        if (!Files.exists(STORE_PATH)) return false;
        try {
            List<AssignmentItem> loaded = mapper.readValue(STORE_PATH.toFile(), new TypeReference<>() {});
            if (loaded == null || loaded.isEmpty()) return false;
            long maxId = 0;
            for (AssignmentItem a : loaded) {
                if (a.id() != null) {
                    assignments.put(a.id(), a);
                    if (a.id() > maxId) maxId = a.id();
                }
            }
            nextId.set(maxId + 1);
            return !assignments.isEmpty();
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

    private void seed() {
        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<AssignmentItem> initial = List.of(
                new AssignmentItem(null, "Branding Visual Identity", "Art & Design",
                        monday.plusDays(5).toString(), "08:24 am", "PENDING"),
                new AssignmentItem(null, "Literary Analysis", "English Literature",
                        monday.plusDays(5).toString(), "08:24 am", "PENDING"),
                new AssignmentItem(null, "Calculus Challenge", "Mathematics",
                        monday.plusDays(2).toString(), "09:25 am", "PENDING"),
                new AssignmentItem(null, "Kinematics Lab Report", "Physics",
                        monday.plusDays(1).toString(), "10:30 am", "COMPLETED"),
                new AssignmentItem(null, "Cell Division Essay", "Biology",
                        monday.minusDays(1).toString(), "11:00 am", "OVERDUE"),
                new AssignmentItem(null, "Binary Trees Implementation", "Computer Science",
                        monday.plusDays(3).toString(), "02:00 pm", "COMPLETED"),
                new AssignmentItem(null, "Modern Poetry Critique", "English Literature",
                        monday.plusDays(4).toString(), "01:15 pm", "COMPLETED"),
                new AssignmentItem(null, "Linear Algebra Problem Set", "Mathematics",
                        monday.plusDays(2).toString(), "03:45 pm", "COMPLETED")
        );
        for (AssignmentItem item : initial) {
            long id = nextId.getAndIncrement();
            assignments.put(id, new AssignmentItem(id, item.title(), item.subject(), item.dueISO(), item.dueTime(), item.status()));
        }
    }

    public List<AssignmentItem> findAll() {
        return assignments.values().stream()
                .sorted(Comparator.comparing(AssignmentItem::dueISO).thenComparing(AssignmentItem::id))
                .toList();
    }

    public AssignmentSummary summary() {
        var all = assignments.values();
        int completed = (int) all.stream().filter(a -> "COMPLETED".equalsIgnoreCase(a.status())).count();
        int pending = (int) all.stream().filter(a -> "PENDING".equalsIgnoreCase(a.status())).count();
        int overdue = (int) all.stream().filter(a -> "OVERDUE".equalsIgnoreCase(a.status())).count();
        return new AssignmentSummary(completed, pending, overdue, all.size());
    }

    public AssignmentItem create(AssignmentItem item) {
        long id = nextId.getAndIncrement();
        AssignmentItem saved = new AssignmentItem(id, item.title(), item.subject(), item.dueISO(), item.dueTime(), item.status());
        assignments.put(id, saved);
        saveToDisk();
        return saved;
    }

    public Optional<AssignmentItem> updateStatus(long id, String status) {
        Optional<AssignmentItem> updated = Optional.ofNullable(assignments.computeIfPresent(id, (k, existing) ->
                new AssignmentItem(id, existing.title(), existing.subject(), existing.dueISO(), existing.dueTime(), status)
        ));
        if (updated.isPresent()) saveToDisk();
        return updated;
    }

    public boolean delete(long id) {
        boolean removed = assignments.remove(id) != null;
        if (removed) saveToDisk();
        return removed;
    }
}

