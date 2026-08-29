package com.example.onlineexam.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String displayName;

    /** ROLE_STUDENT 或 ROLE_TEACHER */
    @Column(nullable = false)
    private String role;

    /** 學生所屬班級（教師此欄位為 null） */
    private String className;
}
