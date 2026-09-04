package com.example.onlineexam.dto;

/** 學生視圖——不含正確答案，防止外洩 */
public record QuestionStudentResponse(
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
    Integer points
) {}
