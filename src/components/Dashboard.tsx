import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Boxes } from 'lucide-react'
import { featuresConfig, categories } from '../config/featuresConfig'
import type { Category } from '../types/features'
import CommandPalette from './CommandPalette'
import CategoryFilter from './CategoryFilter'
import FeatureCard from './FeatureCard'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'

interface DashboardProps {
  onNavigate?: (featureId: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('全部')

  const filteredFeatures = useMemo(() => {
    return featuresConfig.filter((feature) => {
      const matchesQuery =
        query === '' ||
        feature.title.toLowerCase().includes(query.toLowerCase()) ||
        feature.description.toLowerCase().includes(query.toLowerCase())

      const matchesCategory =
        selectedCategory === '全部' || feature.category === selectedCategory

      return matchesQuery && matchesCategory
    })
  }, [query, selectedCategory])

  const activeCount = featuresConfig.filter((f) => f.status === 'active').length
  const totalCount = featuresConfig.length

  return (
    <div className="mesh-gradient relative min-h-screen">
      <Sidebar features={featuresConfig} />

      {/* Theme toggle — fixed top-right */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-600 dark:text-primary-300"
          >
            <Boxes className="h-4 w-4" />
            已上线 {activeCount} 个 &middot; 共 {totalCount} 个工具
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(to right, var(--text-heading), var(--text-muted))',
              }}
            >
              个人工作台
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-600">
              & 工具集
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="mx-auto max-w-lg">
            集开发、AI、金融和影音工具于一体的个人中心。
            你需要的一切，尽在此处。
          </p>
        </motion.header>

        {/* Search + Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-8 flex flex-col items-center gap-5"
        >
          <CommandPalette query={query} onQueryChange={setQuery} />
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={(cat) => {
              setSelectedCategory(cat)
              setQuery('')
            }}
          />
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredFeatures.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} onNavigate={onNavigate} />
          ))}
        </div>

        {/* Empty state */}
        {filteredFeatures.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <p className="text-lg" style={{ color: 'var(--text-faint)' }}>
              没有找到匹配的工具。
            </p>
            <button
              onClick={() => {
                setQuery('')
                setSelectedCategory('全部')
              }}
              className="mt-3 text-sm text-primary-500 hover:text-primary-400"
            >
              清除筛选
            </button>
          </motion.div>
        )}

        {/* Footer */}
        <footer
          className="mt-16 py-6 text-center text-xs"
          style={{ borderTop: '1px solid var(--footer-border)', color: 'var(--footer-text)' }}
        >
          基于 React、Tailwind CSS 和 Framer Motion 构建
        </footer>
      </main>
    </div>
  )
}
