package com.example.onlineexam.dto;

import java.time.LocalDateTime;
import java.util.List;

/** 教師檢視學生作答——整份測驗的作答明細 */
public record StudentExamResultDetailResponse(
    Long resultId,
    Long examId,
    String examTitle,
    String studentName,
    String studentClass,
    Integer score,
    Integer totalPoints,
    double percentage,
    String grade,
    LocalDateTime submittedAt,
    int correctCount,
    List<AnswerRecordResponse> answers
) {}
