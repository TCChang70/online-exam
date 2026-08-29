package com.example.onlineexam.dto;

import jakarta.validation.constraints.*;

public record CreateUserRequest(
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Size(min = 6) String password,
    @NotBlank @Size(min = 2, max = 100) String displayName,
    @Size(max = 50) String className
) {}
