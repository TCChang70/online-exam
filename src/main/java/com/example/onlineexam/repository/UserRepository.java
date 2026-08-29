package com.example.onlineexam.repository;

import com.example.onlineexam.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

    List<User> findByRoleOrderByClassNameAscDisplayNameAsc(String role);
    List<User> findByRoleAndClassNameOrderByDisplayNameAsc(String role, String className);

    @Query("SELECT DISTINCT u.className FROM User u WHERE u.role = 'ROLE_STUDENT' AND u.className IS NOT NULL ORDER BY u.className")
    List<String> findDistinctStudentClasses();
}
