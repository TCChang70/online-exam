package com.example.onlineexam.repository;

import com.example.onlineexam.entity.Exam;
import com.example.onlineexam.entity.ExamResult;
import com.example.onlineexam.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    List<ExamResult> findByUserOrderBySubmittedAtDesc(User user);
    List<ExamResult> findByExamOrderByScoreDesc(Exam exam);
    Optional<ExamResult> findByUserAndExam(User user, Exam exam);
    boolean existsByUserAndExam(User user, Exam exam);

    @Transactional
    void deleteByExam(Exam exam);

    @Transactional
    void deleteByUser(User user);
}
