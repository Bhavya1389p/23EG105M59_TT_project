import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, BarChart3, Zap, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8">
            <h1 className="mb-4 text-6xl font-bold text-gray-900">SmartQuizzer</h1>
            <p className="text-xl text-muted-foreground">AI-Powered Adaptive Quiz Generation</p>
          </div>

          <p className="mb-8 max-w-2xl text-balance text-lg leading-relaxed text-gray-700">
            Transform your study materials into intelligent, adaptive quizzes. Upload PDFs or text, and let our AI
            create personalized questions that adjust to your learning pace.
          </p>

          <div className="flex gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/sign-up">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold">Upload Materials</h3>
              <p className="text-sm text-muted-foreground">PDF, text files, or paste your notes directly</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mb-2 font-semibold">AI Generation</h3>
              <p className="text-sm text-muted-foreground">
                Smart questions with multiple formats and difficulty levels
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 font-semibold">Adaptive Learning</h3>
              <p className="text-sm text-muted-foreground">Questions adjust based on your performance</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 font-semibold">Track Progress</h3>
              <p className="text-sm text-muted-foreground">Detailed analytics and personalized recommendations</p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Upload Content</h3>
              <p className="text-muted-foreground">Upload your study materials or paste your notes</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">Generate Quiz</h3>
              <p className="text-muted-foreground">AI analyzes content and creates tailored questions</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Learn & Improve</h3>
              <p className="text-muted-foreground">Take adaptive quizzes and track your progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
