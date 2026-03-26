"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Loader2, Brain, Sparkles } from "lucide-react"

function GenerateQuizContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const materialId = searchParams.get("materialId")
  const urlCount = searchParams.get("count")

  const [questionCount, setQuestionCount] = useState(urlCount ? parseInt(urlCount) : 10)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!materialId) {
      router.push("/dashboard")
    }
  }, [materialId, router])

  const handleGenerate = async () => {
    if (!materialId) return

    setIsGenerating(true)
    setError(null)

    try {
      console.log("[v0] Requesting quiz generation...")
      const response = await fetch(`/api/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, questionCount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz")
      }

      console.log("[v0] Quiz generated successfully:", data.quizId)
      router.push(`/quiz/${data.quizId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="container mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5 shadow-[0_10px_30px_rgba(255,0,128,0.1)] border border-primary/20 rotate-3">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-3 text-5xl font-black tracking-tighter text-secondary">Generate AI Quiz</h1>
          <p className="text-lg text-muted-foreground font-medium tracking-tight italic">Customize your <span className="text-primary font-bold">Smart Learning</span> experience</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Settings</CardTitle>
            <CardDescription>Configure your personalized quiz parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="question-count">Number of Questions</Label>
                <span className="text-2xl font-bold text-primary">{questionCount}</span>
              </div>
              <Slider
                id="question-count"
                min={5}
                max={20}
                step={1}
                value={[questionCount]}
                onValueChange={(value) => setQuestionCount(value[0])}
                className="cursor-pointer py-4"
              />
              <p className="text-sm text-muted-foreground">Recommended: 10 questions for optimal learning sessions</p>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Features
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Mixed question types: MCQ, True/False, Short Answer, Fill-in-the-Blank</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Adaptive difficulty based on your performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Intelligent distractors and detailed explanations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Topic-based analysis and recommendations</span>
                </li>
              </ul>
            </div>

            {error && (
              <div className={`rounded-lg p-4 text-sm ${error.includes("Quota") ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-destructive/10 text-destructive"}`}>
                <div className="font-bold mb-1">{error.includes("Quota") ? "Gemini Busy" : "Generation Error"}</div>
                {error}
              </div>
            )}

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Quiz with AI...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 w-5" />
                  Generate Quiz
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="text-center text-sm text-muted-foreground">
                <p>AI is analyzing your content and creating personalized questions...</p>
                <p className="mt-1">This may take 20-30 seconds</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <GenerateQuizContent />
    </Suspense>
  )
}
