"use client"

import type { Question } from "@/lib/quiz-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  onAnswer: (answer: string | number | boolean, timeSpent: number) => void
  showFeedback: boolean
  isCorrect?: boolean
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showFeedback,
  isCorrect,
}: QuestionCardProps) {
  console.log(`Rendering question ${questionNumber}:`, question)

  const [selectedAnswer, setSelectedAnswer] = useState<string | number | boolean | null>(null)
  const [textAnswer, setTextAnswer] = useState("")
  const [timeSpent, setTimeSpent] = useState(0)
  const [hasAnswered, setHasAnswered] = useState(false)

  useEffect(() => {
    if (!showFeedback && !hasAnswered) {
      const interval = setInterval(() => {
        setTimeSpent((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [showFeedback, hasAnswered])

  const handleSubmit = () => {
    if (selectedAnswer !== null || textAnswer) {
      const answer = textAnswer || selectedAnswer
      if (answer !== null) {
        setHasAnswered(true)
        onAnswer(answer, timeSpent)
      }
    }
  }

  const difficultyColor = {
    easy: "border-green-500/50 text-green-400 bg-green-500/5",
    medium: "border-yellow-500/50 text-yellow-400 bg-yellow-500/5",
    hard: "border-red-500/50 text-red-400 bg-red-500/5",
  }

  return (
    <Card className="glass-card shadow-lg border-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60">
              Question {questionNumber} / {totalQuestions}
            </span>
            <Badge variant="outline" className={`${difficultyColor[question.difficulty as keyof typeof difficultyColor]} border-px px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
              {question.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-secondary">
            <Clock className="h-3 w-3" />
            <span>{timeSpent}s</span>
          </div>
        </div>
        {question.type === "fill-blank" ? (
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-primary/70">Complete the sentence:</p>
            <CardTitle className="text-xl leading-relaxed font-bold tracking-tight">
              {question.sentence
                ? question.sentence.split("[BLANK]").map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="inline-block mx-1 px-3 py-0.5 rounded-md border-b-2 border-primary bg-primary/10 text-primary font-mono text-lg">
                          ________
                        </span>
                      )}
                    </span>
                  ))
                : <span className="text-muted-foreground italic">Fill in the blank question</span>
              }
            </CardTitle>
          </div>
        ) : (
          <CardTitle className="text-2xl leading-tight font-bold tracking-tight">
            {question.type === "mcq" && (question.question || "Question text not available")}
            {question.type === "true-false" && (question.statement || "Statement not available")}
            {question.type === "short-answer" && (question.question || "Question text not available")}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* MCQ Options */}
        {question.type === "mcq" && (
          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(value) => setSelectedAnswer(Number.parseInt(value))}
            disabled={showFeedback}
            className="grid gap-3"
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 rounded-xl border p-4 transition-all duration-300 ${
                  showFeedback
                    ? index === question.correctAnswer
                      ? "border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                      : selectedAnswer === index && !isCorrect
                        ? "border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                        : "border-white/5 opacity-50"
                    : "border-white/10 hover:border-primary/50 hover:bg-white/5 cursor-pointer"
                }`}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} className="border-white/20" />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base font-medium">
                  {option}
                </Label>
                {showFeedback && index === question.correctAnswer && (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                )}
                {showFeedback && selectedAnswer === index && !isCorrect && <XCircle className="h-5 w-5 text-red-400" />}
              </div>
            ))}
          </RadioGroup>
        )}

        {/* True/False Options */}
        {question.type === "true-false" && (
          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(value) => setSelectedAnswer(value === "true")}
            disabled={showFeedback}
            className="grid gap-3"
          >
            {[true, false].map((value) => (
              <div
                key={value.toString()}
                className={`flex items-center space-x-3 rounded-xl border p-4 transition-all duration-300 ${
                  showFeedback
                    ? value === question.correctAnswer
                      ? "border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                      : selectedAnswer === value && !isCorrect
                        ? "border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                        : "border-white/5 opacity-50"
                    : "border-white/10 hover:border-primary/50 hover:bg-white/5 cursor-pointer"
                }`}
              >
                <RadioGroupItem value={value.toString()} id={`tf-${value}`} className="border-white/20" />
                <Label htmlFor={`tf-${value}`} className="flex-1 cursor-pointer text-base font-medium">
                  {value ? "True" : "False"}
                </Label>
                {showFeedback && value === question.correctAnswer && (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                )}
                {showFeedback && selectedAnswer === value && !isCorrect && <XCircle className="h-5 w-5 text-red-400" />}
              </div>
            ))}
          </RadioGroup>
        )}

        {/* Short Answer Input */}
        {(question.type === "short-answer" || question.type === "fill-blank") && (
          <Input
            placeholder="Type your answer..."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={showFeedback}
            className="h-14 text-lg border-white/10 bg-white/5 focus:border-primary/50 transition-all"
          />
        )}

        {/* Feedback Section */}
        {showFeedback && (
          <div
            className={`rounded-xl p-5 border ${isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"} animate-in fade-in slide-in-from-top-2 duration-300`}
          >
            <div className="mb-3 flex items-center gap-2 font-black uppercase tracking-widest text-sm">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="text-green-400">Excellent!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400">Not Quite</span>
                </>
              )}
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 font-medium italic">{question.explanation}</p>
            {!isCorrect && (question.type === "short-answer" || question.type === "fill-blank") && (
              <div className="mt-4 p-3 rounded-lg bg-black/20 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  The Correct Answer:
                </p>
                <p className="text-lg font-bold text-secondary">
                  {(question as any).correctAnswer || (question as any).acceptedAnswers?.[0]}
                </p>
              </div>
            )}
          </div>
        )}

        {!showFeedback && (
          <Button 
            onClick={handleSubmit} 
            disabled={selectedAnswer === null && !textAnswer} 
            className="w-full btn-primary font-bold text-lg h-14"
          >
            SUBMIT ANSWER
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
