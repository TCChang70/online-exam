package com.example.onlineexam.controller;

import com.example.onlineexam.dto.ResultResponse;
import com.example.onlineexam.dto.StudentExamResultDetailResponse;
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

    /** 查詢某位學生在該測驗的作答明細（教師限定） */
    @GetMapping("/exam/{examId}/{resultId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<StudentExamResultDetailResponse> getExamResultDetail(
            @PathVariable Long examId,
            @PathVariable Long resultId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(resultService.getExamResultDetail(examId, resultId, user.getUsername()));
    }

    /** 查詢已刪除（軟刪除）的作答紀錄，供教師復原（教師限定） */
    @GetMapping("/exam/{examId}/deleted")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<ResultResponse>> getDeletedExamResults(
            @PathVariable Long examId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(resultService.getDeletedExamResults(examId, user.getUsername()));
    }

    /** 教師軟刪除某筆學生的作答紀錄 */
    @DeleteMapping("/{resultId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> softDeleteResult(
            @PathVariable Long resultId,
            @AuthenticationPrincipal UserDetails user) {
        resultService.softDeleteResult(resultId, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    /** 教師復原已刪除的作答紀錄 */
    @PostMapping("/{resultId}/restore")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> restoreResult(
            @PathVariable Long resultId,
            @AuthenticationPrincipal UserDetails user) {
        resultService.restoreResult(resultId, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
