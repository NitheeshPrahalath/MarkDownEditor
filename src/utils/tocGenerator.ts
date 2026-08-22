export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

export interface FlatHeading {
  level: number
  text: string
  id: string
}

export interface TocNode extends FlatHeading {
  children: TocNode[]
}

export interface ParsedDocument {
  html: string
  headings: FlatHeading[]
  tree: TocNode[]
}

export function buildTree(flat: FlatHeading[]): TocNode[] {
  const root: TocNode[] = []
  const stack: TocNode[] = []
  for (const h of flat) {
    const node: TocNode = { ...h, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop()
    }
    if (stack.length === 0) {
      root.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }
    stack.push(node)
  }
  return root
}
