import { useCallback, useEffect, useState } from 'react'
import { api, type BrowseResponse } from '../api'
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

function joinPath(dir: string, name: string): string {
  return `${dir.replace(/\/+$/, '')}/${name}`
}

export function FileBrowser({ onNavigate }: { onNavigate: () => void }) {
  const openFile = useStore((s) => s.openFile)
  const [cwd, setCwd] = useState('')
  const [data, setData] = useState<BrowseResponse | null>(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [creatingDir, setCreatingDir] = useState(false)
  const [newName, setNewName] = useState('')

  const load = useCallback(async (dir?: string) => {
    setError('')
    try {
      const res = await api.browse(dir)
      setData(res)
      setCwd(res.path)
    } catch (err) {
      setError(String(err))
      setData(null)
    }
  }, [])

  useEffect(() => {
    void load(cwd || undefined)
  }, [load, cwd])

  function handleOpenDir(dir: string) {
    if (cwd) {
      void load(joinPath(cwd, dir))
    }
  }

  async function handleOpenFile(path: string) {
    await openFile(path)
    onNavigate()
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setCreating(false)
      return
    }
    let name = newName.trim()
    if (!/\.(md|txt)$/i.test(name)) name += '.md'
    const abs = joinPath(cwd, name)
    setCreating(false)
    setNewName('')
    await useStore.getState().newFile(abs)
    void load(cwd)
  }

  async function handleCreateDir() {
    if (!newName.trim()) {
      setCreatingDir(false)
      return
    }
    const name = newName.trim()
    const abs = joinPath(cwd, name)
    setCreatingDir(false)
    setNewName('')
    try {
      await api.mkdir(abs)
    } catch (err) {
      useStore.getState().setStatus(`Create folder failed: ${String(err)}`)
    }
    void load(cwd)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 pb-1 pt-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Files
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => void load(data?.home || '')}
            className="rounded p-1 text-gray-400 transition hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/30"
            title="Go to home folder"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M2.5 7 8 2.5 13.5 7M4 6v7.5h8V6"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={() => void load(cwd)}
            className="rounded p-1 text-gray-400 transition hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/30"
            title="Refresh this folder"
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
            onClick={() => { setCreating(true); setCreatingDir(false) }}
            className="rounded p-1 text-gray-400 transition hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/30"
            title="New file (.md or .txt)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => { setCreatingDir(true); setCreating(false) }}
            className="rounded p-1 text-gray-400 transition hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/30"
            title="New folder"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4.5V12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H8L6.5 3.5A1 1 0 0 0 5.8 3H3a1 1 0 0 0-1 1z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path d="M8 8.5v3M6.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {data?.quick && data.quick.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-1.5">
          {data.quick.map((q) => (
            <button
              key={q.path}
              onClick={() => void load(q.path)}
              className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 transition hover:bg-purple-50 hover:text-purple-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-purple-900/30"
            >
              {q.name}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => data?.parent && void load(data.parent)}
        disabled={!data?.parent}
        className="flex items-center gap-1 px-3 py-1 text-left text-[11px] text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
        title={cwd}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="truncate">{cwd || '…'}</span>
      </button>

      {(creating || creatingDir) && (
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void (creating ? handleCreate() : handleCreateDir())
            if (e.key === 'Escape') {
              setCreating(false)
              setCreatingDir(false)
              setNewName('')
            }
          }}
          onBlur={() => void (creating ? handleCreate() : handleCreateDir())}
          placeholder={creating ? 'note.md' : 'folder-name'}
          className="mx-3 mb-1 w-[calc(100%-24px)] rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        />
      )}

      {error && (
        <p className="px-3 py-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <nav className="flex-1 overflow-y-auto pb-2">
        {data?.dirs.map((dir) => (
          <button
            key={dir}
            onClick={() => handleOpenDir(dir)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-600 transition hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-amber-400">
              <path
                d="M2 4.5V12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H8L6.5 3.5A1 1 0 0 0 5.8 3H3a1 1 0 0 0-1 1z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            <span className="truncate">{dir}</span>
          </button>
        ))}
        {data?.files.map((file) => {
          const badge = EXT_BADGE[file.ext]
          return (
            <button
              key={file.path}
              onClick={() => void handleOpenFile(file.path)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-600 transition hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {badge && (
                <span className={`shrink-0 rounded px-1 py-px font-mono text-[9px] font-bold ${badge.cls}`}>
                  {badge.label}
                </span>
              )}
              <span className="truncate">{file.name}</span>
            </button>
          )
        })}
        {data && data.dirs.length === 0 && data.files.length === 0 && !error && (
          <p className="px-3 py-1 text-xs italic text-gray-400 dark:text-gray-500">
            Empty folder
          </p>
        )}
      </nav>
    </div>
  )
}