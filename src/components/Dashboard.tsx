import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Boxes } from 'lucide-react'
import { featuresConfig, categories } from '../config/featuresConfig'
import type { Category } from '../types/features'
import CommandPalette from './CommandPalette'
import CategoryFilter from './CategoryFilter'
import FeatureCard from './FeatureCard'
import Sidebar from './Sidebar'

export default function Dashboard() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('All')

  const filteredFeatures = useMemo(() => {
    return featuresConfig.filter((feature) => {
      const matchesQuery =
        query === '' ||
        feature.title.toLowerCase().includes(query.toLowerCase()) ||
        feature.description.toLowerCase().includes(query.toLowerCase())

      const matchesCategory =
        selectedCategory === 'All' || feature.category === selectedCategory

      return matchesQuery && matchesCategory
    })
  }, [query, selectedCategory])

  const activeCount = featuresConfig.filter((f) => f.status === 'active').length
  const totalCount = featuresConfig.length

  return (
    <div className="mesh-gradient relative min-h-screen text-white">
      <Sidebar features={featuresConfig} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-300">
            <Boxes className="h-4 w-4" />
            {activeCount} Active &middot; {totalCount} Total Tools
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-white via-white to-surface-400 bg-clip-text text-transparent">
              Personal Workspace
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              & Tool Suite
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-surface-400">
            Your centralized hub for development, AI, finance, and media tools.
            Everything you need in one place.
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
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>

        {/* Empty state */}
        {filteredFeatures.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <p className="text-lg text-surface-500">
              No tools match your search.
            </p>
            <button
              onClick={() => {
                setQuery('')
                setSelectedCategory('All')
              }}
              className="mt-3 text-sm text-primary-400 hover:text-primary-300"
            >
              Clear filters
            </button>
          </motion.div>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-white/[0.06] py-6 text-center text-xs text-surface-600">
          Built with React, Tailwind CSS, and Framer Motion
        </footer>
      </main>
    </div>
  )
}
