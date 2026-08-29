package com.example.onlineexam.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
    @NotBlank @Size(min = 3, max = 50, message = "帳號長度須為 3–50 字元") String username,
    @NotBlank @Size(min = 6, message = "密碼至少 6 個字元") String password,
    @NotBlank @Size(min = 2, max = 100) String displayName,
    @NotBlank @Size(max = 50, message = "班級名稱過長") String className
) {}
