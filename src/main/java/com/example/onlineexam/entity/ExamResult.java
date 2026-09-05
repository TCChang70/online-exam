package com.example.onlineexam.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    /** 學生作答記錄，JSON 格式：{"1":"A","2":"C",...} */
    @Column(columnDefinition = "TEXT")
    private String answers;

    private Integer score;
    private Integer totalPoints;
    private LocalDateTime submittedAt;

    /** 軟刪除旗標：true＝教師已刪除（資料保留但列表隱藏） */
    @Builder.Default
    private Boolean deleted = false;

    /** NULL 安全：預設為未刪除 */
    public boolean isDeleted() {
        return Boolean.TRUE.equals(deleted);
    }
}
