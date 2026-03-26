# 🧠 SmartQuizzer — AI-Powered Quiz Generator

SmartQuizzer is a full-stack web application that transforms any document (PDF, DOCX, TXT, etc.) or pasted text into an interactive, AI-generated quiz using Google Gemini. It supports multiple question types, adaptive difficulty, and detailed analytics — all backed by Supabase.

---

## 🚀 Live Features

- 📄 Upload PDF, DOCX, TXT, Markdown, CSV files (up to 10MB)
- ✍️ Or paste text directly
- 🤖 AI generates MCQs, True/False, Short Answer, and Fill-in-the-Blank questions
- 📊 Adaptive difficulty that adjusts in real-time based on performance
- 📈 Analytics dashboard with topic-wise performance breakdown
- 🔐 User authentication via Supabase Auth
- 💾 All data stored securely in Supabase PostgreSQL

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Radix UI |
| AI | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| PDF Parsing | `pdf-parse`, `pdfreader` |
| DOCX Parsing | `mammoth` |
| Deployment | Vercel (recommended) |

---

## 📁 Folder Structure

```
SmartQuizzer/
├── app/                        # Next.js App Router pages
│   ├── api/                    # API routes (server-side)
│   │   ├── upload/             # POST /api/upload — file upload + text extraction
│   │   ├── upload-text/        # POST /api/upload-text — paste text upload
│   │   ├── generate-quiz/      # POST /api/generate-quiz — Gemini AI quiz generation
│   │   ├── quiz/[quizId]/      # GET /api/quiz/:id — fetch a quiz
│   │   ├── submit-quiz/        # POST /api/submit-quiz — save quiz attempt
│   │   ├── results/            # GET /api/results/:id — fetch attempt results
│   │   └── analytics/          # GET /api/analytics — user analytics
│   ├── auth/                   # Authentication pages
│   │   ├── login/              # Login page
│   │   ├── sign-up/            # Sign up page
│   │   └── sign-up-success/    # Post sign-up confirmation
│   ├── dashboard/              # User dashboard (quiz history)
│   ├── upload/                 # Upload material page
│   ├── generate/               # Quiz generation settings page
│   ├── quiz/[quizId]/          # Interactive quiz page
│   ├── results/[attemptId]/    # Quiz results page
│   ├── analytics/              # Analytics & performance page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing / home page
│   └── globals.css             # Global styles
│
├── components/                 # Reusable React components
│   ├── ui/                     # Shadcn/Radix UI components
│   ├── nav-bar.tsx             # Navigation bar
│   ├── question-card.tsx       # Quiz question renderer (MCQ, T/F, etc.)
│   └── theme-provider.tsx      # Dark/light theme context
│
├── lib/                        # Utility libraries
│   ├── supabase/
│   │   ├── client.ts           # Supabase browser client
│   │   └── server.ts           # Supabase server client (SSR)
│   ├── quiz-types.ts           # TypeScript types for quiz questions
│   └── utils.ts                # General utility functions
│
├── hooks/                      # Custom React hooks
├── styles/                     # Additional CSS
├── public/                     # Static assets
├── backend/                    # Legacy Spring Boot folder (not used at runtime)
│
├── .env.local                  # Environment variables (never commit this!)
├── .gitignore                  # Git ignore rules
├── supabase-schema.sql         # Database schema — run once in Supabase SQL Editor
├── next.config.mjs             # Next.js configuration
├── package.json                # Project dependencies
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

---

## ⚙️ Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or later → [nodejs.org](https://nodejs.org)
- **npm** v9 or later (comes with Node.js)
- A **Supabase** account → [supabase.com](https://supabase.com)
- A **Google Gemini API** key → [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## 🔧 Local Setup — Step by Step

### Step 1 — Clone or Download the Project

```bash
# If using Git
git clone https://github.com/your-username/SmartQuizzer.git
cd SmartQuizzer

# Or just open the SmartQuizzer folder in your terminal
cd C:\Users\bhavy\Downloads\SmartQuizzer
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json` including Next.js, Supabase, Gemini SDK, and all UI components.

---

### Step 3 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name (e.g. `SmartQuizzer`) and a strong database password
3. Wait for the project to be ready (~1 minute)

---

### Step 4 — Set Up the Database Tables

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the contents of `supabase-schema.sql` (in your project root) and paste it
4. Click **Run**

This creates 4 tables: `materials`, `quizzes`, `quiz_attempts`, `analytics` — all with Row Level Security enabled.

---

### Step 5 — Get Your Supabase API Keys

In your Supabase project:
1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon / public key**
   - **service_role / secret key**

---

### Step 6 — Configure Environment Variables

Create a `.env.local` file in the project root (it already exists — just update the values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-here
```

> ⚠️ **Never commit `.env.local` to Git.** It is already listed in `.gitignore`.

---

### Step 7 — Run the Development Server

```bash
npm run dev
```

Open your browser and go to → **http://localhost:3000**

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server at localhost:3000 |
| `npm run build` | Build the app for production |
| `npm start` | Start the production server (after build) |
| `npm run lint` | Run ESLint to check for code issues |

---

## 🌐 Deployment — Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps and is free for personal projects.

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/SmartQuizzer.git
git push -u origin main
```

> Make sure `.env.local` is in `.gitignore` — **never push API keys to GitHub.**

---

### Step 2 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Vercel auto-detects it as a Next.js project
4. Click **Environment Variables** and add all 4 keys from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_GENERATIVE_AI_API_KEY`
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app` in ~2 minutes.

---

### Step 3 — Update Supabase Auth Redirect URLs

After deploying, go to your Supabase project:
1. **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g. `https://smartquizzer.vercel.app`)
3. Add to **Redirect URLs**: `https://smartquizzer.vercel.app/**`

---

## 🗄️ Database Schema Overview

| Table | Purpose |
|-------|---------|
| `materials` | Stores uploaded study content (title, extracted text, file type) |
| `quizzes` | Stores AI-generated quiz questions (JSONB array) |
| `quiz_attempts` | Stores user answers, scores, and time per question |
| `analytics` | Stores topic performance, difficulty breakdown, and recommendations |

All tables have **Row Level Security (RLS)** — users can only access their own data.

---

## 🔑 API Keys Reference

| Key | Where to Get | Used For |
|-----|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Database connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | Server-side admin access |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) | Gemini AI quiz generation |

---

## 🐛 Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| `Upload Failed / Failed to fetch` | Make sure `npm run dev` is running and `.env.local` has all 4 keys |
| `Database error` on upload | Run `supabase-schema.sql` in Supabase SQL Editor |
| `Unauthorized — Please log in` | Sign up / log in at `/auth/sign-up` before uploading |
| `AI generation failed` | Check that `GOOGLE_GENERATIVE_AI_API_KEY` is valid and has quota |
| App works locally but not on Vercel | Make sure all env variables are added in Vercel project settings |

---

## 👤 Author

Built by **Bhavya T**.
