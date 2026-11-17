import { AlertTriangle } from 'lucide-react'
import { useHasUnsavedWork } from '@/store/matchSelectors'

export function UnsavedChangesBanner() {
  const hasUnsavedWork = useHasUnsavedWork()

  if (!hasUnsavedWork) return null

  return (
    <div className="bg-warning/15 text-foreground flex items-center gap-2 px-4 py-2 text-xs font-medium sm:text-sm">
      <AlertTriangle className="text-warning size-4 shrink-0" />
      <span>
        You have unsaved matches in this session. Export them to keep your work — closing
        or refreshing this tab will discard anything not downloaded.
      </span>
    </div>
  )
}
