import { useState } from 'react'
import { api } from '../api'
import { useStore } from '../store'

export function SetupDialog({ onClose }: { onClose: () => void }) {
  const setRoot = useStore((s) => s.setRoot)
  const loadFiles = useStore((s) => s.loadFiles)
  const [dir, setDir] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Open Novel Directory</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter the absolute path to your novel repository folder on this machine.
        </p>
        <input
          autoFocus
          value={dir}
          onChange={(e) => setDir(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleConnect()
          }}
          placeholder="/home/username/novels"
          className="mt-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        />
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
