# 03 — JWT 身份驗證說明

## 什麼是 JWT？

**JWT（JSON Web Token）** 是一種**無狀態**的身份驗證機制。

傳統 Session 方式：伺服器需要記住每個登入的使用者。
JWT 方式：Token 本身就帶有使用者資訊，伺服器**不需要儲存 Session**。

---

## Token 結構

JWT 由三段 Base64Url 編碼的字串組成，以 `.` 分隔：

```
eyJhbGciOiJIUzI1NiJ9  .  eyJzdWIiOiJzdHVkZW50MSIsImlhdCI6MTcyNTAwMDAwMH0  .  abc123signature
      Header                           Payload                                    Signature
```

| 段落 | 內容 |
|------|------|
| Header | 演算法（`HS256`）|
| Payload | `sub`（使用者名稱）、`iat`（簽發時間）、`exp`（過期時間） |
| Signature | 用 secret key 簽名，防止竄改 |

> 可到 [https://jwt.io](https://jwt.io) 貼上 Token 查看解碼內容（教學用，請勿用於生產環境）

---

## 驗證流程

```
Client（瀏覽器/App）              Server
       │                              │
       │── POST /api/auth/login ──────▶│
       │   { username, password }      │  1. 驗證帳密（BCrypt 比對）
       │                              │  2. 產生 JWT Token
       │◀── { token: "eyJ..." } ───────│
       │                              │
       │── GET /api/exams ────────────▶│
       │   Authorization: Bearer eyJ..│  3. JwtFilter 解析 Token
       │                              │  4. 驗證 signature & 過期時間
       │                              │  5. 將使用者資訊存入 SecurityContext
       │◀── [ 測驗資料 ] ──────────────│
       │                              │
       │── POST /api/exams （無 Token）▶│
       │                              │  Token 驗證失敗
       │◀── 401 Unauthorized ──────────│
```

---

## 程式碼解說

### JwtUtil — 產生與驗證 Token
```java
// 產生 Token（登入成功後呼叫）
public String generateToken(String username) {
    return Jwts.builder()
            .subject(username)        // 儲存使用者名稱
            .issuedAt(new Date())     // 簽發時間
            .expiration(...)          // 過期時間（預設 24 小時）
            .signWith(key)            // HMAC-SHA256 簽名
            .compact();
}

// 驗證 Token（每個請求都會檢查）
public boolean validateToken(String token) {
    try {
        parseClaims(token);  // 失敗會拋出 JwtException
        return true;
    } catch (JwtException e) {
        return false;        // 過期、竄改、格式錯誤都會到這裡
    }
}
```

### JwtFilter — 每個請求的攔截器
```java
@Override
protected void doFilterInternal(HttpServletRequest request, ...) {
    // 1. 讀取 Authorization header
    String authHeader = request.getHeader("Authorization");

    // 2. 格式必須是 "Bearer <token>"
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring(7);

        // 3. 驗證並解析 Token
        if (jwtUtil.validateToken(token)) {
            String username = jwtUtil.extractUsername(token);

            // 4. 載入使用者資訊，注入到 Spring Security 的 Context
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            SecurityContextHolder.getContext().setAuthentication(...);
        }
    }

    // 5. 繼續執行後續的 Filter 和 Controller
    filterChain.doFilter(request, response);
}
```

### SecurityConfig — 安全規則設定
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()  // 登入/註冊不需 Token
    .anyRequest().authenticated()                 // 其他都需要
)
.addFilterBefore(jwtFilter, ...)  // JWT Filter 在 Spring 的驗證前執行
```

---

## 角色與權限

```java
// Controller 方法加上 @PreAuthorize，只有教師能呼叫
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('TEACHER')")
public ResponseEntity<Void> deleteExam(...) { ... }
```

| Token 中的角色 | 可存取 |
|--------------|--------|
| ROLE_STUDENT | GET /api/exams、GET /api/exams/{id}/take、POST /api/exams/{id}/submit、GET /api/results/my |
| ROLE_TEACHER | 以上全部 + 所有管理端點 |

---

## 常見問題

| 問題 | 原因 | 解法 |
|------|------|------|
| Token 放哪裡？ | HTTP Header | `Authorization: Bearer <token>` |
| Token 過期了怎麼辦？ | 24 小時後失效 | 重新呼叫 `/api/auth/login` |
| 忘記加 Bearer 前綴 | 格式錯誤 | 確認是 `Bearer ` + 空格 + token |
| 500 錯誤 WeakKeyException | Secret 太短 | application.properties 中 secret 需 ≥ 32 字元 |
| 403 而非 401 | Token 有效但無此角色 | 確認帳號角色是否正確 |
