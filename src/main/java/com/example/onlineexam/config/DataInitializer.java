package com.example.onlineexam.config;

import com.example.onlineexam.entity.*;
import com.example.onlineexam.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("資料庫已有資料，跳過初始化");
            return;
        }

        // 建立預設帳號
        User teacher = userRepository.save(User.builder()
                .username("teacher")
                .password(passwordEncoder.encode("password123"))
                .displayName("王老師")
                .role("ROLE_TEACHER")
                .build());

        userRepository.save(User.builder()
                .username("student1")
                .password(passwordEncoder.encode("password123"))
                .displayName("小明")
                .className("資工三甲")
                .role("ROLE_STUDENT")
                .build());

        userRepository.save(User.builder()
                .username("student2")
                .password(passwordEncoder.encode("password123"))
                .displayName("小華")
                .className("資工三乙")
                .role("ROLE_STUDENT")
                .build());

        userRepository.save(User.builder()
                .username("student3")
                .password(passwordEncoder.encode("password123"))
                .displayName("小玲")
                .className("資工三甲")
                .role("ROLE_STUDENT")
                .build());

        userRepository.save(User.builder()
                .username("student4")
                .password(passwordEncoder.encode("password123"))
                .displayName("小強")
                .className("資工三乙")
                .role("ROLE_STUDENT")
                .build());

        log.info("已建立預設帳號：teacher / student1-4（密碼均為 password123）");

        // 建立示範測驗
        Exam exam = examRepository.save(Exam.builder()
                .title("Java 基礎概念測驗")
                .description("測試 Java 物件導向與 Spring Boot 基礎概念的了解程度")
                .timeLimit(30)
                .createdBy(teacher)
                .active(true)
                .build());

        questionRepository.save(Question.builder()
                .exam(exam)
                .questionText("Java 中，哪個關鍵字用於建立物件實例？")
                .optionA("create").optionB("new").optionC("instance").optionD("make")
                .correctAnswer("B").points(2).build());

        questionRepository.save(Question.builder()
                .exam(exam)
                .questionText("以下哪個不是 Java 的基本資料型別（Primitive Type）？")
                .optionA("int").optionB("boolean").optionC("String").optionD("double")
                .correctAnswer("C").points(2).build());

        questionRepository.save(Question.builder()
                .exam(exam)
                .questionText("@Override 註解的用途是？")
                .optionA("宣告靜態方法")
                .optionB("標記該方法覆寫了父類別的方法")
                .optionC("設定方法的存取權限")
                .optionD("讓方法不可被繼承")
                .correctAnswer("B").points(2).build());

        questionRepository.save(Question.builder()
                .exam(exam)
                .questionText("ArrayList 與 LinkedList 的主要差異是？")
                .optionA("ArrayList 使用鏈結串列，LinkedList 使用動態陣列")
                .optionB("ArrayList 使用動態陣列，LinkedList 使用鏈結串列")
                .optionC("兩者底層實作相同")
                .optionD("ArrayList 不允許重複元素")
                .correctAnswer("B").points(3).build());

        questionRepository.save(Question.builder()
                .exam(exam)
                .questionText("Spring Boot 中，@RestController 等同於？")
                .optionA("@Controller")
                .optionB("@Service + @Repository")
                .optionC("@Controller + @ResponseBody")
                .optionD("@Component + @RequestMapping")
                .correctAnswer("C").points(3).build());

        log.info("已建立示範測驗「Java 基礎概念測驗」— 5 題，共 12 分");
    }
}
