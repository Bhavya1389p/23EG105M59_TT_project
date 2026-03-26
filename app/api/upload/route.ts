import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Max file size 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024 

export async function POST(req: NextRequest) {
  console.log("[v0] Upload API called")

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

    const formData = await req.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    console.log("[v0] Form data:", { title, fileName: file?.name, fileSize: file?.size })

    if (!file || !title) {
      return NextResponse.json({ error: "Missing file or title" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    // Extract text content based on file type
    let content = ""
    const fileType = file.type
    const fileName = file.name.toLowerCase()
    console.log("[v0] File processing:", { fileType, fileName })

    if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      content = await file.text()
    } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      // Extract text from PDF using pdf-parse with robust polyfill
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Basic validation
        if (buffer.length < 10) {
          throw new Error("File is too empty to be a valid PDF")
        }

        // Ensure DOMMatrix is available globally for pdf.js
        const MatrixPolyfill = class DOMMatrix {
          m11 = 1; m12 = 0; m13 = 0; m14 = 0;
          m21 = 0; m22 = 1; m23 = 0; m24 = 0;
          m31 = 0; m32 = 0; m33 = 1; m34 = 0;
          m41 = 0; m42 = 0; m43 = 0; m44 = 1;
          a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
          constructor() {}
          toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
        };

        if (typeof global !== 'undefined' && !(global as any).DOMMatrix) (global as any).DOMMatrix = MatrixPolyfill;
        if (typeof globalThis !== 'undefined' && !(globalThis as any).DOMMatrix) (globalThis as any).DOMMatrix = MatrixPolyfill;
        
        const pdfParse = require("pdf-parse")
        const { PdfReader } = require("pdfreader")
        
        console.log("[v0] Attempting primary pdf-parse extraction...")
        let extractedText = ""
        
        try {
          const pdfData = await pdfParse(buffer)
          extractedText = pdfData.text || ""
        } catch (parseErr) {
          console.error("[v0] Primary pdf-parse failed, trying fallback...", parseErr)
        }

        // Fallback to pdfreader if primary failed or returned nothing
        if (!extractedText || extractedText.trim().length < 50) {
          console.log("[v0] Starting secondary pdfreader extraction...")
          try {
            extractedText = await new Promise((resolve, reject) => {
              let text = ""
              new PdfReader().parseBuffer(buffer, (err: any, item: any) => {
                if (err) reject(err)
                else if (!item) resolve(text)
                else if (item.text) text += item.text + " "
              })
            })
          } catch (fallbackErr) {
            console.error("[v0] Secondary fallback also failed:", fallbackErr)
          }
        }

        // Clean up text
        extractedText = extractedText
          .replace(/\0/g, '')
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
          .replace(/\s+/g, ' ')
          .trim()

        if (!extractedText || extractedText.length < 20) {
          console.error("[v0] Extraction resulted in insufficient text")
          throw new Error("This PDF seems to contain no readable text. It might be a scanned image or empty.")
        }

        content = extractedText
        console.log("[v0] Final PDF content length:", content.length)

      } catch (pdfError: any) {
        console.error("[v0] PDF process error:", pdfError)
        return NextResponse.json(
          { error: pdfError.message || "Could not read PDF. Please ensure it's not encrypted or corrupted." }, 
          { status: 400 }
        )
      }
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      fileType === "application/msword" ||
      file.name.endsWith(".docx") || 
      file.name.endsWith(".doc")
    ) {
      try {
        const mammoth = require("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
        if (!content || content.trim().length === 0) {
          throw new Error("Document contains no extractable text");
        }
        console.log("[v0] DOCX text extraction completed, extracted", content.length, "characters");
      } catch (docError) {
        console.error("[v0] DOCX parsing error:", docError);
        return NextResponse.json({ error: "Failed to extract text from Word document. The file may be corrupted or password-protected." }, { status: 400 });
      }
    } else {
      content = await file.text()
    }

    console.log("[v0] Extracted content length:", content.length)

    if (!content || content.length < 20) {
      return NextResponse.json({ error: "Content too short or empty. Please ensure the file contains readable text." }, { status: 400 })
    }

    // For PDFs, validate that we actually extracted meaningful text
    if (fileType === "application/pdf" && content.length < 50) {
      return NextResponse.json({ error: "PDF text extraction failed or text is too short. The PDF may be image-based or contain no readable text." }, { status: 400 })
    }

    // Save to database
    console.log("[v0] Saving to database...")
    const { data, error } = await supabase
      .from("materials")
      .insert({
        user_id: user.id,
        title,
        content: content.substring(0, 50000), // Limit to 50k chars
        file_type: fileType,
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
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
