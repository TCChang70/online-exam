package com.example.onlineexam.dto;

import java.util.List;
import java.util.Map;

/** 學生成績報表：跨測驗的彙總統計與逐測驗明細 */
public record StudentReportResponse(
    Long studentId,
    String studentName,
    String studentClass,
    int examCount,
    int totalAttempts,
    double averagePercentage,
    double bestPercentage,
    double lowestPercentage,
    Map<String, Integer> gradeDistribution,
    List<StudentReportItem> items
) {}
