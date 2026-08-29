# 02 — API 完整參考

> 所有端點（除了 `/api/auth/**`）都需要在 Header 帶入：
> `Authorization: Bearer <token>`

---

## 認證端點

### POST /api/auth/register
學生自行註冊（角色固定為 ROLE_STUDENT）

**Request:**
```json
{
  "username": "alice",
  "password": "mypass123",
  "displayName": "Alice 陳"
}
```

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "alice",
  "role": "ROLE_STUDENT",
  "displayName": "Alice 陳"
}
```

---

### POST /api/auth/login

**Request:**
```json
{ "username": "student1", "password": "password123" }
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "student1",
  "role": "ROLE_STUDENT",
  "displayName": "小明"
}
```

**curl 範例：**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher","password":"password123"}'
```

---

## 測驗端點

### GET /api/exams
列出所有開放中的測驗（學生/教師皆可用）

**Response 200:**
```json
[
  {
    "id": 1,
    "title": "Java 基礎概念測驗",
    "description": "測試 Java 物件導向...",
    "timeLimit": 30,
    "questionCount": 5,
    "active": true
  }
]
```

---

### GET /api/exams/{id}/take
取得測驗題目（不含正確答案）

**Response 200:**
```json
{
  "id": 1,
  "title": "Java 基礎概念測驗",
  "timeLimit": 30,
  "questions": [
    {
      "id": 1,
      "questionText": "Java 中，哪個關鍵字用於建立物件實例？",
      "optionA": "create",
      "optionB": "new",
      "optionC": "instance",
      "optionD": "make",
      "points": 2
    }
  ]
}
```

---

### POST /api/exams/{id}/submit
提交作答，系統自動評分

**Request:**
```json
{
  "answers": {
    "1": "B",
    "2": "C",
    "3": "B",
    "4": "B",
    "5": "C"
  }
}
```
> Key 為題目 ID（字串），Value 為選項（A/B/C/D）

**Response 200:**
```json
{
  "id": 1,
  "examId": 1,
  "examTitle": "Java 基礎概念測驗",
  "studentName": "小明",
  "score": 12,
  "totalPoints": 12,
  "percentage": 100.0,
  "grade": "A",
  "submittedAt": "2026-08-29T10:30:00"
}
```

**錯誤：重複提交**
```json
{ "timestamp": "...", "message": "您已提交過此測驗，不可重複作答" }
```

---

## 教師端點（需 ROLE_TEACHER）

### GET /api/exams/all
列出所有測驗（包含未開放的）

### GET /api/exams/{id}/detail
取得測驗完整資訊（含正確答案）

**Response 200:**
```json
{
  "id": 1,
  "title": "Java 基礎概念測驗",
  "questions": [
    {
      "id": 1,
      "questionText": "...",
      "optionA": "create", "optionB": "new",
      "optionC": "instance", "optionD": "make",
      "correctAnswer": "B",
      "points": 2
    }
  ]
}
```

### POST /api/exams
建立新測驗

**Request:**
```json
{
  "title": "Spring Boot 進階測驗",
  "description": "測試 RESTful API 設計能力",
  "timeLimit": 45
}
```

**Response 201:**
```json
{ "id": 2, "title": "Spring Boot 進階測驗", "questionCount": 0, "active": true }
```

### PUT /api/exams/{id}
更新測驗資訊（同建立格式）

### DELETE /api/exams/{id}
刪除測驗（同時刪除題目與所有學生成績）— Response 204

---

## 題目管理（教師）

### POST /api/exams/{examId}/questions
新增題目

**Request:**
```json
{
  "questionText": "Spring MVC 的 @PathVariable 用途？",
  "optionA": "設定路徑前綴",
  "optionB": "取得 URL 路徑中的變數",
  "optionC": "宣告請求參數",
  "optionD": "注入 Bean",
  "correctAnswer": "B",
  "points": 3
}
```

### PUT /api/exams/questions/{questionId}
更新題目（同新增格式）

### DELETE /api/exams/questions/{questionId}
刪除題目 — Response 204

---

## 成績端點

### GET /api/results/my
查詢自己的所有成績（學生/教師皆可）

**Response 200:**
```json
[
  {
    "id": 1,
    "examId": 1,
    "examTitle": "Java 基礎概念測驗",
    "studentName": "小明",
    "score": 10,
    "totalPoints": 12,
    "percentage": 83.3,
    "grade": "B",
    "submittedAt": "2026-08-29T10:30:00"
  }
]
```

### GET /api/results/exam/{examId}
查詢某場測驗的所有學生成績（教師限定，依分數降序排列）

---

## HTTP 狀態碼對照

| 狀態碼 | 意義 |
|--------|------|
| 200 OK | 成功 |
| 201 Created | 資源建立成功 |
| 204 No Content | 刪除成功 |
| 400 Bad Request | 輸入資料驗證失敗 |
| 401 Unauthorized | 未帶 Token 或 Token 無效 |
| 403 Forbidden | 已驗證但權限不足 |
| 404 Not Found | 資源不存在 |
| 409 Conflict | 帳號重複或重複作答 |
