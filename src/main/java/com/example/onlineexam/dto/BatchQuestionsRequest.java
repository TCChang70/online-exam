package com.example.onlineexam.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/** 批次匯入測驗題目 */
public record BatchQuestionsRequest(
    @NotEmpty(message = "請至少匯入一題") @Valid List<QuestionRequest> questions
) {}
