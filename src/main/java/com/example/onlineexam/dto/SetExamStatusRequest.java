package com.example.onlineexam.dto;

import jakarta.validation.constraints.NotNull;

/** 開放 / 關閉測驗的請求 */
public record SetExamStatusRequest(
    @NotNull Boolean active
) {}
