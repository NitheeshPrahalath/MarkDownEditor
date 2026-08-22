import { Suspense, lazy, useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { useStore } from '../store'
import { parseDocument } from '../utils/markdown'

const DocxViewer = lazy(() =>
  import('./DocxViewer').then((m) => ({ default: m.DocxViewer }))
)
const SheetViewer = lazy(() =>
  import('./SheetViewer').then((m) => ({ default: m.SheetViewer }))
)

function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

function extOf(file: string | null): string {
  if (!file) return ''
  const dot = file.lastIndexOf('.')
  return dot === -1 ? '' : file.slice(dot).toLowerCase()
}

export function EditorCanvas() {
  const activeFile = useStore((s) => s.activeFile)
  const content = useStore((s) => s.content)
  const editable = useStore((s) => s.editable)
  const setContent = useStore((s) => s.setContent)
  const font = useStore((s) => s.font)
  const fontSize = useStore((s) => s.fontSize)
  const lineHeight = useStore((s) => s.lineHeight)
  const [showPreview, setShowPreview] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const ext = extOf(activeFile)
  const isMarkdown = ext === '.md' || ext === '.txt' || ext === ''
  const isPlainText = ext === '.txt' || ext === '.csv'

  const parsed = useMemo(
    () => (isMarkdown && !isPlainText ? parseDocument(content) : null),
    [content, isMarkdown, isPlainText]
  )

  useEffect(() => {
    setShowPreview(true)
  }, [activeFile])

  const scrollToHeading = useCallback(
    (id: string) => {
      if (previewRef.current) {
        const el = previewRef.current.querySelector(`#${CSS.escape(id)}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      if (textareaRef.current && content) {
        const lines = content.split('\n')
        const usedSlugs = new Set<string>()
        for (let i = 0; i < lines.length; i++) {
          const m = lines[i].match(/^(#{1,6})\s+(.+)$/)
          if (!m) continue
          const base = headingSlug(m[2]) || 'section'
          let candidate = base
          let n = 2
          while (usedSlugs.has(candidate)) {
            candidate = `${base}-${n++}`
          }
          usedSlugs.add(candidate)
          if (candidate === id) {
            const lhPx = fontSize * lineHeight
            textareaRef.current.scrollTo({ top: i * lhPx, behavior: 'smooth' })
            break
          }
        }
      }
    },
    [content, fontSize, lineHeight]
  )

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      scrollToHeading(detail)
    }
    window.addEventListener('toc-navigate', handler)
    return () => window.removeEventListener('toc-navigate', handler)
  }, [scrollToHeading])

  if (!activeFile) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-lg text-gray-400">Select a chapter to start writing</p>
          <p className="mt-1 text-sm text-gray-300 dark:text-gray-600">
            or create a new one from the sidebar
          </p>
        </div>
      </div>
    )
  }

  const textStyle = {
    fontFamily:
      font === 'serif'
        ? "Georgia, 'Times New Roman', serif"
        : "system-ui, 'Segoe UI', Roboto, sans-serif",
    fontSize: `${fontSize}px`,
    lineHeight,
  }

  if (ext === '.docx') {
    return (
      <main className="flex min-w-0 flex-1 flex-col bg-gray-50 dark:bg-gray-950">
        <ViewOnlyBar fileName={activeFile} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<Loading />}>
            <DocxViewer base64={content} />
          </Suspense>
        </div>
      </main>
    )
  }

  if (ext === '.xlsx' || ext === '.xls') {
    return (
      <main className="flex min-w-0 flex-1 flex-col bg-gray-50 dark:bg-gray-950">
        <ViewOnlyBar fileName={activeFile} />
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <Suspense fallback={<Loading />}>
            <SheetViewer base64={content} />
          </Suspense>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-gray-50 dark:bg-gray-950">
      {editable ? (
        <div className="flex items-center justify-end border-b border-gray-200 bg-white px-3 py-1.5 dark:border-gray-800 dark:bg-gray-900">
          {!isPlainText && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                showPreview
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              Preview
            </button>
          )}
        </div>
      ) : (
        <ViewOnlyBar fileName={activeFile} />
      )}
      <div className="flex min-h-0 flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          placeholder={isPlainText ? 'Plain text file...' : 'Start writing your novel...'}
          style={textStyle}
          className={`min-w-0 flex-1 resize-none bg-white p-6 text-gray-800 outline-none dark:bg-gray-900 dark:text-gray-200 ${
            isPlainText ? 'whitespace-pre-wrap' : ''
          }`}
        />
        {editable && showPreview && parsed && (
          <div
            ref={previewRef}
            style={textStyle}
            className="novel-preview min-w-0 flex-1 overflow-y-auto border-l border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            dangerouslySetInnerHTML={{ __html: parsed.html }}
          />
        )}
      </div>
    </main>
  )
}

function ViewOnlyBar({ fileName }: { fileName: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-amber-50 px-3 py-1.5 dark:border-gray-800 dark:bg-amber-900/20">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-amber-500">
        <path
          d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 2.5 2 4.7 3.25 6.06a1.7 1.7 0 0 0 2.5 0C10.5 10.7 12.5 8.5 12.5 6A4.5 4.5 0 0 0 8 1.5z"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <circle cx="8" cy="6" r="1.4" fill="currentColor" />
      </svg>
      <span className="truncate text-xs font-medium text-amber-800 dark:text-amber-300">
        Read-only viewer — {fileName.split('/').pop()}
      </span>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex h-full items-center justify-center p-10">
      <span className="animate-pulse text-sm text-gray-400">Loading viewer...</span>
    </div>
  )
}
