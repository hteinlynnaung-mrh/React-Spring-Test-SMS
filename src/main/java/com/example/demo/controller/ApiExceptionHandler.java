package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.format.DateTimeParseException;
import java.util.Map;

/**
 * Turns client mistakes into clean 400 responses instead of 500s with stack traces.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> badRequest(IllegalArgumentException ex) {
        return error(ex.getMessage());
    }

    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<Map<String, Object>> badDate(DateTimeParseException ex) {
        return error("Invalid date '" + ex.getParsedString() + "', expected yyyy-MM-dd");
    }

    /**
     * Malformed or type-incompatible request bodies (e.g. {@code {}}, broken JSON, or a
     * missing primitive field) would otherwise fall through to Spring's default handler,
     * which echoes a full stack trace in the response body.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> unreadable(HttpMessageNotReadableException ex) {
        return error("Request body is missing, malformed, or has invalid field types");
    }

    private static ResponseEntity<Map<String, Object>> error(String message) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("status", 400, "error", "Bad Request", "message", message));
    }
}

