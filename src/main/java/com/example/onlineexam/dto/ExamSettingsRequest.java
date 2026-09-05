package com.example.onlineexam.dto;

/** 更新測驗作答 / 成績相關設定（可重複作答、隱藏成績） */
public record ExamSettingsRequest(
    Boolean allowRetake,
    Boolean hideResult
) {}