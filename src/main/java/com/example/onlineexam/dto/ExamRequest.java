package com.example.onlineexam.dto;

import jakarta.validation.constraints.*;

public record ExamRequest(
    @NotBlank(message = "測驗標題不可為空") String title,
    String description,
    @Min(1) @Max(360) Integer timeLimit,
    Boolean allowRetake,
    Boolean hideResult
) {}
