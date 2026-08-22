import { useEffect, useState } from 'react'

interface SheetData {
  name: string
  rows: string[][]
}

export function SheetViewer({ base64 }: { base64: string }) {
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [active, setActive] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function parse() {
      try {
        const XLSX = await import('xlsx')
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
        const wb = XLSX.read(bytes, { type: 'array' })
        const parsed: SheetData[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name]
          const rows = XLSX.utils.sheet_to_json<string[]>(ws, {
            header: 1,
            raw: false,
            defval: '',
          })
          return { name, rows: rows.map((r) => r.map((c) => String(c ?? ''))) }
        })
        if (!cancelled) setSheets(parsed)
      } catch (err) {
        if (!cancelled) setError(String(err))
      }
    }
    void parse()
    return () => {
      cancelled = true
    }
  }, [base64])

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-500">Failed to open spreadsheet: {error}</p>
      </div>
    )
  }

  if (sheets.length === 0) {
    return <p className="p-8 text-center text-sm text-gray-400">Empty spreadsheet</p>
  }

  const sheet = sheets[Math.min(active, sheets.length - 1)]
  const maxCols = Math.max(...sheet.rows.map((r) => r.length), 1)

  return (
    <div className="flex flex-col gap-3">
      {sheets.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {sheets.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setActive(i)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                i === active
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-auto rounded border border-gray-200 dark:border-gray-800">
        <table className="w-full border-collapse text-xs">
          <tbody>
            {sheet.rows.map((row, ri) => (
              <tr key={ri} className="even:bg-gray-50 dark:even:bg-gray-900/50">
                <td className="sticky left-0 border-r border-b border-gray-200 bg-gray-100 px-2 py-1 text-center font-mono text-[10px] text-gray-400 dark:border-gray-800 dark:bg-gray-800">
                  {ri + 1}
                </td>
                {Array.from({ length: maxCols }, (_, ci) => (
                  <td
                    key={ci}
                    className="max-w-[280px] truncate whitespace-nowrap border-b border-gray-100 px-2 py-1 text-gray-700 dark:border-gray-800/60 dark:text-gray-300"
                  >
                    {row[ci] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
