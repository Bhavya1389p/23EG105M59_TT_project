import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from "zod"

const questionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mcq"),
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswer: z.number().min(0).max(3),
    explanation: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    topic: z.string(),
  }),
  z.object({
    type: z.literal("true-false"),
    statement: z.string(),
    correctAnswer: z.boolean(),
    explanation: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    topic: z.string(),
  }),
  z.object({
    type: z.literal("short-answer"),
    question: z.string(),
    acceptedAnswers: z.array(z.string()).min(1),
    explanation: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    topic: z.string(),
  }),
  z.object({
    type: z.literal("fill-blank"),
    sentence: z.string().describe("Sentence with [BLANK] marker where answer goes"),
    blankPosition: z.number().describe("Word position of the blank (0-indexed)"),
    correctAnswer: z.string(),
    explanation: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    topic: z.string(),
  }),
])

const quizSchema = z.object({
  questions: z.array(questionSchema).min(5).max(20),
  topics: z.array(z.string()).min(1),
})

export const maxDuration = 60

export async function POST(req: Request) {
  console.log("[v0] Generate-quiz API called")

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    console.log("[v0] User check:", user ? `User ID: ${user.id}` : "No user")

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    const { materialId, questionCount = 10 } = await req.json()
    console.log("[v0] Request data:", { materialId, questionCount })

    if (!materialId) {
      return NextResponse.json({ error: "Missing materialId" }, { status: 400 })
    }

    // No caching - always generate a fresh quiz for accurate question type distribution

    // Fetch material
    console.log("[v0] Fetching material from database...")
    const { data: material, error: fetchError } = await supabase
      .from("materials")
      .select("*")
      .eq("id", materialId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !material) {
      console.error("[v0] Material fetch error:", fetchError)
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    // Validate that material has content
    if (!material.content || material.content.length < 10) {
      console.error("[v0] Material has basically no content:", material.content?.length || 0)
      return NextResponse.json({ error: "This file appears to be empty or unreadable. Please try another file." }, { status: 400 })
    }

    // Build dynamic schema bounds based on the configuration
    const dynamicQuizSchema = z.object({
      questions: z.array(questionSchema).length(questionCount),
      topics: z.array(z.string()).min(1),
    })

    // Check for Google Gemini API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("[v0] GOOGLE_GENERATIVE_AI_API_KEY not found in environment variables")
      return NextResponse.json(
        { error: "Google Gemini API key not configured." },
        { status: 500 },
      )
    }

    // Check if content appears to be PDF metadata rather than actual text
    const metadataIndicators = [
      /\b(chromium|skia|pdf|creator|producer|creation|modification|date|author|title|subject|keywords)\b/i,
      /\/[A-Z][a-z]+/,  // PDF dictionary keys
      /\bD:\d{14}/,  // PDF date format
      /\bstream\b|\bendstream\b|\bobj\b|\bendobj\b/  // PDF structural elements
    ]

    const appearsToBeMetadata = metadataIndicators.some(pattern => pattern.test(material.content)) &&
                                !/\b(the|and|or|but|in|on|at|to|for|of|with|by|an|a|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|can|could|should|may|might|must|shall|about|which|who|whom|this|that|these|those)\b.*\b(the|and|or|but|in|on|at|to|for|of|with|by|an|a|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|can|could|should|may|might|must|shall|about|which|who|whom|this|that|these|those)\b/i.test(material.content)

    if (appearsToBeMetadata && material.content.length < 1000) {
      console.error("[v0] Material content appears to be PDF metadata, rejecting")
      return NextResponse.json({ error: "The uploaded PDF contains only technical metadata." }, { status: 400 })
    }

    // Prepare content for the LLM - take a representative sample
    const targetCount = questionCount;
    const bufferCount = 2; // Extra buffer to ensure we hit the target
    const requestCount = targetCount + bufferCount;

    let contentToUse = material.content
    if (material.content.length > 20000) {
      // Sample long content
      const firstPart = material.content.substring(0, 10000)
      const midPoint = Math.floor(material.content.length / 2)
      const middlePart = material.content.substring(midPoint - 2500, midPoint + 2500)
      const lastPart = material.content.substring(material.content.length - 5000)
      contentToUse = firstPart + "\n\n[...]\n\n" + middlePart + "\n\n[...]\n\n" + lastPart
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `You are an expert educator creating a high-quality quiz. You have deeply studied the provided content and now ask questions as a subject-matter expert — directly and confidently, just like Google NotebookLM.

Material Title: "${material.title}"
Content: ${contentToUse}

CRITICAL RULES:
1. Generate EXACTLY ${requestCount} questions total.
2. You MUST include ALL of the following question types in a balanced mix:
   - "mcq" (Multiple Choice): At least ${Math.ceil(requestCount * 0.4)} questions — REQUIRED
   - "true-false": At least ${Math.ceil(requestCount * 0.2)} questions — REQUIRED
   - "short-answer": At least ${Math.ceil(requestCount * 0.2)} questions — REQUIRED
   - "fill-blank": At least ${Math.ceil(requestCount * 0.2)} questions — REQUIRED
3. MCQs MUST have exactly 4 plausible answer options. Only ONE is correct.
4. "fill-blank" sentences MUST contain the [BLANK] marker. Example: "The mitochondria is known as the [BLANK] of the cell."
5. "true-false" statements must be unambiguous facts or clear falsehoods.
6. "short-answer" must require a concise, specific answer (1–5 words).
7. Every question MUST be directly answerable from the content. Do NOT invent information.
8. Each question needs a clear explanation of why the answer is correct.
9. Assign difficulty ("easy", "medium", "hard") and a specific topic for each question.

QUESTION STYLE — VERY IMPORTANT:
- Ask questions DIRECTLY. Write as an expert who knows the topic, NOT as someone referring to a document.
- NEVER start a question with: "According to the material", "Based on the text", "The document states", "As mentioned", "In the content", or similar phrases.
- GOOD example: "What is the primary function of the mitochondria?"
- BAD example: "According to the material, what is the primary function of the mitochondria?"
- GOOD true/false: "The mitochondria produces ATP through cellular respiration."
- BAD true/false: "According to the text, the mitochondria produces ATP."
- GOOD fill-blank: "The powerhouse of the cell is the [BLANK]."
- BAD fill-blank: "According to the material, the [BLANK] is the powerhouse of the cell."

RETURN ONLY valid JSON in this exact format (no markdown, no code block):
{
  "questions": [
    {
      "type": "mcq",
      "question": "What is the primary function of X?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Option A is correct because...",
      "difficulty": "medium",
      "topic": "Topic Name"
    },
    {
      "type": "true-false",
      "statement": "X is responsible for Y.",
      "correctAnswer": true,
      "explanation": "This is true because...",
      "difficulty": "easy",
      "topic": "Topic Name"
    },
    {
      "type": "short-answer",
      "question": "What causes X?",
      "acceptedAnswers": ["answer1", "answer2"],
      "explanation": "The answer is...",
      "difficulty": "hard",
      "topic": "Topic Name"
    },
    {
      "type": "fill-blank",
      "sentence": "The [BLANK] is responsible for X.",
      "blankPosition": 1,
      "correctAnswer": "answer",
      "explanation": "The answer is...",
      "difficulty": "medium",
      "topic": "Topic Name"
    }
  ],
  "topics": ["topic1", "topic2"]
}`

    let validatedQuestions: any[] = []
    let quizTopics: string[] = []

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      // Remove markdown code block formatting if present
      const cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
      const quiz = JSON.parse(cleanedText)
      
      quizTopics = quiz.topics || []
      validatedQuestions = quiz.questions.filter((q: any) => {
        if (!q.type) return false;
        const hasText = q.question || q.statement || q.sentence;
        if (!hasText) return false;
        
        switch (q.type) {
          case "mcq":
            return q.options && q.options.length === 4 && typeof q.correctAnswer === 'number';
          case "true-false":
            return typeof q.correctAnswer === 'boolean';
          case "short-answer":
            return q.acceptedAnswers && q.acceptedAnswers.length > 0;
          case "fill-blank":
            return q.sentence && q.sentence.includes("[BLANK]") && q.correctAnswer;
          default:
            return false;
        }
      })
    } catch (aiError: any) {
      console.error("[v0] AI process error, using deterministic fallback:", aiError)
    }

    // --- STEP 2: DETERMINISTIC FALLBACK GENERATOR (If AI failed or produced too few questions) ---
    if (validatedQuestions.length < 1) {
      console.log("[v0] Using deterministic fallback generator...")
      const topics = material.title ? [material.title] : ["General Knowledge"]
      quizTopics = topics
      
      const parts = material.content.split(/[.!?\n]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 20)
      
      validatedQuestions = []
      let tfCount = 0 // track T/F so we alternate true/false
      for (let i = 0; i < questionCount; i++) {
        const sourcePart = parts[i % parts.length] || "Content details"
        const nextPart = parts[(i + 2) % parts.length] || parts[0] || sourcePart
        const qType = i % 4

        if (qType === 0) {
          // MCQ fallback — direct question phrasing
          validatedQuestions.push({
            type: "mcq",
            question: `Which of the following is correct?`,
            options: [
              sourcePart.substring(0, 70) + (sourcePart.length > 70 ? "..." : ""),
              nextPart.substring(0, 50) + " (incorrect)",
              `The opposite of what is described above`,
              `None of these are accurate`
            ],
            correctAnswer: 0,
            explanation: sourcePart.substring(0, 150),
            difficulty: "medium",
            topic: topics[0]
          })
        } else if (qType === 1) {
          // True/False fallback — ALTERNATE true/false answers
          const isTrue = tfCount % 2 === 0
          tfCount++
          if (isTrue) {
            // True question: use the real statement directly
            validatedQuestions.push({
              type: "true-false",
              statement: sourcePart.substring(0, 120) + (sourcePart.length > 120 ? "." : ""),
              correctAnswer: true,
              explanation: `Correct. ${sourcePart.substring(0, 100)}.`,
              difficulty: "easy",
              topic: topics[0]
            })
          } else {
            // False question: take a real sentence and swap its last noun/word with something from another sentence
            const words = sourcePart.split(' ')
            const diffWords = nextPart.split(' ').filter((w: string) => w.length > 4)
            const swapWord = diffWords[0] || "incorrect"
            const falseStatement = words.slice(0, words.length - 1).join(' ') + ' ' + swapWord + '.'
            validatedQuestions.push({
              type: "true-false",
              statement: falseStatement.substring(0, 120),
              correctAnswer: false,
              explanation: `Incorrect. ${sourcePart.substring(0, 100)}.`,
              difficulty: "easy",
              topic: topics[0]
            })
          }
        } else if (qType === 2) {
          // Short answer fallback — direct "What is X?" phrasing
          const words = sourcePart.split(' ').filter((w: string) => w.length > 4)
          const keyWord = words[Math.floor(words.length / 2)]?.replace(/[^\w\s]/g, '') || topics[0]
          validatedQuestions.push({
            type: "short-answer",
            question: `What is ${keyWord}?`,
            acceptedAnswers: [keyWord, sourcePart.substring(0, 40)],
            explanation: sourcePart.substring(0, 150),
            difficulty: "medium",
            topic: topics[0]
          })
        } else {
          // Fill-blank fallback
          const words = sourcePart.split(' ').filter((w: string) => w.length > 4)
          if (words.length > 0) {
            const targetWord = words[Math.floor(words.length / 2)]
            const answer = targetWord.replace(/[^\w]/g, '')
            if (answer) {
              validatedQuestions.push({
                type: "fill-blank",
                sentence: sourcePart.replace(targetWord, "[BLANK]").substring(0, 150),
                blankPosition: Math.floor(words.length / 2),
                correctAnswer: answer,
                explanation: `The missing word is "${answer}". ${sourcePart.substring(0, 80)}.`,
                difficulty: "medium",
                topic: topics[0]
              })
            } else {
              // fallback to alternating T/F
              const isTrue2 = tfCount % 2 === 0
              tfCount++
              validatedQuestions.push({
                type: "true-false",
                statement: (isTrue2 ? sourcePart : nextPart).substring(0, 120),
                correctAnswer: isTrue2,
                explanation: isTrue2
                  ? `Correct. ${sourcePart.substring(0, 80)}.`
                  : `Incorrect. ${sourcePart.substring(0, 80)}.`,
                difficulty: "easy",
                topic: topics[0]
              })
            }
          }
        }
      }
    }

    // --- POST-PROCESSING: Strip 'according to material' style phrases from all questions ---
    const stripMaterialPhrases = (text: string): string => {
      if (!text) return text
      return text
        .replace(/^(According to (the )?(material|text|document|content|passage)|Based on (the )?(material|text|document|content)|As (stated|mentioned|described) in (the )?(material|text|document)|The (material|text|document) (states?|says?|mentions?|describes?|notes?)):?\s*/i, '')
        .replace(/^["']/, '') // strip leading quote if present after removal
        .trim()
    }

    validatedQuestions = validatedQuestions.map((q: any) => {
      if (q.type === 'mcq') return { ...q, question: stripMaterialPhrases(q.question) }
      if (q.type === 'true-false') return { ...q, statement: stripMaterialPhrases(q.statement) }
      if (q.type === 'short-answer') return { ...q, question: stripMaterialPhrases(q.question) }
      if (q.type === 'fill-blank') return { ...q, sentence: stripMaterialPhrases(q.sentence) }
      return q
    })

    // Slice to the requested count
    if (validatedQuestions.length > targetCount) {
      validatedQuestions = validatedQuestions.slice(0, targetCount)
    }

    if (validatedQuestions.length < 1) {
      return NextResponse.json({ error: "Could not read enough text from this file to generate a quiz." }, { status: 400 })
    }

    console.log("[v0] Saving quiz to database...")
    const { data: savedQuiz, error: saveError } = await supabase
      .from("quizzes")
      .insert({
        user_id: user.id,
        material_id: materialId,
        title: `Quiz: ${material.title}`,
        questions: validatedQuestions,
      })
      .select()
      .single()

    if (saveError) {
      console.error("[v0] Database save error:", saveError)
      return NextResponse.json({ error: `Failed to save quiz: ${saveError.message}` }, { status: 500 })
    }

    console.log("[v0] Quiz saved successfully:", savedQuiz.id)
    return NextResponse.json({
      quizId: savedQuiz.id,
      questions: validatedQuestions,
      topics: quizTopics,
      totalQuestions: validatedQuestions.length,
      method: validatedQuestions[0].type === "true-false" && validatedQuestions[1]?.type === "fill-blank" ? "fallback" : "ai"
    })
  } catch (error) {
    console.error("[v0] Root error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 },
    )
  }
}
