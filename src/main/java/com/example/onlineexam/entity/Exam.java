package com.example.onlineexam.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    /** 測驗時間限制（分鐘） */
    @Builder.Default
    private Integer timeLimit = 60;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Builder.Default
    private boolean active = true;

    /** 是否允許考生重複作答（false＝每人僅限作答一次） */
    @Builder.Default
    private Boolean allowRetake = true;

    /** 是否對考生隱藏成績（教師仍可查看） */
    @Builder.Default
    private Boolean hideResult = false;

    /** NULL 安全：預設允許重複作答 */
    public boolean isAllowRetake() {
        return allowRetake == null || allowRetake;
    }

    /** NULL 安全：預設不隱藏成績 */
    public boolean isHideResult() {
        return Boolean.TRUE.equals(hideResult);
    }
}
