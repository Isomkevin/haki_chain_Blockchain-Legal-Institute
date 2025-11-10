export type ResearchMode = "auto-detect" | "listing-crawl" | "single-case"

export interface SuggestedUrl {
  url: string
  description: string
  type: "listing" | "single" | string
}

export interface KenyaLawDocument {
  title?: string
  url?: string
  content?: string
  content_length?: number
  [key: string]: unknown
}

export interface KenyaLawResearchResponse {
  document_id: string
  total_pages: number
  duration?: number
  results?: KenyaLawDocument[]
}


