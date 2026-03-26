"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState("")
  const [questionCount, setQuestionCount] = useState([10])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Final check/polyfill on mount
    if (typeof window !== 'undefined') {
      // @ts-ignore
      console.log("[v0] Mount-time DOMMatrix status:", !!window.DOMMatrix);
      // @ts-ignore
      if (!window.DOMMatrix) {
        // @ts-ignore
        window.DOMMatrix = (globalThis as any).DOMMatrix || (window as any).WebKitCSSMatrix || (window as any).MSCSSMatrix;
        console.log("[v0] Re-applied DOMMatrix polyfill on mount:", !!window.DOMMatrix);
      }
    }
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !file) return

    setIsProcessing(true)
    setError(null)
    console.log("[v0] Starting file upload for:", file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)

      console.log("[v0] Sending upload request...")
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("[v0] Upload response:", { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      console.log("[v0] Upload successful, redirecting to generate page")
      router.push(`/generate?materialId=${data.materialId}&count=${questionCount[0]}`)
    } catch (err) {
      console.error("[v0] Upload error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !textContent) return

    setIsProcessing(true)
    setError(null)
    console.log("[v0] Starting text upload...")

    try {
      console.log("[v0] Sending text upload request...")
      const response = await fetch("/api/upload-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: textContent }),
      })

      const data = await response.json()
      console.log("[v0] Text upload response:", { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      console.log("[v0] Text upload successful, redirecting to generate page")
      router.push(`/generate?materialId=${data.materialId}&count=${questionCount[0]}`)
    } catch (err) {
      console.error("[v0] Text upload error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <NavBar />

      <div className="container mx-auto max-w-3xl px-6 py-8 relative z-10">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-5xl font-black tracking-tighter lg:text-7xl text-gradient">
            Upload Material
          </h1>
          <p className="text-xl text-muted-foreground/80 font-medium tracking-tight">
            Level up your learning with <span className="text-primary font-bold">AI Quizzes</span> from any document
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Add Your Content</CardTitle>
            <CardDescription>Choose between file upload or direct text input</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Upload File</TabsTrigger>
                <TabsTrigger value="text">Paste Text</TabsTrigger>
              </TabsList>

              <TabsContent value="file">
                <form onSubmit={handleFileUpload} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="file-title">Material Title</Label>
                    <Input
                      id="file-title"
                      placeholder="e.g., Biology Chapter 5"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Upload File</Label>
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary">
                      <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.txt,.doc,.docx,.md,.csv,.json"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                        required
                      />
                      <p className="mt-2 text-sm text-muted-foreground">PDF, TXT, DOC, DOCX, Markdown, CSV (Max 10MB)</p>
                      {file && (
                        <p className="mt-2 text-sm font-medium text-primary">
                          Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <Label>Number of Questions</Label>
                      <span className="font-bold text-primary">{questionCount[0]}</span>
                    </div>
                    <Slider
                      value={questionCount}
                      onValueChange={setQuestionCount}
                      max={20}
                      min={5}
                      step={1}
                      className="py-4"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive">Upload Failed</p>
                        <p className="text-sm text-destructive/80">{error}</p>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full btn-primary font-bold text-lg h-12" disabled={isProcessing || !title || !file}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Content...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Generate Quiz
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="text">
                <form onSubmit={handleTextUpload} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="text-title">Material Title</Label>
                    <Input
                      id="text-title"
                      placeholder="e.g., History Notes - World War II"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-content">Study Notes</Label>
                    <Textarea
                      id="text-content"
                      placeholder="Paste your study notes here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      rows={12}
                      className="resize-none font-mono text-sm"
                      required
                    />
                    <p className="text-sm text-muted-foreground">{textContent.length} characters</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <Label>Number of Questions</Label>
                      <span className="font-bold text-primary">{questionCount[0]}</span>
                    </div>
                    <Slider
                      value={questionCount}
                      onValueChange={setQuestionCount}
                      max={20}
                      min={5}
                      step={1}
                      className="py-4"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive">Upload Failed</p>
                        <p className="text-sm text-destructive/80">{error}</p>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full btn-primary font-bold text-lg h-12" disabled={isProcessing || !title || !textContent}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Content...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-5 w-5" />
                        Generate Quiz
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
