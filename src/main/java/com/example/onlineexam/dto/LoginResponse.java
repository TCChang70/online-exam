package com.example.onlineexam.dto;

public record LoginResponse(String token, String username, String role, String displayName, String className) {}
