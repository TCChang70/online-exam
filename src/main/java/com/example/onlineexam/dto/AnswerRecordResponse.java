package com.example.onlineexam.dto;

/** 教師檢視學生作答——單一題目的作答紀錄 */
public record AnswerRecordResponse(
    Long questionId,
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
    Integer points,
    /** 學生提交的答案（未作答為空白） */
    String studentAnswer,
    /** 正確答案 */
    String correctAnswer,
    /** 此題是否答對 */
    boolean correct
) {}
