import { useStore } from '../store'
import { computeStats } from '../utils/novelFormatter'

export function StatusBar() {
  const content = useStore((s) => s.content)
  const saving = useStore((s) => s.saving)
  const dirty = useStore((s) => s.dirty)
  const activeFile = useStore((s) => s.activeFile)

  const stats = computeStats(content)
  const isBinary = !useStore.getState().editable

  return (
    <footer className="flex items-center gap-4 border-t border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
      <span className="truncate">{activeFile ?? 'no file open'}</span>
      {isBinary ? (
        <span className="ml-auto italic">binary file — stats unavailable</span>
      ) : (
        <>
          <span className="ml-auto">{stats.words} words</span>
          <span className="hidden sm:inline">{stats.characters} chars</span>
          <span className="hidden md:inline">{stats.paragraphs} paragraphs</span>
          <span>~{stats.readingMinutes} min read</span>
        </>
      )}
      {!isBinary && (
        <span className={dirty ? 'text-amber-600' : saving ? 'text-blue-600' : 'text-green-600'}>
          {saving ? 'Saving...' : dirty ? 'Unsaved' : 'Saved'}
        </span>
      )}
    </footer>
  )
}
