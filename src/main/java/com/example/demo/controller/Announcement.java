package com.example.demo.controller;

/**
 * A school-wide announcement shown in the sidebar and the announcements page.
 */
public record Announcement(Long id, String title, String body, String author, String date, String audience) {
}
