import { motion } from 'framer-motion'
import type { Feature } from '../types/features'

const statusStyles: Record<Feature['status'], { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  beta: {
    label: 'Beta',
    className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  'coming-soon': {
    label: 'Coming Soon',
    className: 'bg-surface-500/15 text-surface-500 dark:text-surface-400 border-surface-500/30',
  },
}

interface FeatureCardProps {
  feature: Feature
  index: number
}

export default function FeatureCard({ feature, index }: FeatureCardProps) {
  const { icon: Icon, title, description, status, accentColor } = feature
  const statusInfo = statusStyles[status]
  const isDisabled = status === 'coming-soon'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={isDisabled ? undefined : { scale: 1.02, y: -4 }}
      className={`card-glow group relative rounded-2xl backdrop-blur-sm transition-colors ${
        isDisabled ? 'pointer-events-none opacity-50' : ''
      }`}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          const el = e.currentTarget
          el.style.background = 'var(--card-bg-hover)'
          el.style.borderColor = 'var(--card-border-hover)'
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.background = 'var(--card-bg)'
        el.style.borderColor = 'var(--card-border)'
      }}
    >
      <div className="p-5">
        {/* Icon with glow */}
        <div className="mb-4 flex items-start justify-between">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${accentColor}15`,
              boxShadow: isDisabled ? 'none' : `0 0 20px ${accentColor}20`,
            }}
          >
            <Icon
              className="h-5 w-5"
              style={{ color: accentColor }}
              strokeWidth={1.8}
            />
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Content */}
        <h3
          className="mb-1 text-[15px] font-semibold"
          style={{ color: 'var(--text-heading)' }}
        >
          {title}
        </h3>
        <p
          className="text-[13px] leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          {description}
        </p>
      </div>

      {/* Hover accent line */}
      {!isDisabled && (
        <div
          className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full transition-all duration-300 group-hover:w-1/2"
          style={{ backgroundColor: accentColor }}
        />
      )}
    </motion.div>
  )
}
