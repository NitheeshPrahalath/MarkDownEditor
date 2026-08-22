import { useState } from 'react'
import { useStore } from '../store'

const EXT_BADGE: Record<string, { label: string; cls: string }> = {
  '.md': {
    label: 'MD',
    cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
  '.txt': {
    label: 'TXT',
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  '.docx': {
    label: 'DOCX',
    cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  },
  '.xlsx': {
    label: 'XLSX',
    cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  '.xls': {
    label: 'XLS',
    cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  '.csv': {
    label: 'CSV',
    cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
}

function splitName(file: string): [string, string] {
  const dot = file.lastIndexOf('.')
  return dot === -1 ? [file, ''] : [file.slice(0, dot), file.slice(dot).toLowerCase()]
}

export function ChapterList() {
  const files = useStore((s) => s.files)
  const activeFile = useStore((s) => s.activeFile)
  const openFile = useStore((s) => s.openFile)
  const newFile = useStore((s) => s.newFile)
  const loadFiles = useStore((s) => s.loadFiles)
  const drawerOpen = useStore((s) => s.chaptersDrawer)
  const setDrawer = useStore((s) => s.setChaptersDrawer)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  async function handleCreate() {
    if (!newName.trim()) {
      setCreating(false)
      return
    }
    let name = newName.trim()
    if (!/\.(md|txt)$/i.test(name)) name += '.md'
    await newFile(name)
    setNewName('')
    setCreating(false)
  }

  async function handleOpen(file: string) {
    await openFile(file)
    setDrawer(false)
  }

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setDrawer(false)}
        />
      )}
      <aside
        className={`flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${
          drawerOpen
            ? 'absolute inset-y-0 left-0 z-40 flex w-64 shadow-2xl'
            : 'hidden w-56 shrink-0 md:flex'
        } h-full`}
      >
        <div className="flex items-center justify-between px-3 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Chapters
          </h2>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => void loadFiles()}
              className="rounded p-1 text-gray-400 transition hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/30"
              title="Refresh file list"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.5v3h-3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => setCreating(!creating)}
              className="rounded p-1 text-gray-400 transition hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/30"
              title="New chapter (.md or .txt)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        {creating && (
          <div className="px-3 pb-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate()
                if (e.key === 'Escape') setCreating(false)
              }}
              onBlur={() => void handleCreate()}
              placeholder="chapter-name.md"
              className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        )}
        <nav className="flex-1 overflow-y-auto">
          {files.map((file) => {
            const [base, ext] = splitName(file)
            const badge = EXT_BADGE[ext]
            return (
              <button
                key={file}
                onClick={() => void handleOpen(file)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition md:py-1.5 ${
                  file === activeFile
                    ? 'bg-purple-100 font-medium text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {badge && (
                  <span
                    className={`shrink-0 rounded px-1 py-px font-mono text-[9px] font-bold ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                )}
                <span className="truncate">{base}</span>
              </button>
            )
          })}
          {files.length === 0 && (
            <p className="px-3 py-2 text-xs italic text-gray-400 dark:text-gray-500">
              No files found — try the refresh button
            </p>
          )}
        </nav>
      </aside>
    </>
  )
}
