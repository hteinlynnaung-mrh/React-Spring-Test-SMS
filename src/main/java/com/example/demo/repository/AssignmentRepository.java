package com.example.demo.repository;

import com.example.demo.controller.DashboardData.AssignmentItem;
import com.example.demo.controller.DashboardData.AssignmentSummary;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Repository
public class AssignmentRepository {

    private final Map<Long, AssignmentItem> assignments = new ConcurrentHashMap<>();
    private final AtomicLong nextId = new AtomicLong(1);

    public AssignmentRepository() {
        seed();
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
                .collect(Collectors.toList());
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
        return saved;
    }

    public Optional<AssignmentItem> updateStatus(long id, String status) {
        return Optional.ofNullable(assignments.computeIfPresent(id, (k, existing) ->
                new AssignmentItem(id, existing.title(), existing.subject(), existing.dueISO(), existing.dueTime(), status)
        ));
    }

    public boolean delete(long id) {
        return assignments.remove(id) != null;
    }
}

