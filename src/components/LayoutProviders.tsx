import { ReactNode } from "react"
import { Toaster } from "../../components/ui/toaster"
import { CommandPalette } from "./CommandPalette"
import { MatterProvider } from "../contexts/MatterContext"

interface LayoutProvidersProps {
  children: ReactNode
}

export function LayoutProviders({ children }: LayoutProvidersProps) {
  return (
    <MatterProvider>
      <div className="min-h-screen bg-legal-bg text-legal-base">
        {children}
        <Toaster />
        <CommandPalette />
      </div>
    </MatterProvider>
  )
}
