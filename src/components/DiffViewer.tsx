import { useMemo } from 'react'
import { parseUnifiedDiff } from '../utils/diffParser'

const TYPE_STYLES: Record<string, string> = {
  add: 'bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-200',
  del: 'bg-red-50 text-red-900 dark:bg-red-900/30 dark:text-red-200',
  hunk: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  meta: 'bg-gray-100 text-gray-700 font-semibold dark:bg-gray-800 dark:text-gray-300',
  ctx: 'text-gray-600 dark:text-gray-400',
}

const PREFIX: Record<string, string> = {
  add: '+',
  del: '-',
  hunk: '',
  meta: '',
  ctx: ' ',
}

export function DiffViewer({ diffText }: { diffText: string }) {
  const lines = useMemo(() => parseUnifiedDiff(diffText), [diffText])

  if (lines.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">
        No changes detected — working tree is clean.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200 font-mono text-xs leading-5 dark:border-gray-800">
      {lines.map((line, i) => (
        <div key={i} className={`whitespace-pre-wrap px-3 py-px ${TYPE_STYLES[line.type]}`}>
          <span className="mr-2 inline-block w-3 select-none text-gray-400">
            {PREFIX[line.type]}
          </span>
          {line.text || '\u00A0'}
        </div>
      ))}
    </div>
  )
}
