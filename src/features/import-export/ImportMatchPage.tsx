import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { ImportDropzone } from '@/components/common/ImportDropzone'
import { PrimaryButton } from '@/components/common/PrimaryButton'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import {
  parseImportedFile,
  isImportFailure,
  checkMatchConsistency,
  importAsCopy,
  isFileTooLarge,
  MAX_IMPORT_FILE_SIZE_BYTES,
} from '@/services/importService'
import type { ImportFailure } from '@/services/importService'
import { readFileAsText, isFileReadError } from '@/services/fileService'
import { ImportPreviewCard } from '@/features/import-export/ImportPreviewCard'
import { DuplicateMatchDialog } from '@/features/import-export/DuplicateMatchDialog'
import type { DuplicateResolution } from '@/features/import-export/DuplicateMatchDialog'
import type { MatchDocument } from '@/domain/match/types'

interface PendingMatch {
  match: MatchDocument
  fileName: string
}

export function ImportMatchPage() {
  const navigate = useNavigate()
  const sessionMatches = useSessionStore((s) => s.matches)
  const addMatch = useSessionStore((s) => s.addMatch)

  const [isReading, setIsReading] = useState(false)
  const [failures, setFailures] = useState<ImportFailure[]>([])
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [duplicateQueue, setDuplicateQueue] = useState<PendingMatch[]>([])
  const [resolvedMatches, setResolvedMatches] = useState<MatchDocument[]>([])
  const [imported, setImported] = useState(false)

  async function handleFilesSelected(files: File[]) {
    setIsReading(true)
    setFailures([])
    setPendingMatches([])
    setResolvedMatches([])
    setImported(false)

    const newFailures: ImportFailure[] = []
    const newPending: PendingMatch[] = []

    for (const file of files) {
      if (isFileTooLarge(file)) {
        newFailures.push({
          fileName: file.name,
          reason: 'invalid-json',
          message: `This file is larger than the ${Math.round(MAX_IMPORT_FILE_SIZE_BYTES / (1024 * 1024))} MB import limit.`,
        })
        continue
      }
      const read = await readFileAsText(file)
      if (isFileReadError(read)) {
        newFailures.push({
          fileName: file.name,
          reason: 'invalid-json',
          message: read.error,
        })
        continue
      }
      const parsed = parseImportedFile(file.name, read.text)
      if (isImportFailure(parsed)) {
        newFailures.push(parsed)
        continue
      }
      for (const match of parsed.matches) {
        newPending.push({ match, fileName: file.name })
      }
    }

    setIsReading(false)
    setFailures(newFailures)
    setPendingMatches(newPending)

    const duplicates = newPending.filter((p) => !!sessionMatches[p.match.id])
    const nonDuplicates = newPending.filter((p) => !sessionMatches[p.match.id])
    setResolvedMatches(nonDuplicates.map((p) => p.match))
    setDuplicateQueue(duplicates)
  }

  function handleDuplicateResolution(resolution: DuplicateResolution) {
    const [current, ...rest] = duplicateQueue
    if (!current) return

    if (resolution === 'cancel') {
      setDuplicateQueue([])
      setPendingMatches([])
      setResolvedMatches([])
      return
    }

    if (resolution === 'copy') {
      setResolvedMatches((prev) => [...prev, importAsCopy(current.match)])
    }
    // 'skip' adds nothing for this match.

    setDuplicateQueue(rest)
  }

  function handleConfirmImport() {
    for (const match of resolvedMatches) {
      addMatch(match, { dirty: false })
    }
    setImported(true)
  }

  const currentDuplicate = duplicateQueue[0]
  const isResolvingDuplicates = duplicateQueue.length > 0
  const hasAnythingToImport = pendingMatches.length > 0

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <div className="mb-2 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Import Match</h1>
        <p className="text-muted-foreground text-sm">
          Import one or more BoundaryX match JSON files into this session. Importing never
          replaces another loaded match. Each file must be under{' '}
          {Math.round(MAX_IMPORT_FILE_SIZE_BYTES / (1024 * 1024))} MB.
        </p>
      </div>

      {!hasAnythingToImport && !isReading && failures.length === 0 && (
        <ImportDropzone onFilesSelected={handleFilesSelected} />
      )}

      {isReading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Reading files…
        </div>
      )}

      {failures.length > 0 && (
        <div className="space-y-2">
          <p className="text-destructive flex items-center gap-1.5 text-sm font-medium">
            <AlertTriangle className="size-4" />
            {failures.length} file{failures.length === 1 ? '' : 's'} could not be imported
          </p>
          <ul className="text-muted-foreground space-y-1 text-sm">
            {failures.map((failure) => (
              <li key={failure.fileName}>
                <span className="font-medium">{failure.fileName}:</span> {failure.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasAnythingToImport && !imported && (
        <div className="space-y-4">
          <p className="text-sm font-medium">
            {pendingMatches.length} match{pendingMatches.length === 1 ? '' : 'es'} found —
            review before importing.
          </p>

          {resolvedMatches.map((match) => (
            <ImportPreviewCard
              key={match.id}
              match={match}
              consistency={checkMatchConsistency(match)}
              isDuplicate={false}
            />
          ))}

          {!isResolvingDuplicates && (
            <div className="flex gap-2">
              <PrimaryButton
                onClick={handleConfirmImport}
                disabled={resolvedMatches.length === 0}
              >
                Import {resolvedMatches.length} Match
                {resolvedMatches.length === 1 ? '' : 'es'}
              </PrimaryButton>
              <Button
                variant="outline"
                onClick={() => {
                  setPendingMatches([])
                  setResolvedMatches([])
                  setFailures([])
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {imported && (
        <div className="space-y-3">
          <p className="text-success text-sm font-medium">
            Imported {resolvedMatches.length} match
            {resolvedMatches.length === 1 ? '' : 'es'} into this session.
          </p>
          <div className="flex gap-2">
            <PrimaryButton onClick={() => navigate('/matches')}>
              Go to Matches
            </PrimaryButton>
            <Button
              variant="outline"
              onClick={() => {
                setPendingMatches([])
                setResolvedMatches([])
                setFailures([])
                setImported(false)
              }}
            >
              Import more
            </Button>
          </div>
        </div>
      )}

      {currentDuplicate && (
        <DuplicateMatchDialog
          open
          matchName={currentDuplicate.match.name}
          onResolve={handleDuplicateResolution}
        />
      )}
    </PageContainer>
  )
}
