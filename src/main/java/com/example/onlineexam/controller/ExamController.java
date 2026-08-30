package com.example.onlineexam.controller;

import com.example.onlineexam.dto.*;
import com.example.onlineexam.service.ExamService;
import com.example.onlineexam.service.ResultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final ResultService resultService;

    // ── 學生 & 教師共用 ────────────────────────────────────────────────────────

    /** 列出所有開放中的測驗 */
    @GetMapping
    public ResponseEntity<List<ExamSummaryResponse>> getActiveExams() {
        return ResponseEntity.ok(examService.getActiveExams());
    }

    /** 取得測驗題目（學生作答用，不含正確答案） */
    @GetMapping("/{id}/take")
    public ResponseEntity<ExamTakeResponse> takeExam(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getExamForStudent(id));
    }

    /** 提交作答，系統自動計算分數 */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ResultResponse> submitExam(
            @PathVariable Long id,
            @Valid @RequestBody SubmitRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(resultService.submitExam(id, req, user.getUsername()));
    }

    // ── 教師專用 ──────────────────────────────────────────────────────────────

    @GetMapping("/all")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<ExamSummaryResponse>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    @GetMapping("/{id}/detail")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ExamDetailResponse> getExamDetail(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getExamDetail(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ExamSummaryResponse> createExam(
            @Valid @RequestBody ExamRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(examService.createExam(req, user.getUsername()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ExamSummaryResponse> updateExam(
            @PathVariable Long id,
            @Valid @RequestBody ExamRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(examService.updateExam(id, req, user.getUsername()));
    }

    /** 開放 / 關閉測驗（enable / disable） */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ExamSummaryResponse> setExamStatus(
            @PathVariable Long id,
            @Valid @RequestBody SetExamStatusRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(examService.setExamActive(id, req.active(), user.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteExam(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        examService.deleteExam(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ── 題目管理（教師） ──────────────────────────────────────────────────────

    @PostMapping("/{examId}/questions")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<QuestionDetailResponse> addQuestion(
            @PathVariable Long examId,
            @Valid @RequestBody QuestionRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(examService.addQuestion(examId, req, user.getUsername()));
    }

    /** 批次匯入題目 */
    @PostMapping("/{examId}/questions/batch")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<QuestionDetailResponse>> batchImportQuestions(
            @PathVariable Long examId,
            @Valid @RequestBody BatchQuestionsRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(examService.batchImportQuestions(examId, req.questions(), user.getUsername()));
    }

    @PutMapping("/questions/{questionId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<QuestionDetailResponse> updateQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(examService.updateQuestion(questionId, req, user.getUsername()));
    }

    @DeleteMapping("/questions/{questionId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long questionId,
            @AuthenticationPrincipal UserDetails user) {
        examService.deleteQuestion(questionId, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
