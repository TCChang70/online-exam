# 04 — 學生延伸練習題

> 這些練習題設計為漸進難度。建議依序完成，每題完成後用 curl 或 Postman 驗證。

---

## 練習 1：新增題目欄位（⭐ 基礎）

**目標：** 在 `Question` 實體加入 `explanation`（解析）欄位，讓教師可以填寫答案解析，
但學生在作答時無法看到，只有**查看成績後**才能看到。

**步驟提示：**
1. 在 `Question.java` 加入 `private String explanation;`
2. 在 `QuestionRequest.java` 加入 `explanation`（教師填寫）
3. 在 `QuestionDetailResponse.java` 加入（教師視圖）
4. 建立新的 `ResultDetailResponse` 包含每題的解析（學生查成績時回傳）
5. 重啟後 JPA 自動更新 DB schema（`ddl-auto=update`）

**驗證：**
```bash
# 教師新增題目時填入解析
curl -X POST http://localhost:8080/api/exams/1/questions \
  -H "Authorization: Bearer <teacher-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "...新題目...",
    "optionA":"A","optionB":"B","optionC":"C","optionD":"D",
    "correctAnswer":"A","points":2,
    "explanation":"因為 A 是正確的，因為..."
  }'
```

---

## 練習 2：輸入資料驗證（⭐ 基礎）

**目標：** 確保 `SubmitRequest` 中每個答案都是合法值（只允許 `A`、`B`、`C`、`D`）。

**步驟提示：**
1. 在 `SubmitRequest.java` 中，對 `answers` 的 Value 加入自訂驗證
2. 可以用 `@Valid` + 自訂 Validator，或在 `ResultService.submitExam()` 中手動驗證
3. 若有非法答案（例如 `"E"` 或空字串），回傳 `400 Bad Request`

**範例驗證邏輯（在 Service 中）：**
```java
answers.forEach((questionId, answer) -> {
    if (!Set.of("A","B","C","D").contains(answer)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "答案格式錯誤：題目 " + questionId + " 的選項必須是 A/B/C/D");
    }
});
```

---

## 練習 3：分頁查詢（⭐⭐ 中級）

**目標：** `GET /api/exams` 改為支援分頁，加入 `?page=0&size=10` 查詢參數。

**步驟提示：**
1. 在 `ExamRepository` 改繼承 `PagingAndSortingRepository`（或直接在方法加 `Pageable` 參數）
2. 修改 `ExamService.getActiveExams(int page, int size)` 使用 `PageRequest.of(page, size)`
3. 修改 `ExamController.getActiveExams(@RequestParam int page, @RequestParam int size)`
4. 回傳 `Page<ExamSummaryResponse>` 或包含 `content`、`totalPages`、`totalElements` 的物件

**Spring Data JPA 分頁範例：**
```java
// Repository
Page<Exam> findByActiveTrue(Pageable pageable);

// Service
Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
Page<Exam> examPage = examRepository.findByActiveTrue(pageable);
```

---

## 練習 4：時間限制強制執行（⭐⭐ 中級）

**目標：** 記錄學生開始作答的時間，若超過 `timeLimit` 分鐘才提交，拒絕作答。

**步驟提示：**
1. 建立新實體 `ExamSession`：記錄 `userId`、`examId`、`startedAt`
2. 新增端點 `POST /api/exams/{id}/start`：建立 Session 並記錄開始時間，回傳 Session ID
3. 修改 `POST /api/exams/{id}/submit`：查詢對應 Session，計算時間差，若超時回傳 `408 Request Timeout`

**時間計算：**
```java
long minutesElapsed = ChronoUnit.MINUTES.between(session.getStartedAt(), LocalDateTime.now());
if (minutesElapsed > exam.getTimeLimit()) {
    throw new ResponseStatusException(HttpStatus.REQUEST_TIMEOUT, "已超過測驗時間限制");
}
```

---

## 練習 5：成績統計 API（⭐⭐⭐ 進階）

**目標：** 新增端點 `GET /api/results/exam/{examId}/statistics`（教師限定），
回傳測驗的統計資料。

**回傳格式（自行設計 DTO）：**
```json
{
  "examTitle": "Java 基礎概念測驗",
  "totalSubmissions": 15,
  "averageScore": 8.6,
  "averagePercentage": 71.7,
  "gradeDistribution": {
    "A": 3,
    "B": 5,
    "C": 4,
    "D": 2,
    "F": 1
  },
  "questionStats": [
    {
      "questionId": 1,
      "questionText": "Java 中，哪個關鍵字...",
      "correctRate": 0.93
    }
  ]
}
```

**提示：**
- `gradeDistribution` 可用 `Collectors.groupingBy(r -> r.getGrade(), Collectors.counting())`
- 每題答對率需要 parse 每份 `ExamResult.answers` JSON，與 `Question.correctAnswer` 比對
- 可用 `ObjectMapper.readValue(answersJson, Map.class)` 解析 JSON 字串
