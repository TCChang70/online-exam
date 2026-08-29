package com.example.onlineexam.dto;

import jakarta.validation.constraints.*;

public record UpdateUserRequest(
    @NotBlank @Size(min = 2, max = 100) String displayName,
    @Size(max = 50) String className,
    @Size(min = 6) String newPassword
) {}
