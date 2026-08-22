import { useEffect, useState } from 'react'

export function DocxViewer({ base64 }: { base64: string }) {
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mammoth = (await import('mammoth/mammoth.browser')).default
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
        const result = await mammoth.convertToHtml(
          { buffer: bytes.buffer as ArrayBuffer },
          { styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Subtitle'] => h2:fresh"] }
        )
        if (!cancelled) setHtml(result.value)
      } catch (err) {
        if (!cancelled) setError(String(err))
      }
    }
    void render()
    return () => {
      cancelled = true
    }
  }, [base64])

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-500">Failed to open document: {error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <div className="novel-preview" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
