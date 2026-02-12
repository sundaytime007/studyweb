import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
    >
      <span className="theme-toggle-knob">
        {isDark ? (
          <Moon className="h-3 w-3 text-surface-400" />
        ) : (
          <Sun className="h-3 w-3 text-amber-500" />
        )}
      </span>
    </button>
  )
}
