export type DiffLineType = 'add' | 'del' | 'hunk' | 'meta' | 'ctx'

export interface DiffLine {
  type: DiffLineType
  text: string
}

export function parseUnifiedDiff(diffText: string): DiffLine[] {
  const lines = diffText.split('\n')
  const result: DiffLine[] = []
  for (const line of lines) {
    if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
      if (line.startsWith('diff ')) {
        const fileMatch = line.match(/b\/(.+)$/)
        result.push({ type: 'meta', text: fileMatch ? fileMatch[1] : line })
      }
      continue
    }
    if (line.startsWith('@@')) {
      result.push({ type: 'hunk', text: line })
    } else if (line.startsWith('+')) {
      result.push({ type: 'add', text: line.slice(1) })
    } else if (line.startsWith('-')) {
      result.push({ type: 'del', text: line.slice(1) })
    } else {
      result.push({ type: 'ctx', text: line.startsWith(' ') ? line.slice(1) : line })
    }
  }
  return result
}
