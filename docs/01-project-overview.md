# 01 — 專案架構說明

## 系統概述

本專案是一套簡易的**線上選擇題測驗系統**，提供兩種角色：

| 角色 | 帳號 | 可執行操作 |
|------|------|-----------|
| 教師 (TEACHER) | teacher | 建立/修改/刪除測驗與題目、查看所有學生成績 |
| 學生 (STUDENT) | student1, student2 | 瀏覽測驗、作答、查看自己的成績 |

---

## 技術選型

| 技術 | 版本 | 選擇理由 |
|------|------|---------|
| Spring Boot | 3.3.4 | 零設定快速啟動，自動配置資料庫、安全等 |
| Spring Data JPA | 3.3.x | 用介面方法名稱自動產生 SQL，大幅降低資料存取程式碼 |
| SQLite | 3.46.x | 無需安裝資料庫伺服器，`.db` 檔案即資料庫 |
| JWT (jjwt 0.12) | 0.12.6 | 無狀態驗證，適合 REST API，不需 Session |
| Lombok | 最新 | `@Data`、`@Builder`、`@RequiredArgsConstructor` 消除 boilerplate |

---

## 架構分層

```
HTTP 請求
    │
    ▼
[Controller 層]  — 接收 HTTP 請求，驗證輸入，呼叫 Service
    │
    ▼
[Service 層]     — 商業邏輯（評分、權限判斷、資料轉換）
    │
    ▼
[Repository 層]  — JPA 介面，自動生成 SQL，存取 SQLite
    │
    ▼
[Entity 層]      — JPA 實體，對應資料庫表格
```

**DTO（Data Transfer Object）** 負責 Controller ↔ 外部世界的資料格式，
與 Entity 分離，避免直接暴露資料庫結構或敏感欄位（例如：密碼、答案）。

---

## 資料庫設計

```
users
  ├── id (PK, IDENTITY)
  ├── username (unique)
  ├── password (BCrypt)
  ├── display_name
  └── role (ROLE_STUDENT / ROLE_TEACHER)

exams
  ├── id (PK)
  ├── title
  ├── description
  ├── time_limit (分鐘)
  ├── created_by (FK → users)
  └── active (boolean)

questions
  ├── id (PK)
  ├── exam_id (FK → exams)
  ├── question_text
  ├── option_a / option_b / option_c / option_d
  ├── correct_answer (A/B/C/D)
  └── points

exam_results  (unique: user_id + exam_id，防止重複作答)
  ├── id (PK)
  ├── user_id (FK → users)
  ├── exam_id (FK → exams)
  ├── answers (JSON TEXT)
  ├── score / total_points
  └── submitted_at
```

---

## 安全機制

1. **密碼儲存**：BCrypt 雜湊（不可逆），即使資料庫洩露也無法還原
2. **JWT 驗證**：每個受保護的 API 都需要帶有效 Token
3. **角色授權**：`@PreAuthorize("hasRole('TEACHER')")` 限制只有教師可管理測驗
4. **學生無法看到正確答案**：`ExamTakeResponse` 和 `QuestionStudentResponse` 刻意排除 `correctAnswer`

---

## 如何執行

```bash
# 確認 Java 版本
java -version   # 需要 21+

# 確認 Maven 版本
mvn -version    # 需要 3.9+

# 執行（第一次會自動下載依賴，約需 1-2 分鐘）
cd online-exam-api
mvn spring-boot:run
```

啟動成功的訊息：
```
Started OnlineExamApiApplication in X.XXX seconds
已建立預設帳號：teacher / student1 / student2（密碼均為 password123）
已建立示範測驗「Java 基礎概念測驗」— 5 題，共 12 分
```

### 重置資料庫
刪除家目錄下的 `online-exam.db` 檔案，重啟後自動重建：
```bash
rm ~/online-exam.db   # macOS/Linux
del %USERPROFILE%\online-exam.db   # Windows
```
