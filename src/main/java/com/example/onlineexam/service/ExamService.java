package com.example.onlineexam.service;

import com.example.onlineexam.dto.*;
import com.example.onlineexam.entity.*;
import com.example.onlineexam.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final ExamResultRepository examResultRepository;
    private final UserRepository userRepository;

    // ── 列出測驗 ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ExamSummaryResponse> getActiveExams() {
        return examRepository.findByActiveTrueOrderByIdAsc().stream()
                .map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public List<ExamSummaryResponse> getAllExams() {
        return examRepository.findAll().stream()
                .map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public ExamDetailResponse getExamDetail(Long examId) {
        Exam exam = findExamById(examId);
        List<QuestionDetailResponse> questions = questionRepository
                .findByExamOrderByIdAsc(exam).stream().map(this::toQuestionDetail).toList();
        String creator = exam.getCreatedBy() != null
                ? exam.getCreatedBy().getDisplayName() : "未知";
        return new ExamDetailResponse(exam.getId(), exam.getTitle(), exam.getDescription(),
                exam.getTimeLimit(), exam.isActive(), creator, questions);
    }

    @Transactional(readOnly = true)
    public ExamTakeResponse getExamForStudent(Long examId) {
        Exam exam = findExamById(examId);
        if (!exam.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "此測驗目前未開放");
        }
        List<QuestionStudentResponse> questions = questionRepository
                .findByExamOrderByIdAsc(exam).stream().map(this::toQuestionStudent).toList();
        return new ExamTakeResponse(exam.getId(), exam.getTitle(),
                exam.getDescription(), exam.getTimeLimit(), questions);
    }

    // ── 測驗 CRUD ─────────────────────────────────────────────────────────────

    @Transactional
    public ExamSummaryResponse createExam(ExamRequest req, String username) {
        User teacher = findUserByUsername(username);
        Exam exam = examRepository.save(Exam.builder()
                .title(req.title())
                .description(req.description())
                .timeLimit(req.timeLimit() != null ? req.timeLimit() : 60)
                .createdBy(teacher)
                .active(true)
                .build());
        return toSummary(exam);
    }

    @Transactional
    public ExamSummaryResponse updateExam(Long examId, ExamRequest req, String username) {
        Exam exam = findExamById(examId);
        checkOwnership(exam, username);
        exam.setTitle(req.title());
        exam.setDescription(req.description());
        if (req.timeLimit() != null) exam.setTimeLimit(req.timeLimit());
        return toSummary(examRepository.save(exam));
    }

    @Transactional
    public void deleteExam(Long examId, String username) {
        Exam exam = findExamById(examId);
        checkOwnership(exam, username);
        examResultRepository.deleteByExam(exam);
        questionRepository.deleteByExam(exam);
        examRepository.delete(exam);
    }

    /** 開放 / 關閉測驗（enable / disable） */
    @Transactional
    public ExamSummaryResponse setExamActive(Long examId, boolean active, String username) {
        Exam exam = findExamById(examId);
        checkOwnership(exam, username);
        exam.setActive(active);
        return toSummary(examRepository.save(exam));
    }

    // ── 題目 CRUD ─────────────────────────────────────────────────────────────

    @Transactional
    public QuestionDetailResponse addQuestion(Long examId, QuestionRequest req, String username) {
        Exam exam = findExamById(examId);
        checkOwnership(exam, username);
        Question q = questionRepository.save(Question.builder()
                .exam(exam)
                .questionText(req.questionText())
                .optionA(req.optionA()).optionB(req.optionB())
                .optionC(req.optionC()).optionD(req.optionD())
                .correctAnswer(req.correctAnswer())
                .points(req.points() != null ? req.points() : 1)
                .build());
        return toQuestionDetail(q);
    }

    @Transactional
    public QuestionDetailResponse updateQuestion(Long questionId, QuestionRequest req, String username) {
        Question q = findQuestionById(questionId);
        checkOwnership(q.getExam(), username);
        q.setQuestionText(req.questionText());
        q.setOptionA(req.optionA()); q.setOptionB(req.optionB());
        q.setOptionC(req.optionC()); q.setOptionD(req.optionD());
        q.setCorrectAnswer(req.correctAnswer());
        if (req.points() != null) q.setPoints(req.points());
        return toQuestionDetail(questionRepository.save(q));
    }

    @Transactional
    public void deleteQuestion(Long questionId, String username) {
        Question q = findQuestionById(questionId);
        checkOwnership(q.getExam(), username);
        questionRepository.delete(q);
    }

    /** 批次匯入題目 */
    @Transactional
    public List<QuestionDetailResponse> batchImportQuestions(
            Long examId, List<QuestionRequest> requests, String username) {
        Exam exam = findExamById(examId);
        checkOwnership(exam, username);
        List<QuestionDetailResponse> saved = new ArrayList<>();
        for (QuestionRequest req : requests) {
            Question q = questionRepository.save(Question.builder()
                    .exam(exam)
                    .questionText(req.questionText())
                    .optionA(req.optionA()).optionB(req.optionB())
                    .optionC(req.optionC()).optionD(req.optionD())
                    .correctAnswer(req.correctAnswer())
                    .points(req.points() != null ? req.points() : 1)
                    .build());
            saved.add(toQuestionDetail(q));
        }
        return saved;
    }

    // ── 內部輔助方法 ─────────────────────────────────────────────────────────

    private Exam findExamById(Long id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到測驗"));
    }

    private Question findQuestionById(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到題目"));
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到使用者"));
    }

    private void checkOwnership(Exam exam, String username) {
        if (exam.getCreatedBy() == null
                || !exam.getCreatedBy().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您沒有權限修改此測驗");
        }
    }

    private ExamSummaryResponse toSummary(Exam exam) {
        return new ExamSummaryResponse(exam.getId(), exam.getTitle(), exam.getDescription(),
                exam.getTimeLimit(), questionRepository.countByExam(exam), exam.isActive());
    }

    private QuestionDetailResponse toQuestionDetail(Question q) {
        return new QuestionDetailResponse(q.getId(), q.getQuestionText(),
                q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD(),
                q.getCorrectAnswer(), q.getPoints());
    }

    private QuestionStudentResponse toQuestionStudent(Question q) {
        return new QuestionStudentResponse(q.getId(), q.getQuestionText(),
                q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD(), q.getPoints());
    }
}
