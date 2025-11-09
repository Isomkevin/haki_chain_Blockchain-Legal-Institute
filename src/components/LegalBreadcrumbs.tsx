import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface LegalBreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function LegalBreadcrumbs({ items, className }: LegalBreadcrumbsProps) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-sm text-legal-muted ${className || ""}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="flex items-center">
            {item.href && !isLast ? (
              <Link to={item.href} className="hover:text-legal-accent focus:outline-none focus:ring-2 focus:ring-legal-accent/40 rounded">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-legal-base">{item.label}</span>
            )}
            {!isLast && <ChevronRight className="mx-2 h-4 w-4 text-legal-border" />}
          </span>
        )
      })}
    </nav>
  )
}
