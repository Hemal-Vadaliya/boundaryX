import { PageContainer } from '@/components/layout/PageContainer'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'

export function SettingsPage() {
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)

  return (
    <PageContainer>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Application-level preferences. These are presentation-only and are never saved
          to a match document.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose between the dark and light themes.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
          >
            <Moon className="size-4" />
            Dark
          </Button>
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
          >
            <Sun className="size-4" />
            Light
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
