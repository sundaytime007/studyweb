import type { LucideIcon } from 'lucide-react'

export type FeatureStatus = 'active' | 'beta' | 'coming-soon'

export type Category =
  | 'All'
  | 'Development'
  | 'AI Tools'
  | 'Finance'
  | 'Media'
  | 'Productivity'
  | 'Education'

export interface Feature {
  id: string
  title: string
  description: string
  icon: LucideIcon
  category: Category
  status: FeatureStatus
  href?: string
  accentColor?: string
}
