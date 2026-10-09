package com.example.onlineexam.dto;

import java.util.List;

/** 班級成績報表：教師本人測驗為欄、班上學生為列的成績矩陣 */
public record ClassReportResponse(
    String className,
    List<ClassReportExam> exams,
    List<ClassReportRow> students
) {}
