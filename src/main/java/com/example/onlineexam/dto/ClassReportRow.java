package com.example.onlineexam.dto;

import java.util.List;

/** 班級成績報表的一位學生（跨測驗的最佳成績與個人平均） */
public record ClassReportRow(
    Long studentId,
    String studentName,
    String studentClass,
    Double averagePercentage,
    List<ClassReportCell> cells
) {}
