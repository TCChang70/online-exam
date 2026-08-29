package com.example.onlineexam.repository;

import com.example.onlineexam.entity.Exam;
import com.example.onlineexam.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByActiveTrueOrderByIdAsc();
    List<Exam> findByCreatedByOrderByIdDesc(User user);
    boolean existsByCreatedBy(User user);
}
