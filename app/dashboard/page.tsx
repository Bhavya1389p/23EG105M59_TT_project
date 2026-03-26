import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Plus, Clock } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: materials } = await supabase
    .from("materials")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Welcome Back!</h1>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Action Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Create New Quiz</CardTitle>
              <CardDescription>Upload study materials to generate an adaptive quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/upload">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Materials
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>Learning statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Materials</span>
                <span className="text-2xl font-bold">{materials?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quizzes Taken</span>
                <span className="text-2xl font-bold">{attempts?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Materials */}
        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-bold">Recent Materials</h2>
          {materials && materials.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials.map((material) => (
                <Card key={material.id}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <CardTitle className="text-base">{material.title}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {new Date(material.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                      <Link href={`/generate?materialId=${material.id}`}>Generate Quiz</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 font-medium">No materials yet</p>
                <p className="mb-4 text-sm text-muted-foreground">Upload your first study material to get started</p>
                <Button asChild>
                  <Link href="/upload">Upload Now</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
