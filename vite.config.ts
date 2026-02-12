import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { execFile } from 'child_process'

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
    ],
  }
})
