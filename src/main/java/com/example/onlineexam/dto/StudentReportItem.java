package com.example.onlineexam.dto;

import java.time.LocalDateTime;

/** 學生成績報表中「單一測驗」的一列（取該測驗最佳一次作答） */
public record StudentReportItem(
    Long examId,
    String examTitle,
    Integer score,
    Integer totalPoints,
    Double percentage,
    String grade,
    int attemptCount,
    LocalDateTime lastSubmittedAt,
    boolean scoreHidden
) {}
