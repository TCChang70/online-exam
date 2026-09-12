# 線上測驗系統 (Online Exam API)

> Spring Boot 3 + Spring Data JPA + SQLite + JWT 教學示範專案

## 快速開始

### 前置需求
- Java 21+：`java -version`
- Maven 3.9+：`mvn -version`

### 執行
```bash
cd online-exam-api
mvn spring-boot:run
```
伺服器啟動於 `http://localhost:8080`，資料庫檔案存放於 `~/online-exam.db`

### 預設帳號（首次啟動自動建立）

| 帳號 | 密碼 | 角色 | 顯示名稱 |
|------|------|------|----------|
| `teacher` | `password123` | 教師 | 王老師 |
| `student1` | `password123` | 學生 | 小明 |
| `student2` | `password123` | 學生 | 小華 |

### 快速測試（3 步驟）
```bash
# 1. 學生登入，取得 JWT Token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"password123"}'

# 2. 查看開放中的測驗（貼上上面回傳的 token）
TOKEN="eyJhbGci..."
curl http://localhost:8080/api/exams \
  -H "Authorization: Bearer $TOKEN"

# 3. 取得測驗題目並作答
curl http://localhost:8080/api/exams/1/take \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:8080/api/exams/1/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answers":{"1":"B","2":"C","3":"B","4":"B","5":"C"}}'
```

## 教學文件
| 文件 | 說明 |
|------|------|
| [01-project-overview.md](docs/01-project-overview.md) | 架構說明與技術選型 |
| [02-api-reference.md](docs/02-api-reference.md) | 完整 API 參考與範例 |
| [03-jwt-auth-guide.md](docs/03-jwt-auth-guide.md) | JWT 驗證流程說明 |
| [04-student-exercises.md](docs/04-student-exercises.md) | 學生延伸練習題 |

## 專案結構
```
src/main/java/com/example/onlineexam/
├── config/         SecurityConfig.java, DataInitializer.java
├── controller/     AuthController, ExamController, ResultController
├── dto/            Request/Response 資料傳輸物件（12 個 record）
├── entity/         User, Exam, Question, ExamResult
├── exception/      GlobalExceptionHandler
├── repository/     JPA 資料存取介面
├── security/       JwtUtil, JwtFilter, UserDetailsServiceImpl
└── service/        AuthService, ExamService, ResultService
```
