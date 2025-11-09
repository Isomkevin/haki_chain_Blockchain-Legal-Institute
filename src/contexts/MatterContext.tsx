import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react"

interface Matter {
  id: string
  name: string
  client: string
}

interface MatterContextValue {
  matters: Matter[]
  activeMatter?: Matter
  setActiveMatter: (id: string) => void
}

const MatterContext = createContext<MatterContextValue | undefined>(undefined)

const DEFAULT_MATTERS: Matter[] = [
  { id: "default", name: "General", client: "Portfolio" },
]

export function MatterProvider({ children }: { children: ReactNode }) {
  const [matters, setMatters] = useState<Matter[]>(DEFAULT_MATTERS)
  const [activeMatterId, setActiveMatterId] = useState("default")

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("hakichain-active-matter")
    if (stored) {
      setActiveMatterId(stored)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("hakichain-active-matter", activeMatterId)
  }, [activeMatterId])

  const setActiveMatter = (id: string) => {
    setActiveMatterId(id)
  }

  const value = useMemo(() => {
    const activeMatter = matters.find((matter) => matter.id === activeMatterId)
    return { matters, activeMatter, setActiveMatter }
  }, [matters, activeMatterId])

  return <MatterContext.Provider value={value}>{children}</MatterContext.Provider>
}

export function useMatter() {
  const context = useContext(MatterContext)
  if (!context) {
    throw new Error("useMatter must be used within a MatterProvider")
  }
  return context
}
