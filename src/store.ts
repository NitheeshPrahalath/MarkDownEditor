import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from './api'

export type FontFamily = 'serif' | 'sans'
export type Theme = 'light' | 'dark'
export type SidebarTab = 'files' | 'chapters'

interface NovelState {
  root: string
  configured: boolean
  files: string[]
  activeFile: string | null
  content: string
  savedContent: string
  docxText: string
  savedDocxText: string
  saving: boolean
  dirty: boolean
  editable: boolean
  editMode: boolean
  sidebarTab: SidebarTab
  font: FontFamily
  fontSize: number
  lineHeight: number
  focusMode: boolean
  tocOpen: boolean
  chaptersDrawer: boolean
  sidebarOpen: boolean
  theme: Theme
  statusMessage: string

  setRoot: (root: string) => void
  loadFiles: () => Promise<void>
  openFile: (path: string) => Promise<void>
  setContent: (content: string) => void
  setDocxText: (text: string) => void
  saveFile: () => Promise<void>
  newFile: (path: string) => Promise<void>
  setFont: (font: FontFamily) => void
  setFontSize: (size: number) => void
  setLineHeight: (lh: number) => void
  toggleFocusMode: () => void
  toggleToc: () => void
  toggleEditMode: () => void
  setSidebarTab: (tab: SidebarTab) => void
  setChaptersDrawer: (open: boolean) => void
  toggleSidebar: () => void
  toggleTheme: () => void
  setStatus: (msg: string) => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useStore = create<NovelState>()(
  persist(
    (set, get) => ({
      root: '',
      configured: false,
      files: [],
      activeFile: null,
      content: '',
      savedContent: '',
      docxText: '',
      savedDocxText: '',
      saving: false,
      dirty: false,
      editable: true,
      editMode: true,
      sidebarTab: 'files',
      font: 'serif',
      fontSize: 18,
      lineHeight: 1.8,
      focusMode: false,
      tocOpen: true,
      chaptersDrawer: false,
      sidebarOpen: true,
      theme: 'light',
      statusMessage: '',

      setRoot: (root) => set({ root, configured: true }),

      loadFiles: async () => {
        try {
          const { files } = await api.listFiles()
          set({ files })
        } catch (err) {
          set({ statusMessage: `Failed to list files: ${String(err)}` })
        }
      },

      openFile: async (path) => {
        try {
          if (saveTimer) clearTimeout(saveTimer)
          await get().saveFile()
          const { content, encoding } = await api.readFile(path)
          const ext = path.slice(path.lastIndexOf('.')).toLowerCase()
          const isDocx = ext === '.docx'
          set({
            activeFile: path,
            content,
            savedContent: content,
            docxText: '',
            savedDocxText: '',
            dirty: false,
            editable: encoding === 'utf8' || isDocx,
          })
          if (!['.md', '.txt', '.csv'].includes(ext)) {
            set({ tocOpen: false })
          }
        } catch (err) {
          set({ statusMessage: `Failed to open file: ${String(err)}` })
        }
      },

      setContent: (content) => {
        if (!get().editable) return
        set({ content, dirty: content !== get().savedContent })
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(() => {
          void get().saveFile()
        }, 1000)
      },

      setDocxText: (text) => {
        set({ docxText: text, dirty: text !== get().savedDocxText })
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(() => {
          void get().saveFile()
        }, 1000)
      },

      saveFile: async () => {
        const state = get()
        if (!state.activeFile || !state.dirty || state.saving) return
        set({ saving: true })
        try {
          const ext = state.activeFile.slice(state.activeFile.lastIndexOf('.')).toLowerCase()
          if (ext === '.docx') {
            await api.writeDocx(state.activeFile, state.docxText)
            set({ savedDocxText: state.docxText, dirty: false, saving: false })
          } else {
            await api.writeFile(state.activeFile, state.content)
            set({ savedContent: state.content, dirty: false, saving: false })
          }
        } catch (err) {
          set({ saving: false, statusMessage: `Save failed: ${String(err)}` })
        }
      },

      newFile: async (path) => {
        try {
          await api.createFile(path)
          await get().loadFiles()
          await get().openFile(path)
        } catch (err) {
          set({ statusMessage: `Create failed: ${String(err)}` })
        }
      },

      setFont: (font) => set({ font }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      toggleFocusMode: () =>
        set((s) => ({ focusMode: !s.focusMode, chaptersDrawer: false })),
      toggleToc: () => set((s) => ({ tocOpen: !s.tocOpen })),
      toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),
      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
      setChaptersDrawer: (chaptersDrawer) => set({ chaptersDrawer }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setStatus: (statusMessage) => set({ statusMessage }),
    }),
    {
      name: 'novel-editor-prefs',
      partialize: (s) => ({
        font: s.font,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        tocOpen: s.tocOpen,
        sidebarOpen: s.sidebarOpen,
        theme: s.theme,
        editMode: s.editMode,
        sidebarTab: s.sidebarTab,
      }),
    }
  )
)
