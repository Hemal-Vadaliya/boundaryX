import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Thin wrapper over the base Button fixed to the primary (accent) variant, for the few calls-to-action that should always look the same. */
export function PrimaryButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button variant="default" className={cn('font-semibold', className)} {...props} />
  )
}
