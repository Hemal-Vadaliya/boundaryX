import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export type DuplicateResolution = 'skip' | 'copy' | 'cancel'

interface DuplicateMatchDialogProps {
  open: boolean
  matchName: string
  onResolve: (resolution: DuplicateResolution) => void
}

/**
 * A match with this id is already loaded. Per the plan (section 11.2) this
 * is never resolved silently — the user explicitly picks skip, import as a
 * copy, or cancel the whole import.
 */
export function DuplicateMatchDialog({
  open,
  matchName,
  onResolve,
}: DuplicateMatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onResolve('cancel')}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate match</DialogTitle>
          <DialogDescription>
            &ldquo;{matchName}&rdquo; is already loaded in this session. Choose how to
            proceed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:flex-col">
          <Button variant="outline" onClick={() => onResolve('skip')}>
            Skip this match
          </Button>
          <Button variant="outline" onClick={() => onResolve('copy')}>
            Import as a new copy
          </Button>
          <Button variant="ghost" onClick={() => onResolve('cancel')}>
            Cancel import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
