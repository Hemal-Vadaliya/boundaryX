import { test, expect } from '@playwright/test'
import { createOngoingMatch } from './helpers/createOngoingMatch'

// This flow relies on desktop sidebar labels ("New Match") and is exercised
// once on desktop — the mobile shell is covered by app-shell.spec.ts.
test.skip(({ isMobile }) => isMobile, 'desktop-only workflow')

test('create teams and players through the wizard and set up a match', async ({
  page,
}) => {
  await createOngoingMatch(page)

  await expect(page.getByText('Team Alpha won the toss and chose to bat')).toBeVisible()

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByText('Alpha vs Beta Opener')).toBeVisible()
})
