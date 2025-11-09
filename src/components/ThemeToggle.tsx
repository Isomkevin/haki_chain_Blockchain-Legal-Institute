import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem("hakichain-theme")
    if (stored) {
      setIsDark(stored === "dark")
      document.documentElement.classList.toggle("dark", stored === "dark")
    }
  }, [])

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle("dark", next)
      window.localStorage.setItem("hakichain-theme", next ? "dark" : "light")
      return next
    })
  }

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-legal-border text-legal-muted hover:text-legal-accent hover:border-legal-accent focus:outline-none focus:ring-2 focus:ring-legal-accent"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
