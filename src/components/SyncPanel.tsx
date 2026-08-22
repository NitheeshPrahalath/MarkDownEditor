import { useState } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import { useGitEngine } from '../hooks/useGitEngine'
import { DiffViewer } from './DiffViewer'

export function SyncPanel({ onClose }: { onClose: () => void }) {
  const statusMessage = useStore((s) => s.statusMessage)
  const setStatus = useStore((s) => s.setStatus)
  const loadFiles = useStore((s) => s.loadFiles)
  const { repo, status, log, loading, error, refresh } = useGitEngine()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [diffText, setDiffText] = useState('')

  async function run(fn: () => Promise<unknown>, okMsg: string) {
    setBusy(true)
    setStatus('')
    try {
      await fn()
      await refresh()
      setStatus(okMsg)
    } catch (err) {
      setStatus(`Git error: ${String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleCommit(pushAfter: boolean) {
    if (!message.trim()) return
    setBusy(true)
    try {
      await api.gitCommit(message.trim())
      setMessage('')
      if (pushAfter) {
        await api.gitPush()
        await refresh()
        setStatus('Committed and pushed to remote.')
      } else {
        await refresh()
        setStatus('Committed locally.')
      }
    } catch (err) {
      setStatus(`Git error: ${String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  async function handlePull() {
    await run(async () => {
      await api.gitPull()
      await loadFiles()
    }, 'Pulled latest changes and refreshed file list.')
  }

  async function toggleDiff() {
    if (showDiff) {
      setShowDiff(false)
      return
    }
    setBusy(true)
    try {
      const res = await api.gitDiff()
      setDiffText(res.diff)
      setShowDiff(true)
    } catch (err) {
      setStatus(`Git error: ${String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onClick={onClose}>
      <aside
        className="flex h-full w-96 flex-col overflow-y-auto border-l border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Git Sync</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded bg-red-50 px-2 py-1 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        )}

        {repo && repo.isRepo ? (
          <>
            <div className="mb-3 rounded bg-purple-50 px-3 py-2 text-xs text-purple-900 dark:bg-purple-900/20 dark:text-purple-200">
              <p>
                <span className="font-semibold">Branch:</span> {repo.branch || '(no commits)'}
              </p>
              {repo.remote && (
                <p className="mt-0.5 truncate">
                  <span className="font-semibold">Remote:</span> {repo.remote}
                </p>
              )}
            </div>

            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Changes ({status.length})
            </h3>
            <ul className="mb-3 max-h-36 overflow-y-auto rounded border border-gray-100 dark:border-gray-800">
              {status.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 px-2 py-1 text-xs text-gray-700 odd:bg-gray-50 dark:text-gray-300 dark:odd:bg-gray-800/60"
                >
                  <span
                    className={`inline-block w-5 rounded text-center font-mono ${
                      f.status.includes('?')
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}
                  >
                    {f.status}
                  </span>
                  <span className="truncate">{f.file}</span>
                </li>
              ))}
              {status.length === 0 && (
                <li className="px-2 py-1 text-xs italic text-gray-400 dark:text-gray-500">
                  Working tree clean
                </li>
              )}
            </ul>

            <button
              onClick={() => void toggleDiff()}
              disabled={busy}
              className={`mb-3 rounded px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                showDiff
                  ? 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60'
              }`}
            >
              {showDiff ? 'Hide diff' : 'Review changes before commit'}
            </button>
            {showDiff && (
              <div className="mb-3 max-h-64 overflow-y-auto">
                <DiffViewer diffText={diffText} />
              </div>
            )}

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Commit message..."
              rows={2}
              className="mb-2 w-full resize-none rounded border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => void handleCommit(false)}
                disabled={busy || !message.trim()}
                className="rounded bg-purple-100 px-3 py-2 text-xs font-medium text-purple-700 transition hover:bg-purple-200 disabled:opacity-40 dark:bg-purple-900/40 dark:text-purple-300"
              >
                Commit
              </button>
              <button
                onClick={() => void handleCommit(true)}
                disabled={busy || !message.trim()}
                className="rounded bg-purple-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-purple-700 disabled:opacity-40"
              >
                Commit & Push
              </button>
            </div>

            <div className="mb-4 mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => void handlePull()}
                disabled={busy}
                className="rounded bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Pull Latest
              </button>
              <button
                onClick={() => void refresh()}
                disabled={busy}
                className="rounded bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Refresh Status
              </button>
            </div>

            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Recent Commits
            </h3>
            <ul className="space-y-1">
              {log.slice(0, 8).map((c) => (
                <li key={c.hash} className="rounded px-2 py-1 text-xs odd:bg-gray-50 dark:odd:bg-gray-800/60">
                  <span className="font-mono text-purple-600 dark:text-purple-400">{c.hash.slice(0, 7)}</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">{c.message}</span>
                  <span className="block text-[10px] text-gray-400 dark:text-gray-500">
                    {c.author} · {c.date}
                  </span>
                </li>
              ))}
              {log.length === 0 && (
                <li className="px-2 py-1 text-xs italic text-gray-400">No commits yet</li>
              )}
            </ul>
          </>
        ) : (
          <p className="text-xs italic text-gray-400 dark:text-gray-500">
            This directory is not a git repository. Run{' '}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">git init</code> and add a remote to enable sync.
          </p>
        )}

        {loading && <p className="mt-3 animate-pulse text-xs text-gray-400">Working...</p>}
        {statusMessage && (
          <p className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded bg-purple-600 px-4 py-2 text-xs text-white shadow-lg">
            {statusMessage}
          </p>
        )}
      </aside>
    </div>
  )
}
