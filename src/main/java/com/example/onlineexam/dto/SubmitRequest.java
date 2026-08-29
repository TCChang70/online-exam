package com.example.onlineexam.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record SubmitRequest(
    /** key = 題目 ID（字串），value = 選項（A/B/C/D） */
    @NotNull Map<String, String> answers
) {}
