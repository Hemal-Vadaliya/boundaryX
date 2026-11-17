import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Team } from '@/domain/team/types'

export interface TossStepFields {
  tossCallerTeamSide?: 'A' | 'B'
  tossCallSide?: 'heads' | 'tails'
  coinResult?: 'heads' | 'tails'
  tossWinnerTeamSide?: 'A' | 'B'
  tossDecision?: 'bat' | 'bowl'
}

interface TossStepProps extends TossStepFields {
  teamA: Team
  teamB: Team
  onChange: (fields: TossStepFields) => void
}

const COIN_FLIP_SRC = `${import.meta.env.BASE_URL}coinflip.html`

function otherSide(side: 'A' | 'B'): 'A' | 'B' {
  return side === 'A' ? 'B' : 'A'
}

export function TossStep({
  teamA,
  teamB,
  tossCallerTeamSide,
  tossCallSide,
  coinResult,
  tossWinnerTeamSide,
  tossDecision,
  onChange,
}: TossStepProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const callRef = useRef<'heads' | 'tails' | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)

  function teamName(side: 'A' | 'B'): string {
    return side === 'A' ? teamA.name : teamB.name
  }

  function resetToss() {
    setDialogOpen(false)
    setIsFlipping(false)
    callRef.current = null
    onChange({
      tossCallerTeamSide: undefined,
      tossCallSide: undefined,
      coinResult: undefined,
      tossWinnerTeamSide: undefined,
      tossDecision: undefined,
    })
  }

  function startFlip(call: 'heads' | 'tails') {
    if (isFlipping || !tossCallerTeamSide) return

    callRef.current = call
    onChange({
      tossCallSide: call,
      coinResult: undefined,
      tossWinnerTeamSide: undefined,
      tossDecision: undefined,
    })
    setIsFlipping(true)
    setDialogOpen(true)
  }

  // The iframe is a verbatim copy of the user-provided coinflip.html
  // reference (public/coinflip.html) — running the actual tested
  // animation in its own document, completely isolated from this app's
  // Tailwind resets, MotionConfig, and the Dialog's own transforms, all of
  // which previously interfered with the in-app CSS/Motion re-implementations.
  // The parent only tells it when to start and listens for its result.
  function handleIframeLoad() {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'boundaryx-coin-start' },
      '*'
    )
  }

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data?.type !== 'boundaryx-coin-result') return
      const result = event.data.result as 'heads' | 'tails'
      const call = callRef.current
      if (!call || !tossCallerTeamSide) return

      setIsFlipping(false)
      const winnerSide =
        call === result ? tossCallerTeamSide : otherSide(tossCallerTeamSide)
      onChange({ coinResult: result, tossWinnerTeamSide: winnerSide })
    },
    [tossCallerTeamSide, onChange]
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Step 1: which team calls?
  if (!tossCallerTeamSide) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Which team calls heads or tails?</p>
        <RadioGroup
          value=""
          onValueChange={(v) => onChange({ tossCallerTeamSide: v as 'A' | 'B' })}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="A" id="caller-a" />
            <Label htmlFor="caller-a" className="font-normal">
              {teamA.name}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="B" id="caller-b" />
            <Label htmlFor="caller-b" className="font-normal">
              {teamB.name}
            </Label>
          </div>
        </RadioGroup>
      </div>
    )
  }

  // Step 2: the calling team picks heads/tails; a popup opens and runs the
  // reference coin-flip animation inside an isolated iframe before the
  // result (and winner) is revealed.
  return (
    <div className="space-y-4">
      <p className="text-sm">
        <span className="font-medium">{teamName(tossCallerTeamSide)}</span>, call it:
      </p>

      {!tossCallSide && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => startFlip('heads')}>
            Heads
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => startFlip('tails')}>
            Tails
          </Button>
        </div>
      )}

      {tossCallSide && coinResult && !dialogOpen && (
        <div className="space-y-3 text-center">
          <p className="text-sm">
            {teamName(tossCallerTeamSide)} called{' '}
            <span className="font-medium capitalize">{tossCallSide}</span>, the coin landed
            on <span className="font-semibold capitalize">{coinResult}</span>
            {' — '}
            <span className="font-semibold">{teamName(tossWinnerTeamSide!)}</span> won the
            toss.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              {teamName(tossWinnerTeamSide!)} elects to
            </p>
            <RadioGroup
              value={tossDecision ?? ''}
              onValueChange={(v) => onChange({ tossDecision: v as 'bat' | 'bowl' })}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="bat" id="toss-bat" />
                <Label htmlFor="toss-bat" className="font-normal">
                  Bat first
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="bowl" id="toss-bowl" />
                <Label htmlFor="toss-bowl" className="font-normal">
                  Bowl first
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      <Button variant="link" size="sm" className="px-0" onClick={resetToss}>
        Redo toss
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && isFlipping) return
          setDialogOpen(open)
        }}
      >
        <DialogContent showCloseButton={!isFlipping}>
          <DialogHeader>
            <DialogTitle>Coin Toss</DialogTitle>
            <DialogDescription>
              {tossCallSide && (
                <>
                  {teamName(tossCallerTeamSide)} called{' '}
                  <span className="capitalize">{tossCallSide}</span>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {dialogOpen && (
            <iframe
              ref={iframeRef}
              src={COIN_FLIP_SRC}
              title="Coin flip animation"
              className="h-56 w-full rounded-lg border-0"
              onLoad={handleIframeLoad}
            />
          )}

          {!isFlipping && coinResult && (
            <div className="space-y-3 text-center">
              <p className="text-sm">
                Landed on <span className="font-semibold capitalize">{coinResult}</span> —{' '}
                <span className="font-semibold">{teamName(tossWinnerTeamSide!)}</span> won
                the toss.
              </p>
              <Button className="w-full" onClick={() => setDialogOpen(false)}>
                Continue
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
