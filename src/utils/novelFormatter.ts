export interface NovelStats {
  words: number
  characters: number
  paragraphs: number
  readingMinutes: number
}

export function computeStats(text: string): NovelStats {
  const trimmed = text.trim()
  if (trimmed === '') {
    return { words: 0, characters: 0, paragraphs: 0, readingMinutes: 0 }
  }
  const words = trimmed.split(/\s+/).length
  const characters = text.length
  const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim() !== '').length
  const readingMinutes = Math.max(1, Math.round(words / 200))
  return { words, characters, paragraphs, readingMinutes }
}
