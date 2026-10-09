package com.example.onlineexam.dto;

import java.time.LocalDateTime;

/** 班級成績報表矩陣中的一格（某生在某測驗的最佳成績） */
public record ClassReportCell(
    Long examId,
    Integer score,
    Integer totalPoints,
    Double percentage,
    String grade,
    int attemptCount,
    LocalDateTime lastSubmittedAt
) {}
