import { useCallback, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportDropzoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  className?: string
}

/**
 * Drag/drop and click-to-browse target for importing match JSON files.
 * This component only surfaces selected files — parsing, schema validation
 * and duplicate handling are implemented in the Phase 6 import service.
 */
export function ImportDropzone({
  onFilesSelected,
  accept = 'application/json',
  multiple = true,
  className,
}: ImportDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragOver(false)
      const files = Array.from(event.dataTransfer.files)
      if (files.length > 0) onFilesSelected(files)
    },
    [onFilesSelected]
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'border-border flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
        isDragOver && 'border-primary bg-primary/5',
        className
      )}
    >
      <UploadCloud className="text-muted-foreground size-8" />
      <p className="text-sm font-medium">Drop match JSON files here</p>
      <p className="text-muted-foreground text-xs">or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length > 0) onFilesSelected(files)
          event.target.value = ''
        }}
      />
    </div>
  )
}
