package com.example.onlineexam.service;

import com.example.onlineexam.dto.*;
import com.example.onlineexam.entity.*;
import com.example.onlineexam.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final ExamResultRepository examResultRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public ResultResponse submitExam(Long examId, SubmitRequest req, String username) {
        User user = findUserByUsername(username);
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到測驗"));

        if (!exam.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "此測驗目前未開放");
        }
        if (examResultRepository.existsByUserAndExam(user, exam)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "您已提交過此測驗，不可重複作答");
        }

        List<Question> questions = questionRepository.findByExamOrderByIdAsc(exam);
        Map<String, String> answers = req.answers();

        int score = 0;
        int totalPoints = 0;
        for (Question q : questions) {
            totalPoints += q.getPoints();
            String submitted = answers.get(String.valueOf(q.getId()));
            if (q.getCorrectAnswer().equals(submitted)) {
                score += q.getPoints();
            }
        }

        String answersJson;
        try {
            answersJson = objectMapper.writeValueAsString(answers);
        } catch (JsonProcessingException e) {
            answersJson = "{}";
        }

        ExamResult result = examResultRepository.save(ExamResult.builder()
                .user(user).exam(exam)
                .answers(answersJson)
                .score(score).totalPoints(totalPoints)
                .submittedAt(LocalDateTime.now())
                .build());

        return toResultResponse(result);
    }

    @Transactional(readOnly = true)
    public List<ResultResponse> getMyResults(String username) {
        User user = findUserByUsername(username);
        return examResultRepository.findByUserOrderBySubmittedAtDesc(user)
                .stream().map(this::toResultResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ResultResponse> getExamResults(Long examId, String username) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到測驗"));
        if (exam.getCreatedBy() == null || !exam.getCreatedBy().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您沒有權限查看此測驗的成績");
        }
        return examResultRepository.findByExamOrderByScoreDesc(exam)
                .stream().map(this::toResultResponse).toList();
    }

    private ResultResponse toResultResponse(ExamResult r) {
        double pct = r.getTotalPoints() > 0
                ? (double) r.getScore() / r.getTotalPoints() * 100 : 0;
        double roundedPct = Math.round(pct * 10.0) / 10.0;
        return new ResultResponse(r.getId(), r.getExam().getId(),
                r.getExam().getTitle(), r.getUser().getDisplayName(),
                r.getUser().getClassName(),
                r.getScore(), r.getTotalPoints(), roundedPct,
                calculateGrade(pct), r.getSubmittedAt());
    }

    private String calculateGrade(double pct) {
        if (pct >= 90) return "A";
        if (pct >= 80) return "B";
        if (pct >= 70) return "C";
        if (pct >= 60) return "D";
        return "F";
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到使用者"));
    }
}
