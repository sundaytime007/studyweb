import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Presentation,
  Sparkles,
  Download,
  Loader2,
  ChevronRight,
  LayoutList,
  Users,
  Palette,
  SlidersHorizontal,
} from 'lucide-react'
import type { POM } from '../types/pom'
import { buildPptx } from '../lib/pptxBuilder'
import ThemeToggle from './ThemeToggle'

const AUDIENCES = ['通用', '企业管理层', '技术团队', '投资人', '学生/教育']
const VIBES = [
  { id: 'professional', label: '商务专业', color: '#3B82F6' },
  { id: 'creative', label: '创意活力', color: '#A855F7' },
  { id: 'minimal', label: '极简清晰', color: '#6366F1' },
  { id: 'bold', label: '大胆醒目', color: '#F43F5E' },
]
const SLIDE_COUNTS = ['6-8', '8-12', '12-16']

type Step = 'input' | 'generating' | 'preview'

interface Props {
  onBack: () => void
}

export default function AIPptGenerator({ onBack }: Props) {
  const [step, setStep] = useState<Step>('input')
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState(AUDIENCES[0])
  const [vibe, setVibe] = useState(VIBES[0].id)
  const [slideCount, setSlideCount] = useState(SLIDE_COUNTS[1])
  const [pom, setPom] = useState<POM | null>(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  async function handleGenerate() {
    if (!topic.trim()) return
    setStep('generating')
    setError('')

    try {
      const res = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, audience, vibe, slideCount }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `API error ${res.status}`)
      }

      const data: POM = await res.json()
      setPom(data)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setStep('input')
    }
  }

  async function handleDownload() {
    if (!pom) return
    setDownloading(true)
    try {
      await buildPptx(pom, vibe)
    } catch {
      setError('PPTX 文件生成失败')
    } finally {
      setDownloading(false)
    }
  }

  const layoutLabels: Record<string, string> = {
    title: '封面',
    section: '章节页',
    content: '内容页',
    two_column: '双栏对比',
    closing: '结束页',
  }

  return (
    <div className="mesh-gradient relative min-h-screen">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <ArrowLeft className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
              <Presentation className="h-5 w-5 text-rose-500" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>
                AI 演示文稿生成器
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                DeepSeek V3 驱动 &middot; 输入主题，生成专业演示文稿
              </p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ===== Step 1: Input Form ===== */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Topic */}
              <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-heading)' }}>
                  <Sparkles className="h-4 w-4 text-rose-500" />
                  演示主题
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="例如：2025年Q3季度业务增长战略汇报"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--search-bg)',
                    border: '1px solid var(--search-border)',
                    color: 'var(--search-text)',
                  }}
                  autoFocus
                />
              </div>

              {/* Options grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Audience */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                >
                  <label className="mb-2 flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    <Users className="h-3.5 w-3.5" />
                    目标受众
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: 'var(--search-bg)',
                      border: '1px solid var(--search-border)',
                      color: 'var(--search-text)',
                    }}
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* Vibe */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                >
                  <label className="mb-2 flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    <Palette className="h-3.5 w-3.5" />
                    视觉风格
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {VIBES.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setVibe(v.id)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                          vibe === v.id
                            ? 'text-white shadow-sm'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          background: vibe === v.id ? v.color : 'var(--pill-bg)',
                          border: `1px solid ${vibe === v.id ? v.color : 'var(--pill-border)'}`,
                          color: vibe === v.id ? '#fff' : 'var(--pill-text)',
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slide count */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                >
                  <label className="mb-2 flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    页数范围
                  </label>
                  <div className="flex gap-1.5">
                    {SLIDE_COUNTS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSlideCount(c)}
                        className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          background: slideCount === c ? 'var(--glow-from)' : 'var(--pill-bg)',
                          border: `1px solid ${slideCount === c ? 'var(--glow-to)' : 'var(--pill-border)'}`,
                          color: slideCount === c ? 'var(--text-heading)' : 'var(--pill-text)',
                        }}
                      >
                        {c} 页
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:shadow-rose-500/30 disabled:opacity-40 disabled:shadow-none"
              >
                <Sparkles className="h-4 w-4" />
                生成演示文稿
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* ===== Step 2: Generating ===== */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-20"
            >
              <div className="relative mb-6">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-rose-500/20 border-t-rose-500" />
                <Presentation className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-rose-500" />
              </div>
              <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
                AI 正在构思演示大纲...
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                DeepSeek V3 正在生成逻辑严密的幻灯片结构，请稍候
              </p>
            </motion.div>
          )}

          {/* ===== Step 3: Preview + Download ===== */}
          {step === 'preview' && pom && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Meta */}
              <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <LayoutList className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    大纲预览 &middot; {pom.slides.length} 页
                  </span>
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
                  {pom.meta.title}
                </h2>
                {pom.meta.subtitle && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {pom.meta.subtitle}
                  </p>
                )}
              </div>

              {/* Slide list */}
              <div className="space-y-2">
                {pom.slides.map((slide, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex gap-3 rounded-xl p-3"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  >
                    <span
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ background: VIBES.find((v) => v.id === vibe)?.color ?? '#6366f1' }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-heading)' }}>
                          {slide.data.title}
                        </span>
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ background: 'var(--pill-bg)', color: 'var(--pill-text)' }}
                        >
                          {layoutLabels[slide.layout] ?? slide.layout}
                        </span>
                      </div>
                      {slide.data.bullets && slide.data.bullets.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {slide.data.bullets.map((b, j) => (
                            <li key={j} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              &bull; {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('input'); setPom(null); setError('') }}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-body)' }}
                >
                  重新生成
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:shadow-rose-500/30 disabled:opacity-60"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {downloading ? '生成中...' : '下载 PPTX'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
