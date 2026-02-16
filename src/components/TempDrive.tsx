import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  HardDrive,
  Upload,
  Download,
  Copy,
  Check,
  File as FileIcon,
  Clock,
  CloudUpload,
  Search,
  Info,
  AlertCircle,
  RotateCcw,
  Shield,
  Trash2,
  Hash,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { getUsage, checkUsageLimit, incrementUsage } from '../lib/usageLimit'

type Tab = 'upload' | 'retrieve'
type UploadStep = 'select' | 'uploading' | 'done'
type RetrieveStep = 'input' | 'loading' | 'result'

interface FileInfoData {
  name: string
  size: number
  expiresIn: number
  downloads: number
}

interface Props {
  onBack: () => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '已过期'
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`
  return `${minutes} 分钟`
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

export default function TempDrive({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>('upload')

  // Upload state
  const [uploadStep, setUploadStep] = useState<UploadStep>('select')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractionCode, setExtractionCode] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Retrieve state
  const [retrieveStep, setRetrieveStep] = useState<RetrieveStep>('input')
  const [code, setCode] = useState('')
  const [fileInfo, setFileInfo] = useState<FileInfoData | null>(null)
  const [retrieveCode, setRetrieveCode] = useState('')

  // Shared
  const [error, setError] = useState('')
  
  // Usage limit
  const [usage, setUsage] = useState({ count: 0, remaining: 200 })
  
  useEffect(() => {
    // Update usage on component mount
    setUsage(getUsage('temp-drive'))
  }, [])

  // ===== Upload handlers =====

  function handleFileSelect(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setError(`文件大小 ${formatSize(file.size)} 超过 100MB 限制`)
      return
    }
    setError('')
    setSelectedFile(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUpload() {
    if (!selectedFile) return
    
    // Check usage limit
    if (!checkUsageLimit('temp-drive')) {
      setError('今日上传次数已达上限 (200次)')
      return
    }
    
    setUploadStep('uploading')
    setError('')

    try {
      const res = await fetch('/api/temp-drive/upload', {
        method: 'POST',
        headers: { 'X-File-Name': encodeURIComponent(selectedFile.name) },
        body: selectedFile,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `上传失败 (${res.status})`)
      }

      // Increment usage after successful upload
      incrementUsage('temp-drive')
      setUsage(getUsage('temp-drive'))

      const data = await res.json()
      setExtractionCode(data.code)
      setUploadStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
      setUploadStep('select')
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(extractionCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = extractionCode
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleUploadReset() {
    setUploadStep('select')
    setSelectedFile(null)
    setExtractionCode('')
    setError('')
    setCopied(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ===== Retrieve handlers =====

  async function handleRetrieve() {
    const trimmed = code.trim()
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setError('请输入 6 位数字提取码')
      return
    }

    setRetrieveStep('loading')
    setError('')

    try {
      const res = await fetch(`/api/temp-drive/info/${trimmed}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `查询失败 (${res.status})`)
      }

      const data: FileInfoData = await res.json()
      setFileInfo(data)
      setRetrieveCode(trimmed)
      setRetrieveStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败')
      setRetrieveStep('input')
    }
  }

  function handleRetrieveReset() {
    setRetrieveStep('input')
    setCode('')
    setFileInfo(null)
    setRetrieveCode('')
    setError('')
  }

  // ===== Render =====

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
              <HardDrive className="h-5 w-5 text-sky-500" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>
                临时网盘
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                上传文件获取取件码 &middot; 凭码提取下载
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                今日剩余上传次数: {usage.remaining}/200
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 flex gap-2 rounded-xl p-1"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <button
            onClick={() => { setTab('upload'); setError('') }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              tab === 'upload'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : ''
            }`}
            style={tab !== 'upload' ? { color: 'var(--text-muted)' } : undefined}
          >
            <Upload className="h-4 w-4" />
            上传文件
          </button>
          <button
            onClick={() => { setTab('retrieve'); setError('') }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              tab === 'retrieve'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : ''
            }`}
            style={tab !== 'retrieve' ? { color: 'var(--text-muted)' } : undefined}
          >
            <Search className="h-4 w-4" />
            提取文件
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ===== Upload: Select file ===== */}
          {tab === 'upload' && uploadStep === 'select' && (
            <motion.div
              key="upload-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                  isDragging
                    ? 'border-sky-500 bg-sky-500/10'
                    : selectedFile
                      ? 'border-sky-500/40'
                      : ''
                }`}
                style={
                  !isDragging && !selectedFile
                    ? { borderColor: 'var(--card-border)', background: 'var(--card-bg)' }
                    : !isDragging && selectedFile
                      ? { background: 'var(--card-bg)' }
                      : undefined
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                />

                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15">
                      <FileIcon className="h-7 w-7 text-sky-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {selectedFile.name}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatSize(selectedFile.size)}
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                      点击重新选择文件
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15">
                      <CloudUpload className="h-7 w-7 text-sky-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                        拖拽文件到此处，或点击选择
                      </p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        支持任意类型文件，最大 100MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:shadow-sky-500/30 disabled:opacity-40 disabled:shadow-none"
              >
                <Upload className="h-4 w-4" />
                上传并获取取件码
              </button>
            </motion.div>
          )}

          {/* ===== Upload: Uploading ===== */}
          {tab === 'upload' && uploadStep === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-20"
            >
              <div className="relative mb-6">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-sky-500/20 border-t-sky-500" />
                <CloudUpload className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-sky-500" />
              </div>
              <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
                正在上传文件...
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                请稍候，文件正在上传至服务器
              </p>
            </motion.div>
          )}

          {/* ===== Upload: Done ===== */}
          {tab === 'upload' && uploadStep === 'done' && (
            <motion.div
              key="upload-done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                {/* Success icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="h-7 w-7 text-emerald-500" />
                </div>
                <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
                  上传成功！
                </h2>
                <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                  请将取件码分享给需要下载此文件的人
                </p>

                {/* Code display - individual digits */}
                <div className="mb-4">
                  <p
                    className="mb-3 text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-faint)' }}
                  >
                    您的取件码
                  </p>
                  <div className="flex justify-center gap-2">
                    {extractionCode.split('').map((digit, i) => (
                      <div
                        key={i}
                        className="flex h-14 w-11 items-center justify-center rounded-xl text-2xl font-bold"
                        style={{
                          background: 'var(--search-bg)',
                          border: '1px solid var(--search-border)',
                          color: 'var(--text-heading)',
                        }}
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Copy button */}
                <button
                  onClick={handleCopyCode}
                  className={`mx-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    copied
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-sky-500/15 text-sky-500 hover:bg-sky-500/25'
                  }`}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? '已复制到剪贴板' : '一键复制取件码'}
                </button>

                {/* File info summary */}
                <div
                  className="mt-6 flex flex-wrap justify-center gap-4 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="flex items-center gap-1">
                    <FileIcon className="h-3 w-3" />
                    {selectedFile?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {selectedFile && formatSize(selectedFile.size)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    有效期 24 小时
                  </span>
                </div>
              </div>

              <button
                onClick={handleUploadReset}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-body)',
                }}
              >
                <RotateCcw className="h-4 w-4" />
                继续上传其他文件
              </button>
            </motion.div>
          )}

          {/* ===== Retrieve: Input ===== */}
          {tab === 'retrieve' && retrieveStep === 'input' && (
            <motion.div
              key="retrieve-input"
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
                  <Hash className="h-4 w-4 text-sky-500" />
                  提取码
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setCode(val)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleRetrieve()}
                  placeholder="输入 6 位取件码"
                  maxLength={6}
                  className="w-full rounded-xl px-4 py-3 text-center text-2xl font-bold outline-none transition-colors"
                  style={{
                    background: 'var(--search-bg)',
                    border: '1px solid var(--search-border)',
                    color: 'var(--search-text)',
                    letterSpacing: '0.5em',
                  }}
                  autoFocus
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                  输入上传者提供的 6 位数字取件码
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleRetrieve}
                disabled={code.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:shadow-sky-500/30 disabled:opacity-40 disabled:shadow-none"
              >
                <Search className="h-4 w-4" />
                提取文件
              </button>
            </motion.div>
          )}

          {/* ===== Retrieve: Loading ===== */}
          {tab === 'retrieve' && retrieveStep === 'loading' && (
            <motion.div
              key="retrieve-loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-20"
            >
              <div className="relative mb-6">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-sky-500/20 border-t-sky-500" />
                <Search className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-sky-500" />
              </div>
              <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
                正在查询文件...
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                正在验证取件码并获取文件信息
              </p>
            </motion.div>
          )}

          {/* ===== Retrieve: Result ===== */}
          {tab === 'retrieve' && retrieveStep === 'result' && fileInfo && (
            <motion.div
              key="retrieve-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/15">
                    <FileIcon className="h-6 w-6 text-sky-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-base font-bold"
                      style={{ color: 'var(--text-heading)' }}
                    >
                      {fileInfo.name}
                    </h3>
                    <div
                      className="mt-2 flex flex-wrap gap-3 text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatSize(fileInfo.size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        剩余 {formatTimeRemaining(fileInfo.expiresIn)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        已下载 {fileInfo.downloads} 次
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRetrieveReset}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-body)',
                  }}
                >
                  提取其他文件
                </button>
                <a
                  href={`/api/temp-drive/download/${retrieveCode}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:shadow-sky-500/30"
                >
                  <Download className="h-4 w-4" />
                  立即下载
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Usage Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-10 rounded-2xl p-5"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-500" />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
              使用指南
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sm font-bold text-sky-500">
                1
              </div>
              <h4 className="text-sm font-medium" style={{ color: 'var(--text-heading)' }}>
                上传文件
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                选择或拖拽文件到上传区域，支持任意格式，单个文件最大 100MB。
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sm font-bold text-sky-500">
                2
              </div>
              <h4 className="text-sm font-medium" style={{ color: 'var(--text-heading)' }}>
                分享取件码
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                上传成功后系统自动生成 6 位数字取件码，将取件码发送给需要文件的人。
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sm font-bold text-sky-500">
                3
              </div>
              <h4 className="text-sm font-medium" style={{ color: 'var(--text-heading)' }}>
                提取下载
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                切换到「提取文件」标签页，输入 6 位取件码即可查看文件信息并下载。文件有效期为 24 小时。
              </p>
            </div>
          </div>

          <div
            className="mt-4 flex flex-wrap gap-3 rounded-xl p-3 text-xs"
            style={{ background: 'var(--search-bg)', color: 'var(--text-faint)' }}
          >
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              文件将在 24 小时后自动删除
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              单文件最大 100MB
            </span>
            <span className="flex items-center gap-1">
              <Trash2 className="h-3 w-3" />
              过期文件自动清理
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
