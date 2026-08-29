package com.example.onlineexam.controller;

import com.example.onlineexam.dto.*;
import com.example.onlineexam.entity.User;
import com.example.onlineexam.repository.ExamRepository;
import com.example.onlineexam.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<TeacherResponse>> getTeachers() {
        return ResponseEntity.ok(
                userRepository.findByRoleOrderByClassNameAscDisplayNameAsc("ROLE_TEACHER").stream()
                        .map(u -> new TeacherResponse(u.getId(), u.getUsername(), u.getDisplayName()))
                        .toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<TeacherResponse> createTeacher(@Valid @RequestBody CreateUserRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "帳號已存在");
        }
        User user = userRepository.save(User.builder()
                .username(req.username())
                .password(passwordEncoder.encode(req.password()))
                .displayName(req.displayName())
                .role("ROLE_TEACHER")
                .build());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new TeacherResponse(user.getId(), user.getUsername(), user.getDisplayName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<TeacherResponse> updateTeacher(
            @PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {
        User user = findTeacher(id);
        user.setDisplayName(req.displayName());
        if (req.newPassword() != null && !req.newPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.newPassword()));
        }
        userRepository.save(user);
        return ResponseEntity.ok(new TeacherResponse(user.getId(), user.getUsername(), user.getDisplayName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteTeacher(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        User user = findTeacher(id);
        if (user.getUsername().equals(currentUser.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "無法刪除自己的帳號");
        }
        if (examRepository.existsByCreatedBy(user)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "此教師尚有測驗，請先刪除後再移除帳號");
        }
        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }

    private User findTeacher(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到教師"));
        if (!user.getRole().equals("ROLE_TEACHER")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "此帳號不是教師");
        }
        return user;
    }
}
