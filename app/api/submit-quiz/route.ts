import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { quizId, answers, adaptiveDifficulty } = await req.json()

    if (!quizId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const correctCount = answers.filter((a: { isCorrect: boolean }) => a.isCorrect).length
    const totalQuestions = answers.length
    const score = (correctCount / totalQuestions) * 100

    // Save quiz attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        answers,
        score,
        total_questions: totalQuestions,
        difficulty_progression: {
          final_level: adaptiveDifficulty,
          answers: answers,
        },
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (attemptError) {
      console.error("Database error:", attemptError)
      return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 })
    }

    // Calculate analytics
    const topicPerformance: Record<string, { correct: number; total: number }> = {}
    const difficultyBreakdown: Record<string, { correct: number; total: number }> = {}
    const responseTimes: number[] = []

    // Fetch quiz to get question details
    const { data: quiz } = await supabase.from("quizzes").select("questions").eq("id", quizId).single()

    if (quiz) {
      answers.forEach((answer: { questionIndex: number; isCorrect: boolean; timeSpent: number }, idx: number) => {
        const question = quiz.questions[answer.questionIndex]
        if (question) {
          // Topic performance
          if (!topicPerformance[question.topic]) {
            topicPerformance[question.topic] = { correct: 0, total: 0 }
          }
          topicPerformance[question.topic].total++
          if (answer.isCorrect) topicPerformance[question.topic].correct++

          // Difficulty breakdown
          if (!difficultyBreakdown[question.difficulty]) {
            difficultyBreakdown[question.difficulty] = { correct: 0, total: 0 }
          }
          difficultyBreakdown[question.difficulty].total++
          if (answer.isCorrect) difficultyBreakdown[question.difficulty].correct++

          // Response times
          responseTimes.push(answer.timeSpent)
        }
      })
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length

    // Generate recommendations
    const recommendations = []
    const weakTopics = Object.entries(topicPerformance)
      .filter(([_, stats]) => stats.correct / stats.total < 0.6)
      .map(([topic]) => topic)

    if (weakTopics.length > 0) {
      recommendations.push(`Focus on these topics: ${weakTopics.join(", ")}`)
    }
    if (score < 60) {
      recommendations.push("Consider reviewing the material before attempting more difficult quizzes")
    } else if (score >= 80) {
      recommendations.push("Great job! Try increasing the difficulty level for more challenge")
    }
    if (avgResponseTime > 60) {
      recommendations.push("Work on improving your response time with practice")
    }

    // Save analytics
    await supabase.from("analytics").insert({
      user_id: user.id,
      attempt_id: attempt.id,
      topic_performance: topicPerformance,
      difficulty_breakdown: difficultyBreakdown,
      response_times: responseTimes,
      recommendations,
    })

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      correctCount,
      totalQuestions,
    })
  } catch (error) {
    console.error("Submit quiz error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
