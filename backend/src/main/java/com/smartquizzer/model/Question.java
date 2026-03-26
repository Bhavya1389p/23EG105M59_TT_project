package com.smartquizzer.model;

import lombok.Data;
import java.util.List;

@Data
public class Question {
    private String type; // mcq, true-false, short-answer, fill-blank
    private String question;
    private String statement; // for true-false
    private String sentence; // for fill-blank
    private List<String> options; // for mcq
    private Object correctAnswer; // can be index (Integer), boolean, or string
    private List<String> acceptedAnswers; // for short-answer
    private String explanation;
    private String difficulty; // easy, medium, hard
    private String topic;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getStatement() { return statement; }
    public void setStatement(String statement) { this.statement = statement; }
    public String getSentence() { return sentence; }
    public void setSentence(String sentence) { this.sentence = sentence; }
    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }
    public Object getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(Object correctAnswer) { this.correctAnswer = correctAnswer; }
    public List<String> getAcceptedAnswers() { return acceptedAnswers; }
    public void setAcceptedAnswers(List<String> acceptedAnswers) { this.acceptedAnswers = acceptedAnswers; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
}
