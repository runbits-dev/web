"use client"

import { useMemo } from 'react'

/**
 * Lightweight markdown renderer for QA reports.
 *
 * Supports: ATX headings (#, ##, ###), unordered lists (-/*), ordered lists,
 * fenced code blocks (```), inline code (`code`), bold (**text**), italics
 * (*text*), and paragraphs separated by blank lines. Renders to React nodes
 * directly (no dangerouslySetInnerHTML) so the output is XSS-safe.
 *
 * Why custom: react-markdown is not a dependency of runbits-web and adding it
 * just for QA reports is overkill. QA reports are first-party content and the
 * subset above is sufficient.
 */

interface QaReportMarkdownProps {
  source: string
}

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'code'; lang: string | null; body: string }
  | { kind: 'p'; text: string }
  | { kind: 'hr' }

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, '').trim() || null
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      // Skip closing fence if present
      if (i < lines.length) i++
      blocks.push({ kind: 'code', lang, body: buf.join('\n') })
      continue
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      blocks.push({ kind: 'hr' })
      i++
      continue
    }

    // Heading
    const h = /^(#{1,6})\s+(.*)$/.exec(line)
    if (h) {
      const level = h[1].length as 1 | 2 | 3 | 4 | 5 | 6
      blocks.push({ kind: 'heading', level, text: h[2].trim() })
      i++
      continue
    }

    // Unordered list (consume contiguous lines)
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push({ kind: 'ul', items })
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ kind: 'ol', items })
      continue
    }

    // Blank → skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph (consume until blank, heading, list, fence, or hr)
    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^```/.test(lines[i]) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i])
    ) {
      buf.push(lines[i])
      i++
    }
    blocks.push({ kind: 'p', text: buf.join(' ') })
  }

  return blocks
}

/** Render inline markdown (bold, italic, inline code). Returns React nodes. */
function renderInline(text: string): React.ReactNode[] {
  // Split by inline code first to protect it from other transforms.
  const parts: React.ReactNode[] = []
  const codeRe = /`([^`]+)`/g
  let lastIdx = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = codeRe.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(...renderBoldItalic(text.slice(lastIdx, m.index), key))
      key += 100
    }
    parts.push(
      <code key={`c-${key++}`} className="px-1 py-0.5 rounded bg-slate-100 text-slate-800 text-[12px] font-mono">
        {m[1]}
      </code>,
    )
    lastIdx = m.index + m[0].length
  }
  if (lastIdx < text.length) {
    parts.push(...renderBoldItalic(text.slice(lastIdx), key))
  }
  return parts
}

function renderBoldItalic(text: string, baseKey: number): React.ReactNode[] {
  // bold **x**, italic *x*. Bold first to avoid eating the ** as italic markers.
  const parts: React.ReactNode[] = []
  let rest = text
  let key = baseKey
  while (rest.length > 0) {
    const bold = /\*\*([^*]+)\*\*/.exec(rest)
    const ital = /(?:^|[^*])\*([^*]+)\*/.exec(rest)
    const candidates: Array<{ idx: number; len: number; node: React.ReactNode; start: number }> = []
    if (bold) {
      candidates.push({
        idx: bold.index,
        len: bold[0].length,
        start: bold.index,
        node: <strong key={`b-${key++}`} className="font-bold text-slate-900">{bold[1]}</strong>,
      })
    }
    if (ital) {
      // ital regex has a non-* lookbehind char baked in, so adjust the actual *...* start
      const actualStart = rest.indexOf('*', ital.index)
      candidates.push({
        idx: actualStart,
        len: ital[1].length + 2,
        start: actualStart,
        node: <em key={`i-${key++}`} className="italic">{ital[1]}</em>,
      })
    }
    if (candidates.length === 0) {
      parts.push(rest)
      break
    }
    candidates.sort((a, b) => a.idx - b.idx)
    const next = candidates[0]
    if (next.idx > 0) parts.push(rest.slice(0, next.idx))
    parts.push(next.node)
    rest = rest.slice(next.idx + next.len)
  }
  return parts
}

export function QaReportMarkdown({ source }: QaReportMarkdownProps) {
  const blocks = useMemo(() => parseBlocks(source ?? ''), [source])

  if (!source || !source.trim()) {
    return <p className="text-sm text-slate-400">Report aún no generado.</p>
  }

  return (
    <div className="text-sm text-slate-700 leading-relaxed space-y-3">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'heading': {
            const sizes: Record<number, string> = {
              1: 'text-xl font-bold text-slate-900 mt-4 mb-1',
              2: 'text-lg font-bold text-slate-900 mt-3 mb-1',
              3: 'text-base font-bold text-slate-900 mt-2 mb-1',
              4: 'text-sm font-bold text-slate-900',
              5: 'text-sm font-semibold text-slate-900',
              6: 'text-xs font-semibold text-slate-700 uppercase tracking-wider',
            }
            const HeadingTag = (`h${b.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')
            return (
              <HeadingTag key={i} className={sizes[b.level]}>
                {renderInline(b.text)}
              </HeadingTag>
            )
          }
          case 'ul':
            return (
              <ul key={i} className="list-disc list-outside ml-5 space-y-1">
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="list-decimal list-outside ml-5 space-y-1">
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ol>
            )
          case 'code':
            return (
              <pre
                key={i}
                className="text-[12px] bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto font-mono"
              >
                <code>{b.body}</code>
              </pre>
            )
          case 'hr':
            return <hr key={i} className="border-slate-200" />
          case 'p':
            return (
              <p key={i} className="text-sm text-slate-700">
                {renderInline(b.text)}
              </p>
            )
        }
      })}
    </div>
  )
}
