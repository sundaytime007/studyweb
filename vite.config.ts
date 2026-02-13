import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { execFile } from 'child_process'
import { randomInt } from 'crypto'
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  createReadStream,
} from 'fs'
import { join, extname } from 'path'

/**
 * Vite dev-server middleware that proxies POST /api/generate-slides
 * to the DeepSeek API. The API key stays server-side and is never
 * shipped to the browser.
 */
function deepseekProxy(apiKey: string): Plugin {
  return {
    name: 'deepseek-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/generate-slides',
        async (req: IncomingMessage, res: ServerResponse, next) => {
          if (req.method !== 'POST') return next()

          try {
            // Parse request body
            const body: string = await new Promise((resolve) => {
              let data = ''
              req.on('data', (chunk: Buffer) => (data += chunk.toString()))
              req.on('end', () => resolve(data))
            })
            const { topic, audience, vibe, slideCount } = JSON.parse(body)

            const systemPrompt = `You are an expert presentation architect. Given a topic, generate a complete professional presentation.

Return a JSON object with this EXACT structure:
{
  "meta": {
    "title": "Presentation title",
    "subtitle": "A concise subtitle"
  },
  "slides": [
    {
      "layout": "title | section | content | two_column | closing",
      "data": {
        "title": "Slide title",
        "subtitle": "Optional subtitle",
        "bullets": ["Point 1", "Point 2"],
        "left_title": "Left column title (two_column only)",
        "left_bullets": ["..."],
        "right_title": "Right column title (two_column only)",
        "right_bullets": ["..."],
        "closing_text": "Closing message (closing only)"
      }
    }
  ]
}

Rules:
- Generate ${slideCount || '8-12'} slides total.
- First slide MUST use "title" layout.
- Last slide MUST use "closing" layout.
- Use "section" layout to introduce each major topic.
- Each "content" slide has 3-5 bullets, each bullet under 20 words.
- Respond in the SAME language as the user's topic.
- Audience: ${audience || 'general'}.
- Tone/vibe: ${vibe || 'professional'}.
- ONLY return valid JSON, nothing else.`

            const apiRes = await fetch(
              'https://api.deepseek.com/v1/chat/completions',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: 'deepseek-chat',
                  response_format: { type: 'json_object' },
                  temperature: 0.7,
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Topic: ${topic}` },
                  ],
                }),
              },
            )

            if (!apiRes.ok) {
              const errText = await apiRes.text()
              res.statusCode = apiRes.status
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: errText }))
              return
            }

            const data = (await apiRes.json()) as {
              choices?: { message?: { content?: string } }[]
            }
            const content = data.choices?.[0]?.message?.content
            if (!content) {
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'DeepSeek 返回了空响应' }))
              return
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(content)
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : '未知错误',
              }),
            )
          }
        },
      )
    },
  }
}

/**
 * Vite dev-server middleware that extracts video info from Douyin/TikTok URLs
 * using yt-dlp. Runs entirely server-side.
 */
function videoExtractorProxy(): Plugin {
  return {
    name: 'video-extractor-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/extract-video',
        async (req: IncomingMessage, res: ServerResponse, next) => {
          if (req.method !== 'POST') return next()

          try {
            const body: string = await new Promise((resolve) => {
              let data = ''
              req.on('data', (chunk: Buffer) => (data += chunk.toString()))
              req.on('end', () => resolve(data))
            })
            const { url } = JSON.parse(body) as { url: string }

            if (!url || !url.trim()) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '请输入视频链接' }))
              return
            }

            // Run yt-dlp to get JSON metadata
            const result = await new Promise<string>((resolve, reject) => {
              execFile(
                'yt-dlp',
                [
                  '-j',
                  '--no-warnings',
                  '--no-playlist',
                  '--no-check-certificates',
                  url.trim(),
                ],
                { timeout: 30000 },
                (err, stdout, stderr) => {
                  if (err) {
                    reject(new Error(stderr || err.message))
                  } else {
                    resolve(stdout)
                  }
                },
              )
            })

            const info = JSON.parse(result) as {
              title?: string
              thumbnail?: string
              duration?: number
              url?: string
              formats?: { url: string; format_note?: string; ext?: string; vcodec?: string; acodec?: string; height?: number; filesize?: number }[]
              webpage_url?: string
              uploader?: string
            }

            // Pick the best mp4 format with both video+audio
            let videoUrl = info.url ?? ''
            if (info.formats?.length) {
              const mp4WithAudio = info.formats
                .filter(
                  (f) =>
                    f.ext === 'mp4' &&
                    f.vcodec !== 'none' &&
                    f.acodec !== 'none',
                )
                .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
              if (mp4WithAudio.length > 0) {
                videoUrl = mp4WithAudio[0].url
              }
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                title: info.title ?? '未知标题',
                thumbnail: info.thumbnail ?? '',
                duration: info.duration ?? 0,
                videoUrl,
                uploader: info.uploader ?? '',
                originalUrl: info.webpage_url ?? url,
              }),
            )
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error:
                  err instanceof Error
                    ? `解析失败：${err.message}`
                    : '未知错误',
              }),
            )
          }
        },
      )
    },
  }
}

/**
 * Temp Drive: upload files, get a 6-digit extraction code, download by code.
 * Files are stored on local disk; metadata persisted to a JSON file.
 * Expired files are cleaned up automatically every 5 minutes.
 */
interface TempDriveRecord {
  code: string
  originalName: string
  storageName: string
  size: number
  uploadedAt: number
  expiresAt: number
  downloads: number
}

function tempDrivePlugin(): Plugin {
  const DATA_DIR = join(process.cwd(), 'temp-drive-data')
  const FILES_DIR = join(DATA_DIR, 'files')
  const META_FILE = join(DATA_DIR, 'meta.json')

  mkdirSync(FILES_DIR, { recursive: true })

  // Load persisted metadata
  const records = new Map<string, TempDriveRecord>()
  try {
    if (existsSync(META_FILE)) {
      const data = JSON.parse(readFileSync(META_FILE, 'utf-8'))
      for (const [k, v] of Object.entries(data)) {
        records.set(k, v as TempDriveRecord)
      }
    }
  } catch { /* ignore corrupt file */ }

  function saveMeta() {
    const obj: Record<string, TempDriveRecord> = {}
    for (const [k, v] of records) obj[k] = v
    writeFileSync(META_FILE, JSON.stringify(obj, null, 2))
  }

  function generateCode(): string {
    let code: string
    do {
      code = randomInt(100000, 999999).toString()
    } while (records.has(code))
    return code
  }

  function cleanup() {
    const now = Date.now()
    let changed = false
    for (const [code, record] of records) {
      if (record.expiresAt < now) {
        try { unlinkSync(join(FILES_DIR, record.storageName)) } catch { /* already deleted */ }
        records.delete(code)
        changed = true
      }
    }
    if (changed) saveMeta()
  }

  const timer = setInterval(cleanup, 5 * 60 * 1000)
  timer.unref()
  cleanup()

  const MAX_SIZE = 100 * 1024 * 1024 // 100 MB
  const EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

  return {
    name: 'temp-drive',
    configureServer(server) {
      // ---- Upload ----
      server.middlewares.use(
        '/api/temp-drive/upload',
        (req: IncomingMessage, res: ServerResponse, next) => {
          if (req.method !== 'POST') return next()

          const fileName = decodeURIComponent(
            (req.headers['x-file-name'] as string) || 'unnamed',
          )

          const code = generateCode()
          const ext = extname(fileName)
          const storageName = `${code}${ext}`
          const filePath = join(FILES_DIR, storageName)

          const ws = createWriteStream(filePath)
          let bytesWritten = 0
          let aborted = false

          req.on('data', (chunk: Buffer) => {
            if (aborted) return
            bytesWritten += chunk.length
            if (bytesWritten > MAX_SIZE) {
              aborted = true
              ws.destroy()
              try { unlinkSync(filePath) } catch { /* ok */ }
              res.statusCode = 413
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '文件大小超过 100MB 限制' }))
              return
            }
            ws.write(chunk)
          })

          req.on('end', () => {
            if (aborted) return
            ws.end(() => {
              const now = Date.now()
              records.set(code, {
                code,
                originalName: fileName,
                storageName,
                size: bytesWritten,
                uploadedAt: now,
                expiresAt: now + EXPIRY_MS,
                downloads: 0,
              })
              saveMeta()

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ code, expiresAt: now + EXPIRY_MS }))
            })
          })

          req.on('error', () => {
            ws.destroy()
            try { unlinkSync(filePath) } catch { /* ok */ }
            if (!res.writableEnded) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '上传失败' }))
            }
          })
        },
      )

      // ---- File info ----
      server.middlewares.use(
        '/api/temp-drive/info',
        (req: IncomingMessage, res: ServerResponse, next) => {
          if (req.method !== 'GET') return next()

          const code = (req.url || '').replace(/^\//, '').split('?')[0]
          if (!code || !/^\d{6}$/.test(code)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '无效的提取码' }))
            return
          }

          const record = records.get(code)
          if (!record) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '提取码不存在或已过期' }))
            return
          }

          const now = Date.now()
          if (record.expiresAt < now) {
            try { unlinkSync(join(FILES_DIR, record.storageName)) } catch { /* ok */ }
            records.delete(code)
            saveMeta()
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '提取码已过期' }))
            return
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              name: record.originalName,
              size: record.size,
              expiresIn: record.expiresAt - now,
              downloads: record.downloads,
            }),
          )
        },
      )

      // ---- Download ----
      server.middlewares.use(
        '/api/temp-drive/download',
        (req: IncomingMessage, res: ServerResponse, next) => {
          if (req.method !== 'GET') return next()

          const code = (req.url || '').replace(/^\//, '').split('?')[0]
          if (!code || !/^\d{6}$/.test(code)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '无效的提取码' }))
            return
          }

          const record = records.get(code)
          if (!record) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '提取码不存在或已过期' }))
            return
          }

          const now = Date.now()
          if (record.expiresAt < now) {
            try { unlinkSync(join(FILES_DIR, record.storageName)) } catch { /* ok */ }
            records.delete(code)
            saveMeta()
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '提取码已过期' }))
            return
          }

          const filePath = join(FILES_DIR, record.storageName)
          if (!existsSync(filePath)) {
            records.delete(code)
            saveMeta()
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '文件不存在' }))
            return
          }

          record.downloads++
          saveMeta()

          const encodedName = encodeURIComponent(record.originalName)
          res.setHeader('Content-Type', 'application/octet-stream')
          res.setHeader('Content-Length', record.size.toString())
          res.setHeader(
            'Content-Disposition',
            `attachment; filename*=UTF-8''${encodedName}`,
          )

          const rs = createReadStream(filePath)
          rs.pipe(res)
          rs.on('error', () => {
            if (!res.writableEnded) {
              res.statusCode = 500
              res.end()
            }
          })
        },
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (empty prefix = no VITE_ filter)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      deepseekProxy(env.DEEPSEEK_API_KEY ?? ''),
      videoExtractorProxy(),
      tempDrivePlugin(),
    ],
  }
})
