import { useState } from 'react'
import { api } from '../api'
import { useStore } from '../store'

export function SetupDialog({ onClose, defaultPath }: { onClose: () => void; defaultPath?: string }) {
  const setRoot = useStore((s) => s.setRoot)
  const loadFiles = useStore((s) => s.loadFiles)
  const [dir, setDir] = useState(defaultPath ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [fileManagerStatus, setFileManagerStatus] = useState('')

  async function handleConnect() {
    if (!dir.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await api.setConfig(dir.trim())
      setRoot(res.root)
      await loadFiles()
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleOpenFileManager() {
    try {
      const pathToSend = dir.trim() || undefined
      console.log('[open-folder] calling API with path:', pathToSend)
      const res = await api.openFolder(pathToSend)
      console.log('[open-folder] response:', res)
      setFileManagerStatus('File manager opened — navigate to your directory, then paste the path above.')
      setTimeout(() => setFileManagerStatus(''), 5000)
    } catch (err) {
      console.error('[open-folder] error:', err)
      setFileManagerStatus('Could not open file manager. Please navigate manually and paste the path.')
      setTimeout(() => setFileManagerStatus(''), 5000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Open Novel Directory</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter the absolute path to your novel repository folder on this machine.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            autoFocus
            value={dir}
            onChange={(e) => setDir(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleConnect()
            }}
            placeholder="/home/username/novels"
            className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          <button
            onClick={() => void handleOpenFileManager()}
            className="shrink-0 rounded border border-gray-300 px-2 py-2 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Open file manager to browse for directory"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4.5V12a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1H8L6.5 3.5A1 1 0 005.8 3H3a1 1 0 00-1 1z" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          Tip: Click the folder icon to open your file manager, navigate to the directory, then paste the path here.
        </p>
        {fileManagerStatus && (
          <p className="mt-1.5 text-[11px] text-purple-600 dark:text-purple-400">{fileManagerStatus}</p>
        )}
        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => void handleConnect()}
            disabled={busy || !dir.trim()}
            className="rounded bg-purple-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {busy ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}
