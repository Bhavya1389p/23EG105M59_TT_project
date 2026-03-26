export type QuestionType = "mcq" | "true-false" | "short-answer" | "fill-blank"

export type DifficultyLevel = "easy" | "medium" | "hard"

export interface MCQQuestion {
  type: "mcq"
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: DifficultyLevel
  topic: string
}

export interface TrueFalseQuestion {
  type: "true-false"
  statement: string
  correctAnswer: boolean
  explanation: string
  difficulty: DifficultyLevel
  topic: string
}

export interface ShortAnswerQuestion {
  type: "short-answer"
  question: string
  acceptedAnswers: string[]
  explanation: string
  difficulty: DifficultyLevel
  topic: string
}

export interface FillBlankQuestion {
  type: "fill-blank"
  sentence: string
  blankPosition: number
  correctAnswer: string
  explanation: string
  difficulty: DifficultyLevel
  topic: string
}

export type Question = MCQQuestion | TrueFalseQuestion | ShortAnswerQuestion | FillBlankQuestion

export interface GeneratedQuiz {
  questions: Question[]
  title: string
  totalQuestions: number
  topics: string[]
}
