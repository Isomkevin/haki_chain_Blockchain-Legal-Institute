const DEFAULT_FIRM_NAME = "HakiChain Advocates LLP"
const DEFAULT_FIRM_ADDRESS = "1st Floor, Haki Towers, Parliament Road, Nairobi"
const DEFAULT_FIRM_CONTACT = "P.O. Box 12345-00100 Nairobi | Tel: +254 700 000000 | Email: info@hakichain.com"

export interface LegalLetterContext {
  documentTitle: string
  firmName?: string
  firmAddress?: string
  firmContact?: string
  recipientName?: string
  recipientCompany?: string
  recipientAddress?: string
  subject?: string
  body: string
  signerName?: string
  signerTitle?: string
  cc?: string[]
  date?: Date
}

export function sanitizeLegalContent(raw: string): string {
  if (!raw) return ""

  let text = raw.replace(/\r/g, "")

  text = text.replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
  text = text.replace(/`([^`]+)`/g, "$1")
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1")
  text = text.replace(/__([^_]+)__/g, "$1")
  text = text.replace(/\*([^*]+)\*/g, "$1")
  text = text.replace(/_([^_]+)_/g, "$1")
  text = text.replace(/^#+\s*/gm, "")
  text = text.replace(/^>\s*/gm, "")
  text = text.replace(/^[-*+]\s+/gm, "")
  text = text.replace(/\|/g, "")
  text = text.replace(/-{3,}/g, "")
  text = text.replace(/\n{3,}/g, "\n\n")
  text = text.replace(/[ \t]+\n/g, "\n")
  text = text.replace(/[\u2013\u2014]/g, "-")
  text = text.replace(/\s+$/g, "")

  return text.trim()
}

function formatDate(date?: Date): string {
  const target = date ?? new Date()
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(target)
}

function underscore(value?: string, label?: string): string {
  if (value && value.trim().length > 0) {
    return value.trim()
  }
  const length = label ? Math.max(label.length + 5, 12) : 20
  return "_".repeat(length)
}

function buildNumberedBody(cleanBody: string): string {
  const paragraphs = cleanBody
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return "1. ____________________\n\n2. ____________________"
  }

  let clauseCounter = 1
  const formatted: string[] = []

  paragraphs.forEach((paragraph) => {
    const lines = paragraph.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    if (lines.length === 0) return

    const mainPoint = lines[0]
    formatted.push(`${clauseCounter}. ${mainPoint}`)

    if (lines.length > 1) {
      const subPoints = lines.slice(1)
      subPoints.forEach((subPoint, index) => {
        const letter = String.fromCharCode("a".charCodeAt(0) + index)
        formatted.push(`   (${letter}) ${subPoint}`)
      })
    }

    formatted.push("")
    clauseCounter += 1
  })

  return formatted.join("\n").trim()
}

export function formatLegalLetter(context: LegalLetterContext): string {
  const {
    documentTitle,
    firmName,
    firmAddress,
    firmContact,
    recipientName,
    recipientCompany,
    recipientAddress,
    subject,
    body,
    signerName,
    signerTitle,
    cc,
    date,
  } = context

  const cleanBody = sanitizeLegalContent(body)
  const numberedBody = buildNumberedBody(cleanBody)

  const header = [
    (firmName || DEFAULT_FIRM_NAME).toUpperCase(),
    firmAddress || DEFAULT_FIRM_ADDRESS,
    firmContact || DEFAULT_FIRM_CONTACT,
  ].join("\n")

  const titleLine = documentTitle.toUpperCase()

  const recipientBlockLines = [
    underscore(recipientName, "Recipient Name"),
    recipientCompany ? recipientCompany : "",
    recipientAddress ? recipientAddress : "____________________ (Recipient Address)",
  ].filter(Boolean)

  const subjectLine = subject
    ? `RE: ${subject.toUpperCase()}`
    : `RE: ${documentTitle.toUpperCase()}`

  const closingBlock = [
    "Yours faithfully,",
    "",
    "______________________________",
    signerName ? signerName.toUpperCase() : "", 
    signerTitle || "For: _________________",
  ].filter(Boolean)

  const ccBlock = cc && cc.length > 0 ? `\nCC: ${cc.join(", ")}` : ""

  const sections = [
    header,
    "",
    formatDate(date),
    "",
    recipientBlockLines.join("\n"),
    "",
    subjectLine,
    "",
    titleLine,
    "",
    numberedBody,
    "",
    closingBlock.join("\n"),
    ccBlock,
  ].filter((section) => section !== undefined && section !== "")

  return sections.join("\n\n")
}

export function formatAnalysisResponse(raw: string): string {
  if (!raw) return ""

  let text = raw.replace(/\r/g, "")

  text = text.replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1")
  text = text.replace(/__([^_]+)__/g, "$1")
  text = text.replace(/\*([^*]+)\*/g, "$1")
  text = text.replace(/_([^_]+)_/g, "$1")
  text = text.replace(/^#+\s*/gm, "")

  const tableProcessedLines: string[] = []
  const lines = text.split("\n")
  let lastLineWasTable = false

  lines.forEach((line) => {
    if (/^\s*\|/.test(line)) {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean)

      if (cells.length === 0) {
        return
      }

      if (cells.every((cell) => /^[-]+$/.test(cell))) {
        return
      }

      tableProcessedLines.push(`• ${cells.join(" — ")}`)
      lastLineWasTable = true
    } else {
      if (lastLineWasTable && line.trim() === "") {
        return
      }
      tableProcessedLines.push(line)
      lastLineWasTable = false
    }
  })

  text = tableProcessedLines.join("\n")

  text = text.replace(/^-\s+/gm, "• ")
  text = text.replace(/^\s*\d+\.\s+/gm, (match) => match.trim())
  text = text.replace(/^\s*\n/gm, "")
  text = text.replace(/\n{3,}/g, "\n\n")

  return text.trim()
}
