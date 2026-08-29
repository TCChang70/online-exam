package com.example.onlineexam.repository;

import com.example.onlineexam.entity.Exam;
import com.example.onlineexam.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByExamOrderByIdAsc(Exam exam);
    int countByExam(Exam exam);

    @Transactional
    void deleteByExam(Exam exam);
}
