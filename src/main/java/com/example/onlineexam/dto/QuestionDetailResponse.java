package com.example.onlineexam.dto;

/** 教師視圖——包含正確答案 */
public record QuestionDetailResponse(
    Long id,
    String questionText,
    String optionA,
    String optionB,
    String optionC,
    String optionD,
    String optionE,
    String optionF,
    String optionG,
    String optionH,
    String optionI,
    boolean multiSelect,
    String correctAnswer,
    Integer points
) {}
