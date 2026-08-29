package com.example.onlineexam.dto;

import java.util.List;

public record ExamDetailResponse(
    Long id,
    String title,
    String description,
    Integer timeLimit,
    boolean active,
    String createdBy,
    List<QuestionDetailResponse> questions
) {}
