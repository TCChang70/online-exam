package com.example.onlineexam.controller;

import com.example.onlineexam.dto.*;
import com.example.onlineexam.entity.User;
import com.example.onlineexam.repository.ExamResultRepository;
import com.example.onlineexam.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final ExamResultRepository examResultRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<StudentResponse>> getStudents(
            @RequestParam(required = false) String className) {
        var users = (className != null && !className.isBlank())
                ? userRepository.findByRoleAndClassNameOrderByDisplayNameAsc("ROLE_STUDENT", className)
                : userRepository.findByRoleOrderByClassNameAscDisplayNameAsc("ROLE_STUDENT");
        return ResponseEntity.ok(users.stream()
                .map(u -> new StudentResponse(u.getId(), u.getUsername(), u.getDisplayName(), u.getClassName()))
                .toList());
    }

    @GetMapping("/classes")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<String>> getClasses() {
        return ResponseEntity.ok(userRepository.findDistinctStudentClasses());
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<StudentResponse> createStudent(@Valid @RequestBody CreateUserRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "帳號已存在");
        }
        User user = userRepository.save(User.builder()
                .username(req.username())
                .password(passwordEncoder.encode(req.password()))
                .displayName(req.displayName())
                .className(req.className())
                .role("ROLE_STUDENT")
                .build());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new StudentResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getClassName()));
    }

    /** 批次匯入學生帳號：跳過已存在/批次內重複的帳號，其餘建立 */
    @PostMapping("/batch")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<BatchStudentsResponse> batchImportStudents(
            @Valid @RequestBody BatchStudentsRequest req) {
        List<StudentResponse> created = new ArrayList<>();
        List<String> duplicates = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (CreateUserRequest r : req.students()) {
            String username = r.username() == null ? "" : r.username().trim();
            if (seen.contains(username) || userRepository.existsByUsername(username)) {
                duplicates.add(username);
                continue;
            }
            seen.add(username);
            User user = userRepository.save(User.builder()
                    .username(r.username())
                    .password(passwordEncoder.encode(r.password()))
                    .displayName(r.displayName())
                    .className(r.className())
                    .role("ROLE_STUDENT")
                    .build());
            created.add(new StudentResponse(user.getId(), user.getUsername(),
                    user.getDisplayName(), user.getClassName()));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new BatchStudentsResponse(created.size(), created, duplicates));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<StudentResponse> updateStudent(
            @PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {
        User user = findStudent(id);
        user.setDisplayName(req.displayName());
        user.setClassName(req.className());
        if (req.newPassword() != null && !req.newPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.newPassword()));
        }
        userRepository.save(user);
        return ResponseEntity.ok(
                new StudentResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getClassName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        User user = findStudent(id);
        examResultRepository.deleteByUser(user);
        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }

    private User findStudent(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到學生"));
        if (!user.getRole().equals("ROLE_STUDENT")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "此帳號不是學生");
        }
        return user;
    }
}
