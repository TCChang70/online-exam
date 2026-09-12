# =============================================
# Stage 1：使用 Maven 編譯專案，產出 JAR 檔
# =============================================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /online-exam

# 複製完整原始碼並編譯（跳過測試以縮短建構時間）
COPY . .
RUN mvn clean package -DskipTests

# =============================================
# Stage 2：只帶 JAR + 資料庫快照到精簡的 JRE 執行環境
# =============================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /online-exam

# 從 Stage 1 複製編譯好的 JAR（版本號用萬用字元處理）
COPY --from=builder /online-exam/target/*.jar online-exam.jar

# 帶入既有 SQLite 資料庫快照（含 30 題 JavaScript 測驗等既有資料）
COPY --from=builder /online-exam/online-exam.db /online-exam/seed/online-exam.db

# 啟動腳本：第一次啟動時把資料快照複製到可寫的 data 目錄
COPY docker/entrypoint.sh /online-exam/entrypoint.sh
RUN chmod +x /online-exam/entrypoint.sh

# 建立可寫的資料目錄（可用 docker-compose volume 或 Render persistent disk 掛載以持久化）
RUN mkdir -p /online-exam/data

# 資料庫路徑透過環境變數指向可寫的 data 目錄（可被 docker-compose / Render 覆寫）
ENV SPRING_DATASOURCE_URL=jdbc:sqlite:/online-exam/data/online-exam.db \
    APP_JWT_SECRET=online-exam-secret-key-must-be-32chars!

# 容器啟動時執行帶資料播種邏輯的腳本
ENTRYPOINT ["/online-exam/entrypoint.sh"]

# 宣告服務使用的 port（Render 預設讀取此值）
EXPOSE 8900
