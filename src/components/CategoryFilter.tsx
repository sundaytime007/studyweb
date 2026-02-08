import { motion } from 'framer-motion'
import type { Category } from '../types/features'

interface CategoryFilterProps {
  categories: Category[]
  selected: Category
  onSelect: (category: Category) => void
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const isActive = selected === cat
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`relative rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-primary-500/40 bg-primary-500/15 text-primary-300'
                : 'border-white/[0.06] bg-white/[0.03] text-surface-400 hover:border-white/[0.12] hover:text-surface-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activePill"
                className="absolute inset-0 rounded-full border border-primary-500/40 bg-primary-500/15"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{cat}</span>
          </button>
        )
      })}
    </div>
  )
}
