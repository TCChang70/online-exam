package com.example.onlineexam.dto;

import jakarta.validation.constraints.*;

public record QuestionRequest(
    @NotBlank(message = "題目不可為空") String questionText,
    @NotBlank String optionA,
    @NotBlank String optionB,
    @NotBlank String optionC,
    @NotBlank String optionD,
    @NotBlank @Pattern(regexp = "[ABCD]", message = "正確答案必須是 A、B、C 或 D") String correctAnswer,
    @Min(1) Integer points
) {}
