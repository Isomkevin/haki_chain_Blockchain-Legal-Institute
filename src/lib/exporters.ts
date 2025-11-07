import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun } from "docx"

export function exportToPDF(content: string, filename: string) {
  console.log("[exporters] exportToPDF invoked", { filename })
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  doc.setFont("Helvetica", "")
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  const usableWidth = pageWidth - margin * 2
  const lines = doc.splitTextToSize(content, usableWidth)

  let cursorY = 60
  const lineHeight = 20

  lines.forEach((line) => {
    if (cursorY > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      cursorY = margin
    }
    doc.text(line, margin, cursorY)
    cursorY += lineHeight
  })

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`)
}

export async function exportToDocx(content: string, filename: string) {
  console.log("[exporters] exportToDocx invoked", { filename })
  const paragraphs = content.split("\n").map((line) =>
    new Paragraph({
      children: [new TextRun({ text: line || " ", break: 0 })],
    })
  )

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  triggerBlobDownload(blob, filename.endsWith(".docx") ? filename : `${filename}.docx`)
}

export function sendToEmail(content: string, email?: string) {
  const targetEmail = email || window.prompt("Enter email address to send the document:") || ""
  if (!targetEmail) {
    console.log("[exporters] sendToEmail cancelled")
    return { sent: false }
  }

  console.log("[exporters] sendToEmail mocked", { email: targetEmail, length: content.length })
  return { sent: true, email: targetEmail }
}

export function sendToHakiDocs(content: string) {
  console.log("[exporters] sendToHakiDocs placeholder", { length: content.length })
  return { sent: true }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
