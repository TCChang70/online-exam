package com.example.onlineexam.dto;

import java.util.List;

/** 學生作答用的視圖——不包含正確答案 */
public record ExamTakeResponse(
    Long id,
    String title,
    String description,
    Integer timeLimit,
    List<QuestionStudentResponse> questions
) {}
