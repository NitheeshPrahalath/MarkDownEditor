import { useEffect, useState } from 'react'
import { api } from './api'
import { useStore, type FontFamily } from './store'
import { ChapterList } from './components/ChapterList'
import { EditorCanvas } from './components/EditorCanvas'
import { TableOfContents } from './components/TableOfContents'
import { SetupDialog } from './components/SetupDialog'
import { StatusBar } from './components/StatusBar'
import { SyncPanel } from './components/SyncPanel'

function App() {
  const configured = useStore((s) => s.configured)
  const setRoot = useStore((s) => s.setRoot)
  const loadFiles = useStore((s) => s.loadFiles)
  const saveFile = useStore((s) => s.saveFile)
  const focusMode = useStore((s) => s.focusMode)
  const toggleFocusMode = useStore((s) => s.toggleFocusMode)
  const tocOpen = useStore((s) => s.tocOpen)
  const toggleToc = useStore((s) => s.toggleToc)
  const chaptersDrawer = useStore((s) => s.chaptersDrawer)
  const setChaptersDrawer = useStore((s) => s.setChaptersDrawer)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const font = useStore((s) => s.font)
  const setFont = useStore((s) => s.setFont)
  const fontSize = useStore((s) => s.fontSize)
  const setFontSize = useStore((s) => s.setFontSize)
  const lineHeight = useStore((s) => s.lineHeight)
  const setLineHeight = useStore((s) => s.setLineHeight)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const statusMessage = useStore((s) => s.statusMessage)

  const [syncOpen, setSyncOpen] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [setupDismissed, setSetupDismissed] = useState(false)
  const root = useStore((s) => s.root)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    async function init() {
      try {
        const cfg = await api.getConfig()
        if (cfg.configured && cfg.root) {
          setRoot(cfg.root)
          await loadFiles()
        }
      } catch {
        // backend not reachable yet
      }
    }
    void init()
  }, [setRoot, loadFiles])

  useEffect(() => {
    if (!configured) return
    function onFocus() {
      void loadFiles()
    }
    window.addEventListener('focus', onFocus)
    const id = setInterval(() => {
      if (!document.hidden) void loadFiles()
    }, 15000)
    return () => {
      window.removeEventListener('focus', onFocus)
      clearInterval(id)
    }
  }, [configured, loadFiles])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && focusMode) {
        toggleFocusMode()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveFile()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusMode, toggleFocusMode, saveFile])

  async function handleOpenFolder() {
    try {
      await api.openFolder()
    } catch {
      // folder may not open on all platforms, ignore silently
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {!focusMode && (
        <header className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 md:gap-3 md:px-4 dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setChaptersDrawer(!chaptersDrawer)}
            className="rounded p-1.5 text-gray-500 transition hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-gray-800"
            title="Chapters"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M1 3h14M1 8h14M1 13h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-1.5 rounded px-1.5 py-1 text-sm font-bold text-purple-700 transition hover:bg-purple-50 sm:block dark:text-purple-400 dark:hover:bg-purple-900/30"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >

            Novel Editor
          </button>
          <div className="flex items-center gap-1 md:mx-2">
            {(['serif', 'sans'] as FontFamily[]).map((f) => (
              <button
                key={f}
                onClick={() => setFont(f)}
                className={`rounded px-2 py-1 text-xs capitalize transition ${
                  font === f
                    ? 'bg-purple-100 font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <label className="hidden items-center gap-1 text-xs text-gray-500 sm:flex dark:text-gray-400">
            Size
            <input
              type="range"
              min={14}
              max={28}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-20 accent-purple-600"
            />
          </label>
          <label className="hidden items-center gap-1 text-xs text-gray-500 lg:flex dark:text-gray-400">
            Height
            <input
              type="range"
              min={140}
              max={260}
              value={Math.round(lineHeight * 100)}
              onChange={(e) => setLineHeight(Number(e.target.value) / 100)}
              className="w-20 accent-purple-600"
            />
          </label>
          <div className="ml-auto flex items-center gap-1 md:gap-2">
            {configured && (
              <button
                onClick={() => void handleOpenFolder()}
                className="rounded p-1.5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Open folder in file explorer"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4.5V12a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1H8L6.5 3.5A1 1 0 005.8 3H3a1 1 0 00-1 1z" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
            )}
            <button
              onClick={() => { setShowSetup(true); setSetupDismissed(false) }}
              className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300"
              title="Change working directory"
            >
              Set Folder
            </button>
            <button
              onClick={toggleTheme}
              className="rounded p-1.5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1m0-14.2-2.1 2.1m-10 10-2.1 2.1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={toggleToc}
              className={`rounded px-2 py-1 text-xs transition ${
                tocOpen
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              TOC
            </button>
            <button
              onClick={() => setSyncOpen(true)}
              className="rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-purple-700"
            >
              Git Sync
            </button>
            <button
              onClick={toggleFocusMode}
              className="rounded px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              title="Distraction-free mode (Esc to exit)"
            >
              Focus
            </button>
          </div>
        </header>
      )}
      {focusMode ? (
        <>
          <EditorCanvas />
          <button
            onClick={toggleFocusMode}
            className="fixed right-4 top-4 z-30 rounded-full bg-black/10 p-2 text-gray-500 opacity-40 transition hover:opacity-100 dark:bg-white/10 dark:text-gray-400"
            title="Exit focus mode (Esc)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </>
      ) : (
        <div className="relative flex min-h-0 flex-1">
          {sidebarOpen && <ChapterList />}
          <EditorCanvas />
          {tocOpen && <TableOfContents />}
        </div>
      )}
      {!focusMode && <StatusBar />}
      {statusMessage && (
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {statusMessage}
        </div>
      )}
      {syncOpen && <SyncPanel onClose={() => setSyncOpen(false)} />}
      {(!configured || showSetup) && !setupDismissed && (
        <SetupDialog
          onClose={() => { setShowSetup(false); setSetupDismissed(true) }}
          defaultPath={configured ? root : undefined}
        />
      )}
    </div>
  )
}

export default App
