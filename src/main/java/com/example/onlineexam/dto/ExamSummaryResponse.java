package com.example.onlineexam.dto;

public record ExamSummaryResponse(
    Long id,
    String title,
    String description,
    Integer timeLimit,
    int questionCount,
    boolean active
) {}
