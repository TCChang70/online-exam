package com.example.onlineexam.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/** 批次匯入學生帳號的請求 */
public record BatchStudentsRequest(
    @NotEmpty(message = "請至少匯入一位學生") @Valid List<CreateUserRequest> students
) {}