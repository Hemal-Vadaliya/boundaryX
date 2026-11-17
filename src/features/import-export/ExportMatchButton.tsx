import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MatchDocument } from '@/domain/match/types'
import { serializeMatchFile, buildMatchFilename } from '@/services/exportService'
import { downloadTextFile } from '@/services/fileService'
import { useSessionStore } from '@/store/sessionStore'

interface ExportMatchButtonProps {
  match: MatchDocument
  variant?: 'default' | 'outline'
}

/**
 * Downloads one match as a JSON file and marks the session's dirty flag
 * for it clean, per the plan (section 11.5): a match is only ever
 * considered "saved" once the user has actually downloaded it, and the
 * clean mark is set only after the download is initiated successfully.
 */
export function ExportMatchButton({
  match,
  variant = 'outline',
}: ExportMatchButtonProps) {
  const markClean = useSessionStore((s) => s.markClean)

  function handleExport() {
    downloadTextFile(buildMatchFilename(match), serializeMatchFile(match))
    markClean(match.id)
  }

  return (
    <Button variant={variant} onClick={handleExport}>
      <Download className="size-4" />
      Export
    </Button>
  )
}
