import { useStore, type SidebarTab } from '../store'
import { FileBrowser } from './FileBrowser'
import { ChapterListContent } from './ChapterList'

export function Sidebar() {
  const drawerOpen = useStore((s) => s.chaptersDrawer)
  const setDrawer = useStore((s) => s.setChaptersDrawer)
  const tab = useStore((s) => s.sidebarTab)
  const setTab = useStore((s) => s.setSidebarTab)

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
            ? 'absolute inset-y-0 left-0 z-40 flex w-64 shadow-2xl md:static md:z-auto md:w-56 md:shadow-none'
            : 'hidden w-56 shrink-0 md:flex'
        } h-full`}
      >
        <div className="flex items-center gap-1 px-2 pb-1 pt-2">
          {(['files', 'chapters'] as SidebarTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded px-2 py-1 text-xs font-medium capitalize transition ${
                tab === t
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === 'files' ? (
          <FileBrowser onNavigate={() => setDrawer(false)} />
        ) : (
          <ChapterListContent onNavigate={() => setDrawer(false)} />
        )}
      </aside>
    </>
  )
}