import { Search } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface CommandPaletteProps {
  query: string
  onQueryChange: (query: string) => void
}

export default function CommandPalette({
  query,
  onQueryChange,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        onQueryChange('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onQueryChange])

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search tools..."
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-16 text-sm text-white placeholder-surface-500 outline-none backdrop-blur-sm transition-colors focus:border-primary-500/40 focus:bg-white/[0.06]"
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/[0.1] bg-white/[0.05] px-2 py-0.5 text-[11px] text-surface-500">
        Ctrl+K
      </kbd>
    </div>
  )
}
