package com.smartquizzer.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartquizzer.model.Material;
import com.smartquizzer.model.Question;
import com.smartquizzer.model.Quiz;
import com.smartquizzer.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.ChatClient;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final ObjectMapper objectMapper;

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Autowired
    public QuizService(QuizRepository quizRepository, ObjectMapper objectMapper) {
        this.quizRepository = quizRepository;
        this.objectMapper = objectMapper;
    }

    public Quiz generateQuiz(Material material, int questionCount) {
        System.out.println("[v0] Generating quiz for material: " + material.getTitle() + " with " + questionCount + " questions.");
        System.out.println("[v0] Content length: " + (material.getContent() != null ? material.getContent().length() : 0));
        
        if (apiKey == null || apiKey.isEmpty()) {
            System.err.println("[v0] CRITICAL: API Key is null or empty!");
            return createFallbackQuiz(material, "API Key is missing.");
        } else {
            String masked = apiKey.substring(0, Math.min(4, apiKey.length())) + "****";
            System.out.println("[v0] Using API Key starting with: " + masked);
        }

        if (material.getContent() == null || material.getContent().length() < 10) {
            System.err.println("[v0] Material content is too short for quiz generation.");
            return createFallbackQuiz(material, "Material content is too short for AI generation.");
        }

        String prompt = String.format("""
            You are an expert educator. Based on the following study material, generate a quiz with EXACTLY %d questions.
            
            Material Content:
            %s
            
            REQUIREMENTS:
            1. Generate EXACTLY %d questions. Do not generate fewer and do not generate more.
            2. Mix question types: "mcq" (Multiple Choice), "true-false", "short-answer", and "fill-blank".
            3. For "mcq": provide exactly 4 options. "correctAnswer" is the index (0-3).
            4. For "true-false": "correctAnswer" is a Boolean.
            5. For "short-answer": provide a "question" and an "acceptedAnswers" array of strings.
            6. For "fill-blank": provide a "sentence" containing "[BLANK]" and "correctAnswer" as a String.
            7. Every question must have an "explanation", "difficulty" (easy/medium/hard), and a "topic" string.
            8. Return ONLY a valid JSON array of objects.
            """, questionCount, material.getContent(), questionCount);

        // Use only the correct Gemini model and version
        String[] models = {"gemini-pro"};
        String[] versions = {"v1beta"};
        
        String trimmedKey = apiKey.trim();
        String lastErrorMessage = "No models attempted.";

        for (String model : models) {
            for (String version : versions) {
                try {
                    return callGeminiApi(prompt, trimmedKey, version, model, material.getId(), material.getTitle(), questionCount);
                } catch (Exception e) {
                    lastErrorMessage = e.getMessage();
                    System.err.println("[v0] Failed with " + model + " (" + version + "): " + lastErrorMessage);
                }
            }
        }

        System.err.println("[v0] All models and versions failed. Last error: " + lastErrorMessage);
        return createFallbackQuiz(material, "Technical Error from Gemini: " + lastErrorMessage);
    }

    private Quiz callGeminiApi(String prompt, String apiKey, String version, String model, String materialId, String title, int questionCount) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        
        Map<String, Object> parts = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(parts));
        
        // Use standard camelCase for top level and common JSON request format
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(content)
        );
        
        String jsonBody = objectMapper.writeValueAsString(requestBody);
        
        System.out.println("[v0] Sending request to Gemini API (" + model + ", " + version + ")...");
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://generativelanguage.googleapis.com/" + version + "/models/" + model + ":generateContent?key=" + apiKey))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();
            
        HttpResponse<String> httpResponse = client.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (httpResponse.statusCode() != 200) {
            System.err.println("[v0] API Error (" + version + ", Status " + httpResponse.statusCode() + "): " + httpResponse.body());
            throw new RuntimeException("API error: " + httpResponse.body());
        }
        
        com.fasterxml.jackson.databind.JsonNode rootNode = objectMapper.readTree(httpResponse.body());
        com.fasterxml.jackson.databind.JsonNode candidates = rootNode.path("candidates");
        
        if (candidates.isEmpty()) {
            throw new RuntimeException("No candidates returned from Gemini");
        }

        String responseText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        
        // Strictly extract the JSON array
        int startIndex = responseText.indexOf('[');
        int endIndex = responseText.lastIndexOf(']');
        if (startIndex >= 0 && endIndex >= startIndex) {
            responseText = responseText.substring(startIndex, endIndex + 1);
        } else {
            throw new RuntimeException("Invalid JSON structure in AI response");
        }
        
        List<Question> questions = objectMapper.readValue(responseText, new TypeReference<List<Question>>() {});
        
        if (questions.size() > questionCount) {
            questions = questions.subList(0, questionCount);
        }
        
        Quiz quiz = new Quiz();
        quiz.setMaterialId(materialId);
        quiz.setTitle(title);
        quiz.setQuestions(questions);
        quiz.setCreatedAt(LocalDateTime.now());
        
        return quizRepository.save(quiz);
    }

    private Quiz createFallbackQuiz(Material material, String reason) {
        System.out.println("[v0] Creating fallback quiz due to: " + reason);
        Quiz quiz = new Quiz();
        quiz.setMaterialId(material.getId());
        quiz.setTitle(material.getTitle() + " (Fallback)");
        
        Question q = new Question();
        q.setType("true-false");
        q.setStatement("DIAGNOSTIC ERROR: " + reason);
        q.setCorrectAnswer(true);
        q.setExplanation("This is a diagnostic quiz. Please check your API key/quota.");
        q.setDifficulty("easy");
        
        quiz.setQuestions(Collections.singletonList(q));
        return quizRepository.save(quiz);
    }
}

