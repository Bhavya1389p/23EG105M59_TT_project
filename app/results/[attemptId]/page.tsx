"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  BookOpen,
  Award,
  ChevronRight,
  Home,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ResultsData {
  attempt: {
    score: number
    total_questions: number
    completed_at: string
    difficulty_progression: {
      final_level: string
      answers: Array<{
        isCorrect: boolean
        timeSpent: number
      }>
    }
  }
  analytics: {
    topic_performance: Record<string, { correct: number; total: number }>
    difficulty_breakdown: Record<string, { correct: number; total: number }>
    response_times: number[]
    recommendations: string[]
  }
  quiz: {
    title: string
  }
}

export default function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [results, setResults] = useState<ResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/results/${resolvedParams.attemptId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch results")
        }

        setResults(data)
      } catch (error) {
        console.error("Fetch error:", error)
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [resolvedParams.attemptId, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!results) return null

  const { attempt, analytics, quiz } = results
  const correctCount = attempt.difficulty_progression.answers.filter((a) => a.isCorrect).length
  const avgResponseTime = analytics.response_times.reduce((a, b) => a + b, 0) / analytics.response_times.length || 0

  const topicData = Object.entries(analytics.topic_performance).map(([topic, stats]) => ({
    topic,
    accuracy: Math.round((stats.correct / stats.total) * 100),
    correct: stats.correct,
    total: stats.total,
  }))

  const difficultyData = Object.entries(analytics.difficulty_breakdown).map(([difficulty, stats]) => ({
    name: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
    value: stats.correct,
    total: stats.total,
    accuracy: Math.round((stats.correct / stats.total) * 100),
  }))

  const scoreColor = attempt.score >= 80 ? "text-green-600" : attempt.score >= 60 ? "text-yellow-600" : "text-red-600"
  const difficultyColors: Record<string, string> = {
    Easy: "#10b981",
    Medium: "#f59e0b",
    Hard: "#ef4444",
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="container mx-auto max-w-6xl px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-2 text-4xl font-bold">Quiz Complete!</h1>
          <p className="text-lg text-muted-foreground">{quiz.title}</p>
        </div>

        {/* Score Overview */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription>Your Score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${scoreColor}`}>{Math.round(attempt.score)}%</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {correctCount} / {attempt.total_questions} correct
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg. Response Time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{Math.round(avgResponseTime)}s</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Final Difficulty</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold capitalize">{attempt.difficulty_progression.final_level}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{attempt.total_questions}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Topic Performance */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Topic Performance
              </CardTitle>
              <CardDescription>Your accuracy by topic</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  accuracy: {
                    label: "Accuracy",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicData} margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="topic"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, props) => (
                            <div className="text-sm">
                              <div className="font-semibold">{props.payload.topic}</div>
                              <div>Accuracy: {value}%</div>
                              <div className="text-muted-foreground">
                                {props.payload.correct}/{props.payload.total} correct
                              </div>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                      {topicData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.accuracy >= 80
                              ? "hsl(var(--chart-4))"
                              : entry.accuracy >= 60
                                ? "hsl(var(--chart-5))"
                                : "hsl(var(--destructive))"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Difficulty Breakdown */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Difficulty Breakdown
              </CardTitle>
              <CardDescription>Performance by question difficulty</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Correct Answers",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, accuracy }) => `${name}: ${accuracy}%`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={difficultyColors[entry.name]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, props) => (
                            <div className="text-sm">
                              <div className="font-semibold">{props.payload.name}</div>
                              <div>
                                {props.payload.value}/{props.payload.total} correct
                              </div>
                              <div className="text-muted-foreground">Accuracy: {props.payload.accuracy}%</div>
                            </div>
                          )}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Response Time Distribution */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Response Time Analysis
            </CardTitle>
            <CardDescription>Time spent per question</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.response_times.slice(0, 10).map((time, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Question {index + 1}</span>
                    <span className="font-semibold">{time}s</span>
                  </div>
                  <Progress value={(time / 120) * 100} className="h-2" />
                </div>
              ))}
            </div>
            {analytics.response_times.length > 10 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Showing first 10 of {analytics.response_times.length} questions
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        {analytics.recommendations.length > 0 && (
          <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>AI-powered learning insights</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analytics.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm leading-relaxed">
                    <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="sm:min-w-[200px]">
            <Link href="/dashboard">
              <Home className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="sm:min-w-[200px] bg-transparent">
            <Link href="/upload">
              <BookOpen className="mr-2 h-5 w-5" />
              Upload New Material
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
