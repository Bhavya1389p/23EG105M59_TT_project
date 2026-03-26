package com.smartquizzer.controller;

import com.smartquizzer.model.Material;
import com.smartquizzer.model.Quiz;
import com.smartquizzer.repository.MaterialRepository;
import com.smartquizzer.repository.QuizRepository;
import com.smartquizzer.service.PdfService;
import com.smartquizzer.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}) // Basic CORS, also handled in WebConfig
public class QuizController {

    private final PdfService pdfService;
    private final QuizService quizService;
    private final MaterialRepository materialRepository;
    private final QuizRepository quizRepository;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title) {
        try {
            String content = pdfService.extractText(file);
            if (content.isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", "Failed to extract text from file. Please ensure it is not empty or corrupted."));
            }

            Material material = new Material();
            material.setTitle(title);
            material.setContent(content);
            material.setFileType(file.getContentType());
            material = materialRepository.save(material);

            return ResponseEntity.ok(material);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(java.util.Collections.singletonMap("error", "Processing Error: " + e.getMessage()));
        }
    }

    @PostMapping("/upload-text")
    public ResponseEntity<?> uploadText(@RequestBody java.util.Map<String, String> payload) {
        try {
            String title = payload.get("title");
            String content = payload.get("content");
            if (content == null || content.isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", "Missing content"));
            }

            Material material = new Material();
            material.setTitle(title != null ? title : "Pasted Text");
            material.setContent(content);
            material.setFileType("text/plain");
            material = materialRepository.save(material);

            return ResponseEntity.ok(java.util.Collections.singletonMap("materialId", material.getId()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/generate-quiz/{materialId}")
    public ResponseEntity<?> generateQuiz(
            @PathVariable String materialId,
            @RequestParam(defaultValue = "10") int count) {
        
        // Return cached quiz if exists
        Optional<Quiz> cached = quizRepository.findByMaterialId(materialId);
        if (cached.isPresent()) {
            return ResponseEntity.ok(cached.get());
        }

        Optional<Material> material = materialRepository.findById(materialId);
        if (material.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Quiz quiz = quizService.generateQuiz(material.get(), count);
        return ResponseEntity.ok(quiz);
    }

    @GetMapping("/quiz/{id}")
    public ResponseEntity<Quiz> getQuiz(@PathVariable String id) {
        return quizRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private final com.smartquizzer.repository.QuizAttemptRepository attemptRepository;

    @PostMapping("/submit-quiz")
    public ResponseEntity<?> submitQuiz(@RequestBody com.smartquizzer.model.QuizAttempt attempt) {
        try {
            // Calculate score if not provided
            int score = (int) attempt.getAnswers().stream().filter(com.smartquizzer.model.QuizAttempt.UserAnswer::isCorrect).count();
            attempt.setScore(score);
            attempt.setTotalQuestions(attempt.getAnswers().size());
            
            com.smartquizzer.model.QuizAttempt saved = attemptRepository.save(attempt);
            return ResponseEntity.ok(java.util.Collections.singletonMap("attemptId", saved.getId()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}
