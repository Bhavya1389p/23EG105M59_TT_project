"use client"

import { useEffect, useState } from "react"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, TrendingUp, Target, Clock, Award } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface OverallStats {
  totalQuizzes: number
  averageScore: number
  totalQuestions: number
  averageResponseTime: number
  recentAttempts: Array<{
    id: string
    quiz_title: string
    score: number
    completed_at: string
  }>
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverallStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/analytics/overview")
        const data = await response.json()

        if (response.ok) {
          setStats(data)
        }
      } catch (error) {
        console.error("Fetch error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Learning Analytics</h1>
          <p className="text-muted-foreground">Track your progress and performance over time</p>
        </div>

        {stats && stats.totalQuizzes > 0 ? (
          <>
            {/* Stats Overview */}
            <div className="mb-8 grid gap-6 md:grid-cols-4">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Total Quizzes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="text-3xl font-bold">{stats.totalQuizzes}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Average Score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="text-3xl font-bold">{Math.round(stats.averageScore)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Questions Answered</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-3xl font-bold">{stats.totalQuestions}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Avg Response Time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-3xl font-bold">{Math.round(stats.averageResponseTime)}s</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Attempts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Quiz Attempts</CardTitle>
                <CardDescription>Your latest quiz performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{attempt.quiz_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(attempt.completed_at).toLocaleDateString()} at{" "}
                          {new Date(attempt.completed_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">{Math.round(attempt.score)}%</p>
                          <Progress value={attempt.score} className="mt-1 w-24" />
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/results/${attempt.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Award className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No Quiz History Yet</h3>
              <p className="mb-6 text-muted-foreground">Take your first quiz to see your analytics here</p>
              <Button asChild>
                <Link href="/upload">Upload Study Material</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
