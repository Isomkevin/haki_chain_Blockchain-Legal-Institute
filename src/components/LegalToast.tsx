import { useToast } from "../../components/ui/use-toast"
import { useEffect } from "react"

interface LegalToastProps {
  title: string
  description?: string
  variant?: "default" | "success" | "error" | "warning"
  duration?: number
}

const variantClasses: Record<NonNullable<LegalToastProps["variant"]>, string> = {
  default: "bg-white text-legal-base border border-legal-border",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  error: "bg-red-50 text-red-700 border border-red-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
}

export function useLegalToast() {
  const { toast } = useToast()

  return ({ title, description, variant = "default", duration = 4000 }: LegalToastProps) => {
    toast({
      title,
      description,
      duration,
      className: `${variantClasses[variant]} shadow-lg rounded-lg px-4 py-3`,
    })
  }
}
