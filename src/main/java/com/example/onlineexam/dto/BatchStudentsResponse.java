package com.example.onlineexam.dto;

import java.util.List;

/** 批次匯入學生的結果摘要 */
public record BatchStudentsResponse(
    int imported,
    List<StudentResponse> students,
    List<String> duplicates
) {}