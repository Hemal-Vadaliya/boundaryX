import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { AppProviders } from '@/app/providers'
import { useThemeSync } from '@/hooks/useThemeSync'

export function App() {
  useThemeSync()

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
