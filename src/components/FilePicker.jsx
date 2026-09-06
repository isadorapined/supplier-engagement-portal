import { useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { formatBytes } from '@/lib/format'

// The attached file stays in browser memory. Only its name and size are shown;
// its contents are never read or transmitted. Styled as a form control per
// 10.4: Mint Cream surface, Deep Teal bottom border, nothing else.
export default function FilePicker({ accept, file, onSelect, onRemove, label, hint }) {
  const inputRef = useRef(null)

  return (
    <div className="border-b-2 border-teal bg-mint p-5">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const selected = event.target.files?.[0]
          // Reset first, so choosing the same filename twice still fires.
          event.target.value = ''
          if (selected) onSelect(selected)
        }}
      />

      {file ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-body text-sm font-medium text-ink">{file.name}</p>
            <p className="font-body text-xs text-ink">{formatBytes(file.size)}</p>
          </div>
          <Button variant="nav" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-body text-sm font-medium text-ink">{label}</p>
            {hint ? <p className="font-body text-xs text-ink">{hint}</p> : null}
          </div>
          <Button variant="nav" size="sm" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
        </div>
      )}
    </div>
  )
}
