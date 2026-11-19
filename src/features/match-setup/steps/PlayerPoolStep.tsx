import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { usePlayerPoolStore } from '@/store/playerPoolStore'
import { UserRound, X, Plus } from 'lucide-react'

/**
 * Enters the full list of players for both teams in one place, before
 * either team is assembled. The pool persists for the browser session
 * (see playerPoolStore.ts) so the next match's wizard run starts with the
 * same names already here.
 */
export function PlayerPoolStep() {
  const players = usePlayerPoolStore((s) => s.players)
  const addPlayer = usePlayerPoolStore((s) => s.addPlayer)
  const removePlayer = usePlayerPoolStore((s) => s.removePlayer)
  const [newPlayerName, setNewPlayerName] = useState('')

  function handleAdd() {
    const name = newPlayerName.trim()
    if (!name) return
    addPlayer(name)
    setNewPlayerName('')
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Add every player for both teams here. You&apos;ll assign each one to Team A or
        Team B next.
      </p>

      <div className="flex gap-2">
        <Input
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Player name"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button onClick={handleAdd} disabled={!newPlayerName.trim()}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {players.length === 0 ? (
        <EmptyState icon={UserRound} title="No players added yet" />
      ) : (
        <div className="space-y-1.5">
          {players.map((player) => (
            <div
              key={player.id}
              className="border-border flex items-center gap-2 rounded-md border px-2.5 py-1.5"
            >
              <PlayerAvatar name={player.name} size="sm" />
              <span className="flex-1 text-sm">{player.name}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${player.name}`}
                onClick={() => removePlayer(player.id)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
