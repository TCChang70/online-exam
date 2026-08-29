package com.example.onlineexam.dto;

/** 教師視圖——包含正確答案 */
public record QuestionDetailResponse(
    Long id,
    String questionText,
    String optionA,
    String optionB,
    String optionC,
    String optionD,
    String correctAnswer,
    Integer points
) {}
