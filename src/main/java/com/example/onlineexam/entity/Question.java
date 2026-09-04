package com.example.onlineexam.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(nullable = false)
    private String optionA;

    @Column(nullable = false)
    private String optionB;

    @Column(nullable = false)
    private String optionC;

    @Column(nullable = false)
    private String optionD;

    /** 選項 E（選用，考題最多可有 9 個選項 A-I） */
    @Column
    private String optionE;

    /** 選項 F（選用） */
    @Column
    private String optionF;

    /** 選項 G（選用） */
    @Column
    private String optionG;

    /** 選項 H（選用） */
    @Column
    private String optionH;

    /** 選項 I（選用） */
    @Column
    private String optionI;

    /** 是否為多選題（true 時 correctAnswer 以逗號分隔多個答案，如 "B,F"） */
    @Builder.Default
    private Boolean multiSelect = false;

    /** 安全讀取多選旗標：DB 中 NULL 一律視為 false */
    public boolean isMultiSelect() {
        return Boolean.TRUE.equals(multiSelect);
    }

    /** 正確答案：單選題為 A、B、C、D、E、F、G、H 或 I；多選題為逗號分隔，如 "A,C" */
    @Column(nullable = false)
    private String correctAnswer;

    @Builder.Default
    private Integer points = 1;
}
