import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Video,
  Search,
  Download,
  Clock,
  User,
  Link2,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Info,
  AlertCircle,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

interface VideoInfo {
  title: string
  thumbnail: string
  duration: number
  videoUrl: string
  uploader: string
  originalUrl: string
}

type Step = 'input' | 'extracting' | 'result'

interface Props {
  onBack: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VideoExtractor({ onBack }: Props) {
  const [step, setStep] = useState<Step>('input')
  const [url, setUrl] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [error, setError] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  async function handleExtract() {
    const trimmed = url.trim()
    if (!trimmed) return
    setStep('extracting')
    setError('')

    try {
      const res = await fetch('/api/extract-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `接口错误 ${res.status}`)
      }

      const data: VideoInfo = await res.json()
      if (!data.videoUrl) {
        throw new Error('未能提取到视频下载地址')
      }
      setVideoInfo(data)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '提取失败')
      setStep('input')
    }
  }

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
      setIsPlaying(true)
    } else {
      v.pause()
      setIsPlaying(false)
    }
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setIsMuted(v.muted)
  }

  function handleReset() {
    setStep('input')
    setVideoInfo(null)
    setUrl('')
    setError('')
    setIsPlaying(false)
    setIsMuted(false)
    setShowPlayer(false)
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15">
              <Video className="h-5 w-5 text-pink-500" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>
                视频提取器
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                支持抖音等平台 &middot; 提取无水印原视频下载地址
              </p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ===== Step 1: Input ===== */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                <label
                  className="mb-2 flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--text-heading)' }}
                >
                  <Link2 className="h-4 w-4 text-pink-500" />
                  视频链接
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                  placeholder="粘贴抖音视频链接，例如：https://v.douyin.com/..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--search-bg)',
                    border: '1px solid var(--search-border)',
                    color: 'var(--search-text)',
                  }}
                  autoFocus
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                  支持抖音分享链接、抖音网页链接等格式
                </p>
              </div>

              {/* Usage Tips */}
              <div
                className="rounded-xl border p-4"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-sky-500" />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                    使用提示
                  </h3>
                </div>
                <div className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <p>
                    <strong>1. 获取链接：</strong>在抖音 App 中打开视频，点击「分享」按钮，选择「复制链接」
                  </p>
                  <p>
                    <strong>2. 粘贴提取：</strong>将链接粘贴到上方输入框，点击「提取视频」按钮
                  </p>
                  <p>
                    <strong>3. 下载保存：</strong>提取成功后点击「下载视频」即可保存到本地
                  </p>
                  <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="mb-0.5 mr-1 inline-block h-3 w-3" />
                    <strong>注意：</strong>如果提示需要登录信息，请确保在 Chrome 浏览器中已登录抖音账号
                  </p>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleExtract}
                disabled={!url.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition-all hover:shadow-pink-500/30 disabled:opacity-40 disabled:shadow-none"
              >
                <Search className="h-4 w-4" />
                提取视频
              </button>
            </motion.div>
          )}

          {/* ===== Step 2: Extracting ===== */}
          {step === 'extracting' && (
            <motion.div
              key="extracting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-20"
            >
              <div className="relative mb-6">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500" />
                <Video className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-pink-500" />
              </div>
              <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
                正在解析视频...
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                正在通过 yt-dlp 提取视频信息，请稍候
              </p>
            </motion.div>
          )}

          {/* ===== Step 3: Result ===== */}
          {step === 'result' && videoInfo && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Video preview card */}
              <div
                className="overflow-hidden rounded-2xl"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                {/* Video player / Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  {showPlayer ? (
                    <>
                      <video
                        ref={videoRef}
                        src={videoInfo.videoUrl}
                        poster={videoInfo.thumbnail}
                        className="h-full w-full object-contain"
                        onEnded={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                      {/* Player controls overlay */}
                      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
                        <button
                          onClick={togglePlay}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4 text-white" />
                          ) : (
                            <Play className="h-4 w-4 text-white" />
                          )}
                        </button>
                        <button
                          onClick={toggleMute}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4 text-white" />
                          ) : (
                            <Volume2 className="h-4 w-4 text-white" />
                          )}
                        </button>
                        {videoInfo.duration > 0 && (
                          <span className="ml-auto flex items-center gap-1 text-xs text-white/80">
                            <Clock className="h-3 w-3" />
                            {formatDuration(videoInfo.duration)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {videoInfo.thumbnail && (
                        <img
                          src={videoInfo.thumbnail}
                          alt={videoInfo.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                      {/* Play button overlay */}
                      <button
                        onClick={() => {
                          setShowPlayer(true)
                          setTimeout(() => {
                            videoRef.current?.play()
                          }, 100)
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-transform hover:scale-110">
                          <Play className="h-7 w-7 text-pink-600" style={{ marginLeft: 3 }} />
                        </div>
                      </button>
                      {videoInfo.duration > 0 && (
                        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs font-medium text-white">
                          <Clock className="h-3 w-3" />
                          {formatDuration(videoInfo.duration)}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="p-5">
                  <h2
                    className="mb-2 text-lg font-bold leading-snug"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    {videoInfo.title}
                  </h2>

                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {videoInfo.uploader && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {videoInfo.uploader}
                      </span>
                    )}
                    {videoInfo.originalUrl && (
                      <a
                        href={videoInfo.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-pink-500 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        查看原视频
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-body)' }}
                >
                  提取其他视频
                </button>
                <a
                  href={videoInfo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition-all hover:shadow-pink-500/30"
                >
                  <Download className="h-4 w-4" />
                  下载视频
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
