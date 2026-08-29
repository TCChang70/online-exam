package com.example.onlineexam.controller;

import com.example.onlineexam.dto.ResultResponse;
import com.example.onlineexam.service.ResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;

    /** 查詢自己的所有考試成績 */
    @GetMapping("/my")
    public ResponseEntity<List<ResultResponse>> getMyResults(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(resultService.getMyResults(user.getUsername()));
    }

    /** 查詢某場測驗的所有學生成績（教師限定） */
    @GetMapping("/exam/{examId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<ResultResponse>> getExamResults(
            @PathVariable Long examId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(resultService.getExamResults(examId, user.getUsername()));
    }
}
