import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  console.log("[v0] Upload-text API called")

  try {
    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    const {
      data: { user },
    } = await supabase.auth.getUser()
    console.log("[v0] User check:", user ? `User ID: ${user.id}` : "No user")

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    const { title, content } = await req.json()
    console.log("[v0] Request data:", { title, contentLength: content?.length })

    if (!title || !content) {
      return NextResponse.json({ error: "Missing title or content" }, { status: 400 })
    }

    if (content.length < 50) {
      return NextResponse.json({ error: "Content too short (minimum 50 characters)" }, { status: 400 })
    }

    // Save to database
    console.log("[v0] Saving to database...")
    const { data, error } = await supabase
      .from("materials")
      .insert({
        user_id: user.id,
        title,
        content: content.substring(0, 50000), // Limit to 50k chars
        file_type: "text/plain",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    console.log("[v0] Material saved successfully:", data.id)
    return NextResponse.json({ materialId: data.id, success: true })
  } catch (error) {
    console.error("[v0] Upload-text error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
