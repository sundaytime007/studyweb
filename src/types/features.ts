import type { LucideIcon } from 'lucide-react'

export type FeatureStatus = 'active' | 'beta' | 'coming-soon'

export type Category =
  | '全部'
  | '开发工具'
  | 'AI 工具'
  | '金融理财'
  | '影音媒体'
  | '效率办公'
  | '教育学习'

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
