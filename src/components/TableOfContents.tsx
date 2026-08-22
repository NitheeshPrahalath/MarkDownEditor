import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { parseDocument } from '../utils/markdown'
import type { TocNode } from '../utils/tocGenerator'

function TocItem({ node, depth }: { node: TocNode; depth: number }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children.length > 0

  return (
    <li>
      <div className="flex items-center" style={{ paddingLeft: `${depth * 12}px` }}>
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            className="shrink-0 p-0.5 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className={`transition-transform ${open ? 'rotate-90' : ''}`}
            >
              <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
        ) : (
          <span className="w-[15px] shrink-0" />
        )}
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent('toc-navigate', { detail: node.id }))
          }
          className="truncate py-1 text-left text-xs text-gray-600 transition hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-400 md:py-0.5"
          title={node.text}
        >
          <span className="mr-1 font-mono text-[9px] text-gray-300">H{node.level}</span>
          {node.text}
        </button>
      </div>
      {hasChildren && open && (
        <ul>
          {node.children.map((child) => (
            <TocItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function TableOfContents() {
  const content = useStore((s) => s.content)
  const toggleToc = useStore((s) => s.toggleToc)
  const tree = useMemo(() => parseDocument(content).tree, [content])

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        onClick={toggleToc}
      />
      <aside
        className={`inset-y-0 right-0 z-40 h-full w-64 flex-col overflow-y-auto border-l border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 lg:relative lg:z-auto lg:w-60 lg:shrink-0 lg:shadow-none ${
          'absolute flex'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Table of Contents
          </h2>
          <button
            onClick={toggleToc}
            className="rounded p-1 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {tree.length === 0 ? (
            <p className="px-2 py-1 text-xs italic text-gray-400 dark:text-gray-500">
              Add headings (# Title) to build the TOC
            </p>
          ) : (
            <ul>
              {tree.map((node) => (
                <TocItem key={node.id} node={node} depth={0} />
              ))}
            </ul>
          )}
        </nav>
      </aside>
    </>
  )
}
