import { ReactNode } from "react"

interface LegalBadgeProps {
  children: ReactNode
  icon?: ReactNode
  tone?: "default" | "accent" | "danger"
  className?: string
}

const toneClasses: Record<NonNullable<LegalBadgeProps['tone']>, string> = {
  default: "border-legal-border text-legal-accent",
  accent: "border-legal-accent text-legal-accent bg-legal-accent/10",
  danger: "border-legal-danger text-legal-danger bg-legal-danger/10",
}

export function LegalBadge({ children, icon, tone = "default", className }: LegalBadgeProps) {
  return (
    <span
      className={`legal-badge ${toneClasses[tone]} ${className || ""}`.trim()}
      role="status"
    >
      {icon ? <span className="inline-flex items-center">{icon}</span> : null}
      {children}
    </span>
  )
}
