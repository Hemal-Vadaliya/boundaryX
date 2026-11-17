import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

interface TeamAvatarProps {
  name: string
  logoUrl?: string
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function TeamAvatar({
  name,
  logoUrl,
  size = 'default',
  className,
}: TeamAvatarProps) {
  return (
    <Avatar size={size} className={cn('bg-secondary', className)}>
      {logoUrl && <AvatarImage src={logoUrl} alt={name} />}
      <AvatarFallback className="font-semibold">{initialsFromName(name)}</AvatarFallback>
    </Avatar>
  )
}
