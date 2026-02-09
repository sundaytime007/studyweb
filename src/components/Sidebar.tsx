import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PanelLeftClose,
  PanelLeft,
  Clock,
  Star,
} from 'lucide-react'
import type { Feature } from '../types/features'

interface SidebarProps {
  features: Feature[]
}

export default function Sidebar({ features }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const recentTools = features.filter((f) => f.status === 'active').slice(0, 5)
  const favoriteTools = features.filter((f) => f.status === 'beta').slice(0, 3)

  return (
    <>
      {/* Toggle button — visible on larger screens */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 hidden rounded-lg p-2 backdrop-blur-sm transition-colors lg:block"
        style={{
          background: 'var(--sidebar-btn-bg)',
          border: '1px solid var(--sidebar-border)',
          color: 'var(--text-muted)',
        }}
      >
        {isOpen ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeft className="h-4 w-4" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            className="fixed left-0 top-0 z-40 hidden h-full w-64 p-5 pt-16 backdrop-blur-xl lg:block"
            style={{
              background: 'var(--sidebar-bg)',
              borderRight: '1px solid var(--sidebar-border)',
            }}
          >
            {/* Quick Access */}
            <div className="mb-6">
              <div
                className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-faint)' }}
              >
                <Clock className="h-3.5 w-3.5" />
                Quick Access
              </div>
              <ul className="space-y-1">
                {recentTools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <li key={tool.id}>
                      <button
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                        style={{ color: 'var(--text-body)' }}
                      >
                        <Icon className="h-4 w-4" style={{ color: tool.accentColor }} strokeWidth={1.8} />
                        {tool.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* In Beta */}
            <div>
              <div
                className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-faint)' }}
              >
                <Star className="h-3.5 w-3.5" />
                In Beta
              </div>
              <ul className="space-y-1">
                {favoriteTools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <li key={tool.id}>
                      <button
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                        style={{ color: 'var(--text-body)' }}
                      >
                        <Icon className="h-4 w-4" style={{ color: tool.accentColor }} strokeWidth={1.8} />
                        {tool.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
