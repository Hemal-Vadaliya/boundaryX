import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

interface PlayerAvatarProps {
  name: string
  photoUrl?: string
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function PlayerAvatar({
  name,
  photoUrl,
  size = 'default',
  className,
}: PlayerAvatarProps) {
  return (
    <Avatar size={size} className={cn('bg-muted', className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
      <AvatarFallback>{initialsFromName(name)}</AvatarFallback>
    </Avatar>
  )
}
