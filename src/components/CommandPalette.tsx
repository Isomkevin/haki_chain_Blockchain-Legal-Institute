import { useState, useMemo, useEffect } from "react"
import { Command, Search } from "lucide-react"

interface CommandItem {
  id: string
  label: string
  shortcut?: string
  action: () => void
}

const defaultItems: CommandItem[] = []

export function CommandPalette({ items = defaultItems }: { items?: CommandItem[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const commands = useMemo(() => items, [items])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"
      if (!isCmdK) return
      event.preventDefault()
      setIsOpen((prev) => !prev)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 py-10" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-legal-border">
        <div className="flex items-center gap-2 border-b border-legal-border px-4 py-3">
          <Search className="h-4 w-4 text-legal-muted" />
          <input
            className="flex-1 outline-none text-sm"
            placeholder="Type a command or search..."
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-legal-muted hover:text-legal-accent"
          >
            ESC
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto px-2 py-2 space-y-1 text-sm">
          {commands.length === 0 ? (
            <li className="px-3 py-2 text-legal-muted">No commands available.</li>
          ) : (
            commands.map((command) => (
              <li key={command.id}>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    command.action()
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-legal-accent/10 focus:outline-none focus:ring-2 focus:ring-legal-accent"
                >
                  <div className="flex items-center justify-between">
                    <span>{command.label}</span>
                    {command.shortcut && <span className="text-xs text-legal-muted">{command.shortcut}</span>}
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
