package com.example.onlineexam.dto;

/** 班級成績報表的「測驗欄位」：作答人數與該欄平均 */
public record ClassReportExam(
    Long examId,
    String examTitle,
    int participantCount,
    Double averagePercentage
) {}
