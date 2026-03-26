"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { QuestionCard } from "@/components/question-card"
import type { Question } from "@/lib/quiz-types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, ArrowRight } from "lucide-react"

interface Answer {
  questionIndex: number
  userAnswer: string | number | boolean
  isCorrect: boolean
  timeSpent: number
}

export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [quiz, setQuiz] = useState<{ id: string; materialId: string; title: string; questions: Question[] } | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)
  const [consecutiveWrong, setConsecutiveWrong] = useState(0)

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        console.log("[v0] Fetching quiz details:", resolvedParams.quizId)
        const response = await fetch(`/api/quiz/${resolvedParams.quizId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch quiz")
        }

        // Sort questions by difficulty for adaptive progression
        const sortedQuestions = [...data.questions].sort((a, b) => {
          const diffOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 }
          return diffOrder[a.difficulty as string] - diffOrder[b.difficulty as string]
        })

        console.log("Fetched quiz questions:", sortedQuestions.length)
        sortedQuestions.forEach((q, i) => {
          console.log(`Question ${i + 1} (${q.type}):`, q.type === 'mcq' ? q.question : q.type === 'true-false' ? q.statement : q.type === 'short-answer' ? q.question : q.sentence)
        })

        setQuiz({ ...data, questions: sortedQuestions })
      } catch (error) {
        console.error("Fetch error:", error)
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuiz()
  }, [resolvedParams.quizId, router])

  const checkAnswer = (userAnswer: string | number | boolean, question: Question): boolean => {
    if (question.type === "mcq") {
      return userAnswer === question.correctAnswer
    } else if (question.type === "true-false") {
      return userAnswer === question.correctAnswer
    } else if (question.type === "short-answer") {
      const normalizedAnswer = userAnswer.toString().toLowerCase().trim()
      return question.acceptedAnswers.some((accepted) => accepted.toLowerCase().trim() === normalizedAnswer)
    } else if (question.type === "fill-blank") {
      const normalizedAnswer = userAnswer.toString().toLowerCase().trim()
      return normalizedAnswer === question.correctAnswer.toLowerCase().trim()
    }
    return false
  }

  const handleAnswer = (userAnswer: string | number | boolean, timeSpent: number) => {
    if (!quiz) return

    const currentQuestion = quiz.questions[currentQuestionIndex]
    const correct = checkAnswer(userAnswer, currentQuestion)

    setIsCorrect(correct)
    setShowFeedback(true)

    // Update adaptive difficulty
    if (correct) {
      setConsecutiveCorrect((prev) => prev + 1)
      setConsecutiveWrong(0)
      if (consecutiveCorrect >= 2 && adaptiveDifficulty === "easy") {
        setAdaptiveDifficulty("medium")
      } else if (consecutiveCorrect >= 2 && adaptiveDifficulty === "medium") {
        setAdaptiveDifficulty("hard")
      }
    } else {
      setConsecutiveWrong((prev) => prev + 1)
      setConsecutiveCorrect(0)
      if (consecutiveWrong >= 1 && adaptiveDifficulty === "hard") {
        setAdaptiveDifficulty("medium")
      } else if (consecutiveWrong >= 1 && adaptiveDifficulty === "medium") {
        setAdaptiveDifficulty("easy")
      }
    }

    setAnswers([
      ...answers,
      {
        questionIndex: currentQuestionIndex,
        userAnswer,
        isCorrect: correct,
        timeSpent,
      },
    ])
  }

  const handleNext = () => {
    setShowFeedback(false)
    setIsCorrect(false)

    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      handleFinishQuiz()
    }
  }

  const handleFinishQuiz = async () => {
    if (!quiz) return

    try {
      console.log("[v0] Submitting quiz results...")
      const response = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          materialId: quiz.materialId,
          answers,
          // adaptiveDifficulty is not yet stored in the backend model 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit quiz")
      }

      router.push(`/results/${data.attemptId}`)
    } catch (error) {
      console.error("Submit error:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!quiz) {
    return null
  }

  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  const correctCount = answers.filter((a) => a.isCorrect).length

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="container mx-auto max-w-3xl px-6 py-8">
        {/* Progress Header */}
        <Card className="mb-6 glass-card border-none">
          <CardContent className="pt-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-gradient">{quiz.title}</h2>
                <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mt-1">
                  <span className="text-primary">{correctCount}</span> correct / {answers.length} answered
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Adaptive Level</p>
                <p className="text-xl font-black italic tracking-tighter text-primary uppercase">{adaptiveDifficulty}</p>
              </div>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <QuestionCard
          key={currentQuestionIndex}
          question={quiz.questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={quiz.questions.length}
          onAnswer={handleAnswer}
          showFeedback={showFeedback}
          isCorrect={isCorrect}
        />

        {/* Next Button */}
        {showFeedback && (
          <div className="mt-8 flex justify-end">
            <Button onClick={handleNext} size="lg" className="btn-primary font-bold text-lg px-8 h-14">
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <>
                  NEXT QUESTION <ArrowRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                "FINISH QUIZ"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
