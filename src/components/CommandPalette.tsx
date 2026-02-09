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
      <Search
        className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: 'var(--search-placeholder)' }}
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search tools..."
        className="w-full cursor-none rounded-xl py-2.5 pl-10 pr-16 text-sm outline-none backdrop-blur-sm transition-colors"
        style={{
          background: 'var(--search-bg)',
          border: '1px solid var(--search-border)',
          color: 'var(--search-text)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--search-focus-border)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--search-border)'
        }}
      />
      <kbd
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-0.5 text-[11px]"
        style={{
          background: 'var(--kbd-bg)',
          border: '1px solid var(--kbd-border)',
          color: 'var(--kbd-text)',
        }}
      >
        Ctrl+K
      </kbd>
    </div>
  )
}
