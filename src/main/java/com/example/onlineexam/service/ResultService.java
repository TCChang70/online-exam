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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

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
        if (!exam.isAllowRetake()) {
            boolean alreadyTaken = examResultRepository.findByUserAndExamOrderByIdAsc(user, exam)
                    .stream().anyMatch(r -> !r.isDeleted());
            if (alreadyTaken) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "此測驗不允許重複作答");
            }
        }

        List<Question> questions = questionRepository.findByExamOrderByIdAsc(exam);
        Map<String, String> answers = req.answers();

        int score = 0;
        int totalPoints = 0;
        for (Question q : questions) {
            totalPoints += q.getPoints();
            String submitted = answers.get(String.valueOf(q.getId()));
            if (isCorrect(q, submitted)) {
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

        int attemptNumber = (int) examResultRepository.findByUserAndExamOrderByIdAsc(user, exam)
                .stream().filter(r -> !r.isDeleted()).count();
        return toResultResponse(result, attemptNumber, exam.isHideResult());
    }

    @Transactional(readOnly = true)
    public List<ResultResponse> getMyResults(String username) {
        User user = findUserByUsername(username);
        List<ExamResult> results = examResultRepository.findByUserOrderBySubmittedAtDesc(user)
                .stream().filter(r -> !r.isDeleted()).toList();
        Map<Long, Integer> attemptMap = buildAttemptMap(results);
        return results.stream()
                .map(r -> toResultResponse(r, attemptMap.get(r.getId()),
                        r.getExam().isHideResult()))
                .toList();
    }

    /** 學生本人跨測驗成績報表（尊重測驗的隱藏成績設定） */
    @Transactional(readOnly = true)
    public StudentReportResponse getMyStudentReport(String username) {
        User user = findUserByUsername(username);
        List<ExamResult> results = examResultRepository.findByUserOrderBySubmittedAtDesc(user)
                .stream().filter(r -> !r.isDeleted()).toList();
        return buildStudentReport(user, results, true);
    }

    /** 教師檢視某位學生的跨測驗成績報表（僅涵蓋該教師建立的測驗） */
    @Transactional(readOnly = true)
    public StudentReportResponse getStudentReport(Long studentId, String username) {
        User teacher = findUserByUsername(username);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到學生"));
        if (!"ROLE_STUDENT".equals(student.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "此帳號不是學生");
        }
        List<ExamResult> results = examResultRepository.findByUserOrderBySubmittedAtDesc(student)
                .stream()
                .filter(r -> !r.isDeleted())
                .filter(r -> ownedByTeacher(r.getExam(), teacher))
                .toList();
        return buildStudentReport(student, results, false);
    }

    /** 教師檢視班級成績報表（欄為該教師建立的測驗、列為班上學生） */
    @Transactional(readOnly = true)
    public ClassReportResponse getClassReport(String className, String username) {
        User teacher = findUserByUsername(username);
        List<User> students = (className != null && !className.isBlank())
                ? userRepository.findByRoleAndClassNameOrderByDisplayNameAsc("ROLE_STUDENT", className)
                : userRepository.findByRoleOrderByClassNameAscDisplayNameAsc("ROLE_STUDENT");

        List<Exam> exams = new ArrayList<>(examRepository.findByCreatedByOrderByIdDesc(teacher));
        exams.sort(Comparator.comparing(Exam::getId));

        if (students.isEmpty()) {
            return new ClassReportResponse(className, List.of(), List.of());
        }

        List<ExamResult> allResults = examResultRepository.findByUserInOrderBySubmittedAtDesc(students)
                .stream()
                .filter(r -> !r.isDeleted())
                .filter(r -> ownedByTeacher(r.getExam(), teacher))
                .toList();

        Map<String, ExamResult> bestByKey = new HashMap<>();
        Map<String, Integer> attemptsByKey = new HashMap<>();
        for (ExamResult r : allResults) {
            String key = reportKey(r.getUser().getId(), r.getExam().getId());
            attemptsByKey.merge(key, 1, Integer::sum);
            ExamResult cur = bestByKey.get(key);
            if (cur == null || percentage(r) > percentage(cur)) {
                bestByKey.put(key, r);
            }
        }

        List<ClassReportRow> rows = new ArrayList<>();
        for (User s : students) {
            List<ClassReportCell> cells = new ArrayList<>();
            List<Double> studentPcts = new ArrayList<>();
            for (Exam e : exams) {
                String key = reportKey(s.getId(), e.getId());
                ExamResult best = bestByKey.get(key);
                if (best == null) {
                    cells.add(new ClassReportCell(e.getId(), null, null, null, null, 0, null));
                } else {
                    double p = percentage(best);
                    studentPcts.add(p);
                    cells.add(new ClassReportCell(e.getId(), best.getScore(), best.getTotalPoints(),
                            round1(p), calculateGrade(p), attemptsByKey.getOrDefault(key, 1), best.getSubmittedAt()));
                }
            }
            Double avg = studentPcts.isEmpty() ? null : round1(average(studentPcts));
            rows.add(new ClassReportRow(s.getId(), s.getDisplayName(), s.getClassName(), avg, cells));
        }

        List<ClassReportExam> examCols = new ArrayList<>();
        for (Exam e : exams) {
            List<Double> pcts = new ArrayList<>();
            for (User s : students) {
                ExamResult best = bestByKey.get(reportKey(s.getId(), e.getId()));
                if (best != null) pcts.add(percentage(best));
            }
            examCols.add(new ClassReportExam(e.getId(), e.getTitle(), pcts.size(),
                    pcts.isEmpty() ? null : round1(average(pcts))));
        }

        return new ClassReportResponse(className, examCols, rows);
    }

    /** 依「測驗」彙總單一學生的成績：每測驗取最佳一次作答，並計算整體統計 */
    private StudentReportResponse buildStudentReport(User user, List<ExamResult> results, boolean respectHide) {
        Map<Long, List<ExamResult>> byExam = results.stream()
                .collect(Collectors.groupingBy(r -> r.getExam().getId(), TreeMap::new, Collectors.toList()));

        Map<String, Integer> gradeDistribution = new LinkedHashMap<>();
        for (String g : List.of("A", "B", "C", "D", "F")) gradeDistribution.put(g, 0);

        List<StudentReportItem> items = new ArrayList<>();
        List<Double> visiblePcts = new ArrayList<>();
        int totalAttempts = 0;

        for (Map.Entry<Long, List<ExamResult>> entry : byExam.entrySet()) {
            List<ExamResult> attempts = entry.getValue();
            Exam exam = attempts.get(0).getExam();
            totalAttempts += attempts.size();
            ExamResult best = attempts.stream().max(Comparator.comparingDouble(this::percentage))
                    .orElse(attempts.get(0));

            if (respectHide && exam.isHideResult()) {
                items.add(new StudentReportItem(exam.getId(), exam.getTitle(), null, best.getTotalPoints(),
                        null, null, attempts.size(), best.getSubmittedAt(), true));
            } else {
                double p = percentage(best);
                String grade = calculateGrade(p);
                visiblePcts.add(p);
                gradeDistribution.merge(grade, 1, Integer::sum);
                items.add(new StudentReportItem(exam.getId(), exam.getTitle(), best.getScore(), best.getTotalPoints(),
                        round1(p), grade, attempts.size(), best.getSubmittedAt(), false));
            }
        }

        double avg = visiblePcts.isEmpty() ? 0 : round1(average(visiblePcts));
        double bestPct = visiblePcts.isEmpty() ? 0
                : round1(visiblePcts.stream().mapToDouble(Double::doubleValue).max().orElse(0));
        double lowestPct = visiblePcts.isEmpty() ? 0
                : round1(visiblePcts.stream().mapToDouble(Double::doubleValue).min().orElse(0));

        return new StudentReportResponse(user.getId(), user.getDisplayName(), user.getClassName(),
                byExam.size(), totalAttempts, avg, bestPct, lowestPct, gradeDistribution, items);
    }

    private boolean ownedByTeacher(Exam exam, User teacher) {
        return exam.getCreatedBy() != null && exam.getCreatedBy().getId().equals(teacher.getId());
    }

    private String reportKey(Long userId, Long examId) {
        return userId + ":" + examId;
    }

    private double percentage(ExamResult r) {
        return r.getTotalPoints() != null && r.getTotalPoints() > 0
                ? (double) r.getScore() / r.getTotalPoints() * 100 : 0;
    }

    private double average(List<Double> values) {
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    @Transactional(readOnly = true)
    public List<ResultResponse> getExamResults(Long examId, String username) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到測驗"));
        if (exam.getCreatedBy() == null || !exam.getCreatedBy().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您沒有權限查看此測驗的成績");
        }
        List<ExamResult> results = examResultRepository.findByExamOrderByScoreDesc(exam)
                .stream().filter(r -> !r.isDeleted()).toList();
        Map<Long, Integer> attemptMap = buildAttemptMap(results);
        // 教師可查看全部成績，不受隱藏設定影響
        return results.stream()
                .map(r -> toResultResponse(r, attemptMap.get(r.getId()), false))
                .toList();
    }

    /** 教師取得某場測驗所有「已刪除」的作答紀錄（供復原用） */
    @Transactional(readOnly = true)
    public List<ResultResponse> getDeletedExamResults(Long examId, String username) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到測驗"));
        if (exam.getCreatedBy() == null || !exam.getCreatedBy().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您沒有權限查看此測驗的成績");
        }
        List<ExamResult> results = examResultRepository.findByExamOrderByScoreDesc(exam)
                .stream().filter(ExamResult::isDeleted).toList();
        Map<Long, Integer> attemptMap = buildAttemptMap(results);
        return results.stream()
                .map(r -> toResultResponse(r, attemptMap.get(r.getId()), false))
                .toList();
    }

    /** 教師軟刪除某筆作答紀錄（資料保留、僅隱藏） */
    @Transactional
    public void softDeleteResult(Long resultId, String username) {
        ExamResult result = findOwnedResult(resultId, username);
        result.setDeleted(true);
        examResultRepository.save(result);
    }

    /** 教師復原已刪除的作答紀錄 */
    @Transactional
    public void restoreResult(Long resultId, String username) {
        ExamResult result = findOwnedResult(resultId, username);
        result.setDeleted(false);
        examResultRepository.save(result);
    }

    private ExamResult findOwnedResult(Long resultId, String username) {
        ExamResult result = examResultRepository.findById(resultId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到作答紀錄"));
        Exam exam = result.getExam();
        if (exam.getCreatedBy() == null || !exam.getCreatedBy().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您沒有權限操作此作答紀錄");
        }
        return result;
    }

    /** 教師檢視單一學生的作答明細（每題的學生答案、正確答案、對錯） */
    @Transactional(readOnly = true)
    public StudentExamResultDetailResponse getExamResultDetail(Long examId, Long resultId, String username) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到測驗"));
        if (exam.getCreatedBy() == null || !exam.getCreatedBy().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您沒有權限查看此測驗的作答紀錄");
        }

        ExamResult result = examResultRepository.findById(resultId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到作答紀錄"));
        if (!result.getExam().getId().equals(examId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "作答紀錄不屬於此測驗");
        }
        if (result.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "此作答紀錄已刪除");
        }

        Map<String, String> submitted = parseAnswers(result.getAnswers());
        List<Question> questions = questionRepository.findByExamOrderByIdAsc(exam);

        int correctCount = 0;
        List<AnswerRecordResponse> answers = new java.util.ArrayList<>();
        for (Question q : questions) {
            String studentAnswer = submitted.get(String.valueOf(q.getId()));
            boolean correct = isCorrect(q, studentAnswer);
            if (correct) correctCount++;
            answers.add(new AnswerRecordResponse(
                    q.getId(), q.getQuestionText(),
                    q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD(),
                    q.getOptionE(), q.getOptionF(), q.getOptionG(), q.getOptionH(), q.getOptionI(),
                    q.isMultiSelect(), q.getPoints(),
                    studentAnswer == null ? "" : studentAnswer,
                    q.getCorrectAnswer(),
                    correct));
        }

        double pct = result.getTotalPoints() > 0
                ? (double) result.getScore() / result.getTotalPoints() * 100 : 0;
        double roundedPct = Math.round(pct * 10.0) / 10.0;
        return new StudentExamResultDetailResponse(
                result.getId(), exam.getId(), exam.getTitle(),
                result.getUser().getDisplayName(), result.getUser().getClassName(),
                result.getScore(), result.getTotalPoints(), roundedPct,
                calculateGrade(pct), result.getSubmittedAt(),
                correctCount, answers);
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> parseAnswers(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }

    private ResultResponse toResultResponse(ExamResult r, Integer attemptNumber, boolean hideScore) {
        if (hideScore) {
            return new ResultResponse(r.getId(), r.getExam().getId(),
                    r.getExam().getTitle(), r.getUser().getDisplayName(),
                    r.getUser().getClassName(),
                    null, r.getTotalPoints(), null, null, r.getSubmittedAt(),
                    attemptNumber, true);
        }
        double pct = r.getTotalPoints() > 0
                ? (double) r.getScore() / r.getTotalPoints() * 100 : 0;
        double roundedPct = Math.round(pct * 10.0) / 10.0;
        return new ResultResponse(r.getId(), r.getExam().getId(),
                r.getExam().getTitle(), r.getUser().getDisplayName(),
                r.getUser().getClassName(),
                r.getScore(), r.getTotalPoints(), roundedPct,
                calculateGrade(pct), r.getSubmittedAt(),
                attemptNumber, false);
    }

    /** 依「同一位考生、同一測驗」計算每次作答的次序（第 N 次作答） */
    private Map<Long, Integer> buildAttemptMap(List<ExamResult> results) {
        Map<String, Integer> counters = new java.util.HashMap<>();
        Map<Long, Integer> map = new java.util.HashMap<>();
        results.stream()
                .sorted(java.util.Comparator.comparing(ExamResult::getId))
                .forEach(r -> {
                    String key = r.getUser().getId() + ":" + r.getExam().getId();
                    int n = counters.merge(key, 1, Integer::sum);
                    map.put(r.getId(), n);
                });
        return map;
    }

    private String calculateGrade(double pct) {
        if (pct >= 90) return "A";
        if (pct >= 80) return "B";
        if (pct >= 70) return "C";
        if (pct >= 60) return "D";
        return "F";
    }

    /** 判斷答案是否正確：多選題比較集合（順序無關），單選題直接比較 */
    private boolean isCorrect(Question q, String submitted) {
        if (submitted == null || submitted.isBlank()) return false;
        if (q.isMultiSelect()) {
            return toSet(q.getCorrectAnswer()).equals(toSet(submitted));
        }
        return q.getCorrectAnswer().trim().equalsIgnoreCase(submitted.trim());
    }

    private java.util.Set<String> toSet(String s) {
        java.util.LinkedHashSet<String> set = new java.util.LinkedHashSet<>();
        if (s != null) {
            for (String part : s.split(",")) {
                String t = part.trim();
                if (!t.isEmpty()) set.add(t.toUpperCase());
            }
        }
        return set;
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到使用者"));
    }
}
