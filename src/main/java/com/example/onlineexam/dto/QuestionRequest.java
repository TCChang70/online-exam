package com.example.onlineexam.dto;

import jakarta.validation.constraints.*;

public record QuestionRequest(
    @NotBlank(message = "題目不可為空") String questionText,
    @NotBlank String optionA,
    @NotBlank String optionB,
    @NotBlank String optionC,
    @NotBlank String optionD,
    String optionE,
    String optionF,
    String optionG,
    String optionH,
    String optionI,
    Boolean multiSelect,
    @NotBlank @Pattern(regexp = "[A-I](?:,[A-I])*", message = "正確答案必須是 A-I 的組合（多選以逗號分隔，如 A,C）") String correctAnswer,
    @Min(1) Integer points
) {}
