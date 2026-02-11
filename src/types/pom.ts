/** Presentation Object Model — the data contract between AI and renderer */

export type SlideLayout =
  | 'title'
  | 'section'
  | 'content'
  | 'two_column'
  | 'closing'

export interface SlideData {
  title: string
  subtitle?: string
  bullets?: string[]
  left_title?: string
  left_bullets?: string[]
  right_title?: string
  right_bullets?: string[]
  closing_text?: string
}

export interface Slide {
  layout: SlideLayout
  data: SlideData
}

export interface PresentationMeta {
  title: string
  subtitle?: string
}

export interface POM {
  meta: PresentationMeta
  slides: Slide[]
}
