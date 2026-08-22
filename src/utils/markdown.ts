import MarkdownIt from 'markdown-it'
import { slugify, buildTree } from './tocGenerator'
import type { FlatHeading, ParsedDocument } from './tocGenerator'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

let collectedHeadings: FlatHeading[] = []

md.core.ruler.push('novel_heading_ids', (state) => {
  const headings: FlatHeading[] = []
  const used = new Set<string>()
  for (let i = 0; i < state.tokens.length; i++) {
    const token = state.tokens[i]
    if (token.type !== 'heading_open') continue
    const inline = state.tokens[i + 1]
    const text = (inline?.content ?? '').trim()
    const level = parseInt(token.tag.slice(1), 10)
    const base = slugify(text) || 'section'
    let id = base
    let n = 2
    while (used.has(id)) {
      id = `${base}-${n}`
      n++
    }
    used.add(id)
    token.attrSet('id', id)
    headings.push({ level, text, id })
  }
  collectedHeadings = headings
})

export function parseDocument(markdownText: string): ParsedDocument {
  const html = md.render(markdownText)
  return { html, headings: collectedHeadings, tree: buildTree(collectedHeadings) }
}
