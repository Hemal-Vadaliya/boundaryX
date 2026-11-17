import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/store/sessionStore'
import { useLoadedMatchDocuments } from '@/store/matchSelectors'
import { serializeBundleFile, buildBundleFilename } from '@/services/exportService'
import { downloadTextFile } from '@/services/fileService'

/**
 * Downloads every match currently loaded in the session as a single
 * versioned bundle file (plan section 11.4) and marks each one clean —
 * matching ExportMatchButton's per-match behaviour so "export all" counts
 * as saving every match it includes.
 */
export function ExportAllButton() {
  const matches = useLoadedMatchDocuments()
  const markClean = useSessionStore((s) => s.markClean)

  function handleExportAll() {
    if (matches.length === 0) return
    downloadTextFile(buildBundleFilename(matches.length), serializeBundleFile(matches))
    for (const match of matches) markClean(match.id)
  }

  return (
    <Button variant="outline" onClick={handleExportAll} disabled={matches.length === 0}>
      <Download className="size-4" />
      Export All
    </Button>
  )
}
