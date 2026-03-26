import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    // Fetch analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from("analytics")
      .select("*")
      .eq("attempt_id", attemptId)
      .eq("user_id", user.id)
      .single()

    if (analyticsError || !analytics) {
      return NextResponse.json({ error: "Analytics not found" }, { status: 404 })
    }

    // Fetch quiz info
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("title")
      .eq("id", attempt.quiz_id)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    return NextResponse.json({
      attempt,
      analytics,
      quiz,
    })
  } catch (error) {
    console.error("Fetch results error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
