import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score, total_questions, completed_at, answers")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })

    if (attemptsError) {
      console.error("Database error:", attemptsError)
      return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 })
    }

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({
        totalQuizzes: 0,
        averageScore: 0,
        totalQuestions: 0,
        averageResponseTime: 0,
        recentAttempts: [],
      })
    }

    // Calculate overall stats
    const totalQuizzes = attempts.length
    const averageScore = attempts.reduce((sum, a) => sum + a.score, 0) / totalQuizzes
    const totalQuestions = attempts.reduce((sum, a) => sum + a.total_questions, 0)

    // Calculate average response time
    let totalResponseTime = 0
    let totalAnswers = 0
    attempts.forEach((attempt) => {
      if (attempt.answers && Array.isArray(attempt.answers)) {
        attempt.answers.forEach((answer: { timeSpent: number }) => {
          totalResponseTime += answer.timeSpent || 0
          totalAnswers++
        })
      }
    })
    const averageResponseTime = totalAnswers > 0 ? totalResponseTime / totalAnswers : 0

    // Get quiz titles for recent attempts
    const recentAttemptIds = attempts.slice(0, 5).map((a) => a.quiz_id)
    const { data: quizzes } = await supabase.from("quizzes").select("id, title").in("id", recentAttemptIds)

    const quizMap = new Map(quizzes?.map((q) => [q.id, q.title]) || [])

    const recentAttempts = attempts.slice(0, 5).map((attempt) => ({
      id: attempt.id,
      quiz_title: quizMap.get(attempt.quiz_id) || "Quiz",
      score: attempt.score,
      completed_at: attempt.completed_at,
    }))

    return NextResponse.json({
      totalQuizzes,
      averageScore,
      totalQuestions,
      averageResponseTime,
      recentAttempts,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
