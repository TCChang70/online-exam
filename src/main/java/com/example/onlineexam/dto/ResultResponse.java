package com.example.onlineexam.dto;

import java.time.LocalDateTime;

public record ResultResponse(
    Long id,
    Long examId,
    String examTitle,
    String studentName,
    String studentClass,
    Integer score,
    Integer totalPoints,
    Double percentage,
    String grade,
    LocalDateTime submittedAt,
    Integer attemptNumber,
    boolean scoreHidden
) {}
