import { highlighterPromise } from '@/lib/highlighter'

type Props = { content: string }

const CALLOUT_ICONS: Record<string, string> = {
  info: 'ℹ️', tip: '💡', note: '📝', warning: '⚠️',
  danger: '🔥', abstract: '📋', example: '📌', quote: '💬', success: '✅',
}

const CALLOUT_STYLES: Record<string, string> = {
  info:     'bg-sky-950/40 border-sky-400',
  tip:      'bg-green-950/40 border-green-400',
  note:     'bg-violet-950/40 border-violet-400',
  warning:  'bg-amber-950/40 border-amber-400',
  danger:   'bg-red-950/40 border-red-400',
  abstract: 'bg-cyan-950/40 border-cyan-400',
  example:  'bg-indigo-950/40 border-indigo-400',
  quote:    'bg-zinc-800/50 border-zinc-500',
  success:  'bg-emerald-950/40 border-emerald-400',
}

const CALLOUT_TITLE_STYLES: Record<string, string> = {
  info: 'text-sky-300', tip: 'text-green-300', note: 'text-violet-300',
  warning: 'text-amber-300', danger: 'text-red-300', abstract: 'text-cyan-300',
  example: 'text-indigo-300', quote: 'text-zinc-400', success: 'text-emerald-300',
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function parseInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="text-xs bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-zinc-300">$1</code>')
    .replace(/▶️ \[(.+?)\]\((.+?)\)/g, '▶️ <a href="$2" class="text-sky-400 hover:underline" target="_blank">$1</a>')
    .replace(/🔗 \[(.+?)\]\((.+?)\)/g, '🔗 <a href="$2" class="text-sky-400 hover:underline" target="_blank">$1</a>')
    .replace(/\[\[(.+?)\]\]/g, '<span class="text-violet-400 hover:underline cursor-pointer">[[$1]]</span>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-sky-400 hover:underline" target="_blank">$1</a>')
    .replace(/#([^\s#]+)/g, '<span class="inline-block text-xs font-mono text-zinc-500 mr-1">#$1</span>')
}

export default async function ObsidianRenderer({ content }: Props) {
  const hlighter = await highlighterPromise

  function renderLines(lines: string[], depth = 0): string {
    const strip = (l: string) =>
      depth > 0 ? l.replace(new RegExp(`^>{${depth}}\\s?`), '') : l

    let out = ''
    let i = 0
    let listBuf: string[] = []
    let listType: 'ul' | 'ol' | null = null

    function flushList() {
      if (!listBuf.length) return
      const tag = listType === 'ol' ? 'ol' : 'ul'
      const cls = listType === 'ol'
        ? 'list-decimal pl-5 my-2 space-y-1 text-zinc-300 text-sm'
        : 'list-disc pl-5 my-2 space-y-1 text-zinc-300 text-sm'
      out += `<${tag} class="${cls}">${listBuf.map(l => `<li>${parseInline(l)}</li>`).join('')}</${tag}>`
      listBuf = []; listType = null
    }

    while (i < lines.length) {
      const raw = lines[i]
      const line = strip(raw)

      // nested callout (depth+1) — must check before code block
      if (depth >= 0) {
        const nestedCalloutRx = new RegExp(`^>{${depth + 1}}\\s*\\[!`)
        if (raw.match(nestedCalloutRx)) {
          flushList()
          const nested: string[] = []
          const nestedAny = new RegExp(`^>{${depth + 1}}`)
          while (i < lines.length && lines[i].match(nestedAny)) { nested.push(lines[i]); i++ }
          out += parseCallout(nested, depth + 1)
          continue
        }
      }

      // code block
      if (line.startsWith('```')) {
        flushList()
        const lang = line.slice(3).trim()
        const codeLines: string[] = []
        i++
        while (i < lines.length) {
          const cl = strip(lines[i])
          if (cl.startsWith('```')) { i++; break }
          codeLines.push(cl)
          i++
        }
        const code = codeLines.join('\n')

        const supported = hlighter.getLoadedLanguages()
        const resolvedLang = supported.includes(lang as any) ? lang : 'text'

        const highlighted = hlighter.codeToHtml(code, {
          lang: resolvedLang,
          theme: 'github-dark',
        })

        const label = resolvedLang !== 'text'
          ? `<span class="text-zinc-500 text-xs font-mono">${resolvedLang}</span>`
          : '<span></span>'

        out += `
          <div class="my-3 rounded-lg border border-zinc-800 overflow-hidden">
            <div class="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800">
              ${label}
              <button onclick="navigator.clipboard.writeText(this.dataset.code)"
                      data-code="${escapeHtml(code)}"
                      class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">copy</button>
            </div>
            <div class="overflow-x-auto [&_pre]:!bg-zinc-950 [&_pre]:p-4 [&_pre]:m-0 [&_pre]:text-xs [&_pre]:font-mono [&_pre]:leading-relaxed">
              ${highlighted}
            </div>
          </div>`
        continue
      }

      // hr
      if (/^---+$/.test(line.trim())) {
        flushList(); out += '<hr class="border-zinc-800 my-4">'; i++; continue
      }

      // headings
      const hm = line.match(/^(#{1,3})\s+(.+)/)
      if (hm) {
        flushList()
        const lvl = hm[1].length
        const cls = lvl === 1
          ? 'text-xl font-bold text-white mt-4 mb-3'
          : lvl === 2
          ? 'text-base font-semibold text-white mt-5 mb-2 border-b border-zinc-800 pb-1'
          : 'text-sm font-semibold text-zinc-200 mt-4 mb-1.5'
        out += `<h${lvl} class="${cls}">${parseInline(hm[2])}</h${lvl}>`
        i++; continue
      }

      // ordered list
      const olm = line.match(/^(\d+)\.\s+(.+)/)
      if (olm) {
        if (listType !== 'ol') { flushList(); listType = 'ol' }
        listBuf.push(olm[2]); i++; continue
      }

      // unordered list
      const ulm = line.match(/^[-*]\s+(.+)/)
      if (ulm) {
        if (listType !== 'ul') { flushList(); listType = 'ul' }
        listBuf.push(ulm[1]); i++; continue
      }

      // empty line
      if (!line.trim()) { flushList(); i++; continue }

      // tags line — if entire line is only #tags, render as flex wrap
      if (/^(#[^\s#]+\s*)+$/.test(line.trim())) {
        flushList()
        const tags = line.trim().split(/\s+/).filter(t => t.startsWith('#'))
        out += `<div class="flex flex-wrap gap-1.5 mt-1">${tags.map(t =>
          `<span class="text-xs font-mono text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded">${t}</span>`
        ).join('')}</div>`
        i++; continue
      }

      // paragraph
      flushList()
      out += `<p class="text-sm text-zinc-300 leading-relaxed my-1.5">${parseInline(line)}</p>`
      i++
    }

    flushList()
    return out
  }

  function parseCallout(lines: string[], depth: number): string {
    const headerRaw = lines[0].replace(new RegExp(`^>{${depth}}\\s*`), '')
    const m = headerRaw.match(/^\[!([\w]+)\]\s*(.*)/)
    if (!m) {
      return `<blockquote class="border-l-2 border-zinc-700 pl-3 my-2 text-zinc-400 text-sm">${
        renderLines(lines, depth)
      }</blockquote>`
    }

    const type = m[1].toLowerCase()
    const title = m[2].trim()
    const icon = CALLOUT_ICONS[type] ?? 'ℹ️'
    const boxStyle = CALLOUT_STYLES[type] ?? CALLOUT_STYLES.info
    const titleStyle = CALLOUT_TITLE_STYLES[type] ?? 'text-sky-300'

    const body = renderLines(lines.slice(1), depth)

    return `<div class="rounded-lg px-4 py-3 my-3 border-l-2 ${boxStyle}">
      <div class="flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${titleStyle}">
        <span>${icon}</span><span>${escapeHtml(title || type)}</span>
      </div>
      <div class="text-sm text-zinc-300">${body}</div>
    </div>`
  }

  function renderObsidian(md: string): string {
    const lines = md.split('\n')
    let out = ''
    let i = 0

    while (i < lines.length) {
      // top-level callout block
      if (lines[i].match(/^>\s*\[!/)) {
        const block: string[] = []
        while (i < lines.length) {
          const l = lines[i]
          if (l.startsWith('>')) { block.push(l); i++; continue }
          if (l.trim() === '' && lines[i + 1]?.startsWith('>')) { i++; continue }
          break
        }
        out += parseCallout(block, 1)
      } else {
        const chunk: string[] = []
        while (i < lines.length && !lines[i].match(/^>\s*\[!/)) {
          chunk.push(lines[i]); i++
        }
        out += renderLines(chunk, 0)
      }
    }
    return out
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: renderObsidian(content) }} />
  )
}