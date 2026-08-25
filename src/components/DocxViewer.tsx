import { useEffect, useRef, useState } from 'react'

interface DocxViewerProps {
  base64: string
  onTextExtracted?: (text: string) => void
}

export function DocxViewer({ base64, onTextExtracted }: DocxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function render() {
      if (!base64 || base64.trim() === '') {
        if (!cancelled) {
          setError('No document content available')
          setLoading(false)
        }
        return
      }
      if (!containerRef.current) return
      try {
        const { renderAsync } = await import('docx-preview')
        const raw = atob(base64)
        const bytes = new Uint8Array(raw.length)
        for (let i = 0; i < raw.length; i++) {
          bytes[i] = raw.charCodeAt(i)
        }
        if (!cancelled) {
          containerRef.current.innerHTML = ''
          await renderAsync(bytes.buffer as ArrayBuffer, containerRef.current, undefined, {
            className: 'docx-preview',
            inWrapper: true,
            trimXmlDeclaration: true,
            debug: false,
          })
          setLoading(false)
          if (onTextExtracted && containerRef.current) {
            const text = containerRef.current.textContent || ''
            onTextExtracted(text)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err))
          setLoading(false)
        }
      }
    }
    void render()
    return () => {
      cancelled = true
    }
  }, [base64, onTextExtracted])

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-500">Failed to open document: {error}</p>
        <p className="mt-2 text-xs text-gray-400">
          The document may have complex formatting that cannot be rendered.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      {loading && (
        <p className="text-center text-sm text-gray-400 animate-pulse">Loading document...</p>
      )}
      <div ref={containerRef} className="docx-container" />
    </div>
  )
}
