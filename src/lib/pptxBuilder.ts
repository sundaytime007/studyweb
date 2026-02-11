import PptxGenJS from 'pptxgenjs'
import type { POM, Slide } from '../types/pom'

/** Color palettes keyed by vibe */
const THEMES: Record<string, { bg: string; accent: string; text: string; muted: string; light: string }> = {
  professional: { bg: '0F172A', accent: '3B82F6', text: 'FFFFFF', muted: '94A3B8', light: 'E2E8F0' },
  creative:     { bg: '1E1B4B', accent: 'A855F7', text: 'FFFFFF', muted: 'C4B5FD', light: 'EDE9FE' },
  minimal:      { bg: 'FFFFFF', accent: '6366F1', text: '0F172A', muted: '64748B', light: 'F1F5F9' },
  bold:         { bg: '18181B', accent: 'F43F5E', text: 'FFFFFF', muted: 'A1A1AA', light: 'FECDD3' },
}

const FONT = 'Microsoft YaHei'

function addTitleSlide(pptx: PptxGenJS, slide: Slide, theme: typeof THEMES.professional) {
  const s = pptx.addSlide()
  s.background = { color: theme.bg }

  // Accent bar
  s.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 2.0, w: 1.2, h: 0.06, fill: { color: theme.accent },
  })

  s.addText(slide.data.title, {
    x: 0.8, y: 2.2, w: 8.4, h: 1.2,
    fontSize: 36, fontFace: FONT, color: theme.text, bold: true,
  })

  if (slide.data.subtitle) {
    s.addText(slide.data.subtitle, {
      x: 0.8, y: 3.5, w: 8.4, h: 0.7,
      fontSize: 18, fontFace: FONT, color: theme.muted,
    })
  }
}

function addSectionSlide(pptx: PptxGenJS, slide: Slide, theme: typeof THEMES.professional) {
  const s = pptx.addSlide()
  s.background = { color: theme.accent }

  s.addText(slide.data.title, {
    x: 0.8, y: 2.0, w: 8.4, h: 1.5,
    fontSize: 32, fontFace: FONT, color: 'FFFFFF', bold: true,
  })

  if (slide.data.subtitle) {
    s.addText(slide.data.subtitle, {
      x: 0.8, y: 3.5, w: 8.4, h: 0.7,
      fontSize: 16, fontFace: FONT, color: 'FFFFFFCC',
    })
  }
}

function addContentSlide(pptx: PptxGenJS, slide: Slide, theme: typeof THEMES.professional) {
  const s = pptx.addSlide()
  s.background = { color: theme.bg }

  // Title
  s.addText(slide.data.title, {
    x: 0.8, y: 0.4, w: 8.4, h: 0.7,
    fontSize: 24, fontFace: FONT, color: theme.accent, bold: true,
  })

  // Divider line
  s.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.15, w: 8.4, h: 0.02, fill: { color: theme.muted },
  })

  // Bullets
  if (slide.data.bullets?.length) {
    const bulletRows = slide.data.bullets.map((b) => ({
      text: b,
      options: {
        fontSize: 16,
        fontFace: FONT,
        color: theme.text,
        bullet: { code: '25CF', color: theme.accent },
        paraSpaceAfter: 8,
      },
    }))
    s.addText(bulletRows, {
      x: 0.8, y: 1.4, w: 8.4, h: 3.6,
      valign: 'top',
      lineSpacingMultiple: 1.3,
    })
  }
}

function addTwoColumnSlide(pptx: PptxGenJS, slide: Slide, theme: typeof THEMES.professional) {
  const s = pptx.addSlide()
  s.background = { color: theme.bg }

  s.addText(slide.data.title, {
    x: 0.8, y: 0.4, w: 8.4, h: 0.7,
    fontSize: 24, fontFace: FONT, color: theme.accent, bold: true,
  })

  s.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.15, w: 8.4, h: 0.02, fill: { color: theme.muted },
  })

  // Left column
  if (slide.data.left_title) {
    s.addText(slide.data.left_title, {
      x: 0.8, y: 1.4, w: 4.0, h: 0.5,
      fontSize: 16, fontFace: FONT, color: theme.light, bold: true,
    })
  }
  if (slide.data.left_bullets?.length) {
    const rows = slide.data.left_bullets.map((b) => ({
      text: b,
      options: {
        fontSize: 14, fontFace: FONT, color: theme.text,
        bullet: { code: '25CF', color: theme.accent },
        paraSpaceAfter: 6,
      },
    }))
    s.addText(rows, { x: 0.8, y: 1.95, w: 4.0, h: 3.0, valign: 'top' })
  }

  // Right column
  if (slide.data.right_title) {
    s.addText(slide.data.right_title, {
      x: 5.2, y: 1.4, w: 4.0, h: 0.5,
      fontSize: 16, fontFace: FONT, color: theme.light, bold: true,
    })
  }
  if (slide.data.right_bullets?.length) {
    const rows = slide.data.right_bullets.map((b) => ({
      text: b,
      options: {
        fontSize: 14, fontFace: FONT, color: theme.text,
        bullet: { code: '25CF', color: theme.accent },
        paraSpaceAfter: 6,
      },
    }))
    s.addText(rows, { x: 5.2, y: 1.95, w: 4.0, h: 3.0, valign: 'top' })
  }
}

function addClosingSlide(pptx: PptxGenJS, slide: Slide, theme: typeof THEMES.professional) {
  const s = pptx.addSlide()
  s.background = { color: theme.bg }

  s.addText(slide.data.title || 'Thank You', {
    x: 0.8, y: 1.8, w: 8.4, h: 1.0,
    fontSize: 36, fontFace: FONT, color: theme.text, bold: true, align: 'center',
  })

  if (slide.data.closing_text) {
    s.addText(slide.data.closing_text, {
      x: 0.8, y: 3.0, w: 8.4, h: 0.7,
      fontSize: 16, fontFace: FONT, color: theme.muted, align: 'center',
    })
  }

  // Bottom accent bar
  s.addShape(pptx.ShapeType.rect, {
    x: 3.8, y: 4.0, w: 2.4, h: 0.06, fill: { color: theme.accent },
  })
}

/** Build and download a .pptx file from a POM structure */
export async function buildPptx(pom: POM, vibe = 'professional'): Promise<void> {
  const theme = THEMES[vibe] ?? THEMES.professional
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'AI PPT Generator'
  pptx.title = pom.meta.title

  for (const slide of pom.slides) {
    switch (slide.layout) {
      case 'title':
        addTitleSlide(pptx, slide, theme)
        break
      case 'section':
        addSectionSlide(pptx, slide, theme)
        break
      case 'content':
        addContentSlide(pptx, slide, theme)
        break
      case 'two_column':
        addTwoColumnSlide(pptx, slide, theme)
        break
      case 'closing':
        addClosingSlide(pptx, slide, theme)
        break
      default:
        addContentSlide(pptx, slide, theme)
    }
  }

  await pptx.writeFile({ fileName: `${pom.meta.title}.pptx` })
}
