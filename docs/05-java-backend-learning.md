# 05 — Java / Spring Boot 後端學習文件

> 以本專案 (online-exam-api) 的實際程式碼為教材，從「看懂」到「會寫」的逐層學習筆記。
> 涵蓋：Java 物件導向、Lombok、Spring Boot 分層架構、Spring Data JPA、Spring Security + JWT。

---

## 目錄

1. [學習目標與先備能力](#1-學習目標與先備能力)
2. [Java 基礎：record / enum / Optional](#2-java-基礎record--enum--optional)
3. [Lombok：擺脫樣板程式碼](#3-lombok擺脫樣板程式碼)
4. [Spring Boot 分層架構](#4-spring-boot-分層架構)
5. [JPA 實體與關聯](#5-jpa-實體與關聯)
6. [Repository：介面方法自動產生 SQL](#6-repository介面方法自動產生-sql)
7. [Service：商業邏輯與交易](#7-service商業邏輯與交易)
8. [Controller：接收請求與鑑別](#8-controller接收請求與鑑別)
9. [驗證 (Bean Validation)](#9-驗證-bean-validation)
10. [安全機制：Spring Security + JWT](#10-安全機制spring-security--jwt)
11. [例外處理](#11-例外處理)
12. [總結與下一步](#12-總結與下一步)

---

## 1. 學習目標與先備能力

### 本文件結束後你將能

- 讀懂本專案每一層的 Java 程式碼
- 說明 `@Service` / `@RestController` / `@Repository` 各自的職責
- 說明 Spring Data JPA「介面方法名稱 → SQL」的對應規則
- 說明 JWT 從登入到驗證的完整流程
- 知道在哪一層加入新功能、如何驗證與測試

### 先備能力建議

| 程度 | 說明 |
|------|------|
| Java 基礎 | 知道 class／方法／package 的基本寫法 |
| 會用 Maven | 會執行 `mvn spring-boot:run` |
| 有 HTTP 概念 | 知道 GET / POST / PUT / DELETE |

> 若你完全不會 Java，請先參考 lang-tutor 的 [學習路線圖] 從基礎學起。

---

## 2. Java 基礎：record / enum / Optional

這個專案大量使用 Java 16+ 的 **record**（資料記錄）語法，是新手最常困惑的地方。

### 2.1 record：不可變的資料容器

以 `LoginResponse.java` 為例：

```java
public record LoginResponse(String token, String username, String role, String displayName, String className) {}
```

**白話解釋：** record 是「自動生成樣板程式碼」的 class。

- 寫出這一行，Java 自動幫你生出：
  - 私有 final 欄位（不可變 immutable）
  - 全欄位建構子 `new LoginResponse(token, username, role, ...)`
  - 取值方法 `loginResponse.username()`（注意：**沒有 get 前綴**）
  - `equals()` / `hashCode()` / `toString()`

**與傳統 class 對比：**

```java
// 傳統寫法（很冗長）                          // record 寫法
public class LoginResponse {                   public record LoginResponse(
    private final String token;                  String token,
    private final String username;               String username,
    public LoginResponse(                        String role
        String token, String username,           ) {}
        String role) {
        this.token = token;
        this.username = username;
        this.role = role;
    }
    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
}
```

### 2.2 在方法中呼叫取值

本專案 `AuthService.java:36`：

```java
return new LoginResponse(token, user.getUsername(),
        user.getRole(), user.getDisplayName(), user.getClassName());
```

因為 `User` 是普通 class（用 Lombok `@Data` 產生 getter），所以用 `user.getUsername()`；
而 `LoginResponse` 是 record，在別處用 `req.username()`。**兩者取值的寫法不同，要分清楚。**

### 2.3 Optional：避免 NullPointerException

`UserRepository.java:10`：

```java
Optional<User> findByUsername(String username);
```

`Optional` 代表「可能回傳空值」的容器。使用方式（`AuthService.java:42`）：

```java
User user = userRepository.findByUsername(req.username()).orElseThrow();
```

- `.orElseThrow()`：有值就取出；沒值就拋例外。
- 也可用 `.orElse(defaultValue)` 提供預設值。
- 目的：強迫你把「可能沒有資料」的情況寫出來，減少 `null` 判斷漏失。

### ❌ / ✅ 對比（常見錯誤）

```java
// ❌ 直接對 null 呼叫方法 → NPE
User u = repo.findByUsername("x").get();   // get() 為空時拋 NoSuchElementException

// ✅ 用 orElseThrow 提供明確錯誤
User u = repo.findByUsername("x").orElseThrow(
    () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到使用者"));
```

---

## 3. Lombok：擺脫樣板程式碼

本專案在 `pom.xml` 引入了 Lombok，程式碼中使用 `@Data`、`@Builder`、`@RequiredArgsConstructor`。

以 `User.java` 為例：

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    private Long id;
    private String username;
    private String password;
    // ...
}
```

### 常用註解對照表

| 註解 | 自動生成 | 本專案範例 |
|------|---------|-----------|
| `@Data` | 所有欄位的 getter/setter + `toString` + `equals`/`hashCode` | `User` |
| `@Builder` | 鏈式建構 `User.builder().username("x").build()` | `User`、`Exam` |
| `@NoArgsConstructor` | 無參數建構子 | `User` |
| `@AllArgsConstructor` | 全參數建構子 | `User` |
| `@RequiredArgsConstructor` | 為所有 `final` 欄位生成建構子（Spring 用於**建構子注入**） | 所有 Service |

### @Builder 實際用法 (`DataInitializer.java:29`)

```java
User teacher = userRepository.save(User.builder()
        .username("teacher")
        .password(passwordEncoder.encode("password123"))
        .displayName("王老師")
        .role("ROLE_TEACHER")
        .build());
```

**為什麼好？** 欄位很多時，建構子參數順序容易錯；Builder 用名稱指定，順序無所謂，可讀性高。

### @RequiredArgsConstructor 與依賴注入

`ExamService.java:14-21`：

```java
@Service
@RequiredArgsConstructor
public class ExamService {
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    // ...
}
```

- `@RequiredArgsConstructor` 會為這些 `final` 欄位自動生成建構子。
- Spring 在啟動時看到唯一的建構子，就會自動把 Repository 注入進來（**建構子注入**）。
- 你**不需要手寫** `public ExamService(ExamRepository repo) {...}` 這個建構子。

---

## 4. Spring Boot 分層架構

本專案遵循標準的分層。理解「為什麼要分層」比記住程式碼更重要。

```
HTTP 請求 (JSON)
   │
   ▼
[ Controller 層 ]  接收/回應 HTTP，先做權限與輸入檢查（薄薄一層）
   │
   ▼
[ Service 層 ]     商業邏輯：評分、核對權限、組合 DTO（核心）
   │
   ▼
[ Repository 層 ]  JPA 介面，自動產生 SQL 存取資料庫
   │
   ▼
[ Entity 層 ]      對應資料庫表格的物件
```

### 各層職責與位置

| 層 | package | 本專案檔案 | 核心職責 |
|----|---------|-----------|---------|
| Controller | `controller` | `AuthController`, `ExamController`, `ResultController`, `UserController`, `TeacherController` | 定義 URL 對應、呼叫 Service |
| Service | `service` | `AuthService`, `ExamService`, `ResultService` | 商業規則，用 `@Transactional` 包交易 |
| Repository | `repository` | `UserRepository`, `ExamRepository`, `QuestionRepository`, `ExamResultRepository` | 資料存取，介面方法即查詢 |
| Entity | `entity` | `User`, `Exam`, `Question`, `ExamResult` | 資料庫表格的 Java 表示 |
| DTO | `dto` | 12 個 record | Controller 與外部之間的資料格式 |

### 為什麼要分層（重點）

1. **職責單一**：改「存哪裡」不動 Service；改「回傳格式」不動 Entity。
2. **安全隔離**：Entity 含密碼、正確答案，透過 DTO 選擇性暴露，避免洩漏。
3. **易測試**：每一層都能獨立寫單元測試。

---

## 5. JPA 實體與關聯

### 5.1 對應資料庫表格

`Question.java`：

```java
@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;
    // ...
}
```

| 註解 | 意思 |
|------|------|
| `@Entity` | 這是 JPA 實體，對應一張表 |
| `@Table(name="questions")` | 指定表格名稱（預設為類別名稱） |
| `@Id` | 主鍵 |
| `@GeneratedValue(IDENTITY)` | 主鍵自動遞增 |
| `@Column(nullable=false)` | 欄位不可為 null，`columnDefinition` 指定 SQL 型別 |

### 5.2 多對一關聯 (@ManyToOne)

`Question.java:18-20`（多個題目屬於一個測驗）：

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "exam_id", nullable = false)
private Exam exam;
```

- `@ManyToOne`：多對一。一個 `Exam` 有多個 `Question`。
- `@JoinColumn(name="exam_id")`：外鍵欄位名。
- `FetchType.LAZY`：**用到才載入**（延遲載入），避免每次查題目都一起載入測驗，效能較好。

### 5.3 防重複作答的唯一約束

`ExamResult.java:8-9`：

```java
@Table(name = "exam_results",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "exam_id"}))
```

- 資料庫層次保證「同一位學生對同一測驗只能有一筆成績」。
- 搭配 Service 層的 `existsByUserAndExam` 檢查，形成雙重保護。

### 5.4 @Builder.Default 設定預設值

`Exam.java:23-25` 和 `Question.java:41-42`：

```java
@Builder.Default
private Integer timeLimit = 60;

@Builder.Default
private Integer points = 1;
```

> 注意：`@Builder` 與「欄位初始值」搭配時，必須再加上 `@Builder.Default` 才會保留預設值，否則 Builder 會忽略初始值給 null。

---

## 6. Repository：介面方法自動產生 SQL

Spring Data JPA 最神奇的地方：**只要照規則命名方法，就不用手寫 SQL**。

`UserRepository.java`：

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findByRoleOrderByClassNameAscDisplayNameAsc(String role);
    List<User> findByRoleAndClassNameOrderByDisplayNameAsc(String role, String className);

    @Query("SELECT DISTINCT u.className FROM User u WHERE u.role = 'ROLE_STUDENT' AND u.className IS NOT NULL ORDER BY u.className")
    List<String> findDistinctStudentClasses();
}
```

### 方法名稱拆解練習

`findByRoleAndClassNameOrderByDisplayNameAsc`

| 片段 | 意思 |
|------|------|
| `findByRole` | where role = ? |
| `AndClassName` | and className = ? |
| `OrderByDisplayNameAsc` | order by display_name asc |

**常用關鍵字：**

| 關鍵字 | 產生的 SQL | 用法 |
|--------|-----------|------|
| `findByXxx` | `where xxx = ?` | 查一筆/多筆 |
| `existsByXxx` | `exists(select ...)` | 是否存在（回傳 boolean） |
| `countByXxx` | `select count(*)` | 計數（回傳 int） |
| `And` / `Or` | `and` / `or` | 組合條件 |
| `OrderByXxxDesc/Asc` | `order by xxx desc/asc` | 排序 |

### @Query：複雜查詢用手寫 JPQL

`UserRepository.java:16-17` 用了 `@Query`，因為「找出所有不重複的班級名稱」用方法名稱規則太長太難，JPQL（HQL）直接寫更清楚。

### 類別階層（繼承關係）

`JpaRepository<T, ID>` → 內建 `findById`、`save`、`deleteById`、`findAll` 等。

---

## 7. Service：商業邏輯與交易

### 7.1 @Service 與 @Transactional

`ExamService.java:25-28`：

```java
@Transactional(readOnly = true)
public List<ExamSummaryResponse> getActiveExams() {
    return examRepository.findByActiveTrueOrderByIdAsc().stream()
            .map(this::toSummary).toList();
}
```

- `@Transactional(readOnly=true)`：唯讀查詢，只開資料庫交易（多筆查詢一致）。
- `@Transactional`（無參數）：寫入操作，方法內任何一步失敗會**整批回滾**，不會只存一半。

**白話：** Transaction = 一個「全部成功或全部失敗」的單位。

### 7.2 Stream + 方法參考轉換 Entity → DTO

`ExamService.java:27-28` 的 `stream().map(this::toSummary).toList()` 是 Java 8 的函式式寫法：

```java
return examRepository.findByActiveTrueOrderByIdAsc().stream()  // 取出所有測驗
        .map(this::toSummary)                                  // 每個轉成 DTO
        .toList();                                             // 收集成 List
```

等同於傳統迴圈：

```java
List<ExamSummaryResponse> result = new ArrayList<>();
for (Exam exam : examRepository.findByActiveTrueOrderByIdAsc()) {
    result.add(toSummary(exam));
}
return result;
```

**為什麼用 Stream：** 更簡潔、更具可讀性，這是現代 Java 慣用寫法。

### 7.3 權限檢查（商品邏輯範例）

`ExamService.java:147-152`：

```java
private void checkOwnership(Exam exam, String username) {
    if (exam.getCreatedBy() == null
            || !exam.getCreatedBy().getUsername().equals(username)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您沒有權限修改此測驗");
    }
}
```

**Note：** 這層檢查確保「只有建立該測驗的教師才能修改」。這是**應用層**的授權，與後端 `@PreAuthorize`（角色層）是不同層次的防護。

### 7.4 評分邏輯（`ResultService.java:44-52`）

```java
int score = 0;
int totalPoints = 0;
for (Question q : questions) {
    totalPoints += q.getPoints();
    String submitted = answers.get(String.valueOf(q.getId()));
    if (q.getCorrectAnswer().equals(submitted)) {
        score += q.getPoints();
    }
}
```

- 逐題累加滿分與得分。
- 學生提交的答案用 `answers` 這個 Map（key=題目ID字串，value=A/B/C/D）。
- 只有 `correctAnswer.equals(submitted)` 才加分。

---

## 8. Controller：接收請求與鑑別

`ExamController.java:40-46` 是「提交作答」的完整範例：

```java
@PostMapping("/{id}/submit")
public ResponseEntity<ResultResponse> submitExam(
        @PathVariable Long id,
        @Valid @RequestBody SubmitRequest req,
        @AuthenticationPrincipal UserDetails user) {
    return ResponseEntity.ok(resultService.submitExam(id, req, user.getUsername()));
}
```

| 參數註解 | 作用 |
|---------|------|
| `@PostMapping("/{id}/submit")` | 對應 HTTP POST 到 `/api/exams/{id}/submit` |
| `@PathVariable Long id` | 把 URL 的 `{id}` 取進方法 |
| `@Valid @RequestBody SubmitRequest req` | 把 JSON 轉成物件，並自動驗證 |
| `@AuthenticationPrincipal UserDetails user` | 取得目前登入的使用者（由 JWT 提供） |

### HTTP 動詞對應 CRUD

| 動詞 | 用途 | 本專案範例 |
|------|------|-----------|
| `@GetMapping` | 查詢 | `getActiveExams`, `takeExam` |
| `@PostMapping` | 新增 | `createExam`, `submitExam` |
| `@PutMapping` | 更新 | `updateExam` |
| `@DeleteMapping` | 刪除 | `deleteExam` |

### 角色限制：@PreAuthorize

`ExamController.java:51`：

```java
@GetMapping("/all")
@PreAuthorize("hasRole('TEACHER')")
public ResponseEntity<List<ExamSummaryResponse>> getAllExams() { ... }
```

- 只有 `ROLE_TEACHER` 角色能呼叫。
- 需要 `SecurityConfig` 中 `@EnableMethodSecurity` 開啟才能使用。

---

## 9. 驗證 (Bean Validation)

### 9.1 範例：`CreateUserRequest.java`

```java
public record CreateUserRequest(
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Size(min = 6) String password,
    @NotBlank @Size(min = 2, max = 100) String displayName,
    @Size(max = 50) String className
) {}
```

| 註解 | 意思 |
|------|------|
| `@NotBlank` | 不能是 null、空白或空字串 |
| `@Size(min,max)` | 字串長度範圍 |
| `@Min` / `@Max` | 數值範圍 |
| `@Pattern(regexp="[ABCD]")` | 必須符合正則（如答案只能是 A/B/C/D） |

### 9.2 觸發方式：Controller 的 @Valid

在 `ExamController.java:43` 的 `@Valid @RequestBody QuestionRequest req`：
- 有 `@Valid`，Spring 才會自動執行欄位驗證。
- 驗證失敗會拋 `MethodArgumentNotValidException`，由 `GlobalExceptionHandler` 統一處理回傳 400。

---

## 10. 安全機制：Spring Security + JWT

### 10.1 登入流程總覽

```
POST /api/auth/login
   │  AuthService.login()
   ▼
authenticationManager.authenticate(...)   ← 用 UserDetailsServiceImpl 查使用者 + 比對 BCrypt 密碼
   │
   ▼
JwtUtil.generateToken(username)           ← 產生 JWT（簽名 + 過期時間）
   │
   ▼
回傳 { token, username, role, displayName, className }
```

### 10.2 產生 Token — `JwtUtil.java:26-33`

```java
public String generateToken(String username) {
    return Jwts.builder()
            .subject(username)                                        // 放使用者名稱
            .issuedAt(new Date())                                     // 簽發時間
            .expiration(new Date(System.currentTimeMillis() + expirationMs)) // 過期時間
            .signWith(key)                                            // 用密鑰簽名（防竄改）
            .compact();
}
```

### 10.3 驗證 Token — `JwtUtil.java:39-46`

```java
public boolean validateToken(String token) {
    try {
        parseClaims(token);
        return true;
    } catch (JwtException | IllegalArgumentException e) {
        return false;   // 簽名錯誤或過期 → 無效
    }
}
```

### 10.4 JwtFilter：攔截每個請求

Spring Security 的機制是**過濾器鏈 (Filter Chain)**。`JwtFilter.java:26-46`：

```java
@Override
protected void doFilterInternal(...) {
    String authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring(7);
        if (jwtUtil.validateToken(token)) {
            String username = jwtUtil.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            // 建立 Authentication 並放入 SecurityContext
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
    }
    filterChain.doFilter(request, response);   // 繼續處理
}
```

**工作流程：**
1. 從 Header 取出 `Bearer <token>`。
2. 驗證簽名與期限。
3. 從 token 解出 username，載入使用者與角色。
4. 放進 `SecurityContext` → 之後 `@PreAuthorize` 與 `@AuthenticationPrincipal` 才能拿到身分。

### 10.5 SecurityConfig 設定

`SecurityConfig.java:31-43`：

```java
http
    .csrf(AbstractHttpConfigurer::disable)              // 無狀態 API，關 CSRF
    .cors(cors -> cors.configurationSource(corsConfigurationSource()))
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 無 Session
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**","/*","/assets/**").permitAll()  // 公開
        .anyRequest().authenticated()                                   // 其餘需登入
    )
    .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
```

---

## 11. 例外處理

`GlobalExceptionHandler.java` 用 `@RestControllerAdvice`（全域例外攔截器）集中處理所有例外。

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(errorBody(ex.getReason()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied() {
        return ResponseEntity.status(403).body(errorBody("權限不足，此操作僅限教師"));
    }
}
```

- 各層丟出 `ResponseStatusException(code, message)` → 這裡統一回傳對應 HTTP 狀態碼 + JSON。
- 好處：**不用在每個 Controller 寫 try/catch**。

Service 中範例（`ExamService.java:133-140`）：

```java
private Exam findExamById(Long id) {
    return examRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到測驗"));
}
```

---

## 12. 總結與下一步

### 你現在應該能看懂

| 面向 | 你學到 |
|------|--------|
| 資料 | JPA Entity、關聯註解、Builder |
| 存取 | Repository 方法名稱規則、@Query |
| 商業 | Service 分層、@Transactional、評分邏輯 |
| 對外 | Controller、@Valid 驗證、DTO |
| 安全 | JWT 產生/驗證、過濾器、@PreAuthorize |

### 動手練習建議

1. 讀一遍 `ResultService.submitExam()`，畫出執行流程圖。
2. 在 `ExamService` 加一個「列出某教師建立的測驗」方法（對應 `ExamRepository.findByCreatedByOrderByIdDesc`）。
3. 用 curl 登入取得 token，走完 `take` → `submit` 流程，觀察 401/403/409 的差別。

### 對應的延伸學習文件

| 主題 | 文件 |
|------|------|
| 完整 API | `docs/02-api-reference.md` |
| JWT 細節 | `docs/03-jwt-auth-guide.md` |
| 題目練習 | `docs/04-student-exercises.md` |
