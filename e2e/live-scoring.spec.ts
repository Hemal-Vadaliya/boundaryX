import { test, expect } from '@playwright/test'
import { createOngoingMatch } from './helpers/createOngoingMatch'

// Drives desktop sidebar/wizard labels (shared with match-setup.spec.ts) and a
// scoring screen designed to work the same on both viewports; exercised once
// on desktop since the walkthrough itself is desktop-nav-dependent.
test.skip(({ isMobile }) => isMobile, 'desktop-only workflow')

test('scores a full over including a wide, a boundary, a wicket, an undo and an edit', async ({
  page,
}) => {
  await createOngoingMatch(page)

  await page.getByRole('link', { name: 'Live Scoring' }).click()
  await expect(page.getByRole('heading', { name: 'Start Innings' })).toBeVisible()

  await page.getByText('Select opening striker').click()
  await page.getByRole('option', { name: 'Alpha Player 1', exact: true }).click()
  await page.getByText('Select opening non-striker').click()
  await page.getByRole('option', { name: 'Alpha Player 2', exact: true }).click()
  await page.getByText('Select opening bowler').click()
  await page.getByRole('option', { name: 'Beta Player 1', exact: true }).click()
  await page.getByRole('button', { name: 'Start Innings' }).click()

  await expect(page.getByText('Alpha Player 1')).toBeVisible()

  // Dot ball.
  await page.getByRole('button', { name: '0', exact: true }).click()
  await expect(page.getByText('0/0')).toBeVisible()

  // Boundary four.
  await page.getByRole('button', { name: '4', exact: true }).click()
  await expect(page.getByText('4/0')).toBeVisible()

  // Wide.
  await page.getByRole('button', { name: 'Wide' }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await expect(page.getByText('5/0')).toBeVisible()

  // Undo the wide.
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText('4/0')).toBeVisible()

  // Edit the last ball (the four) up to a six.
  await page.getByRole('button', { name: 'Edit Last Ball' }).click()
  await page.getByLabel('Batter runs').fill('6')
  await page.getByRole('button', { name: 'Save Correction' }).click()
  await expect(page.getByText('6/0')).toBeVisible()

  // A wicket: bowled, without an incoming batter chosen yet — the app must
  // prompt for one before scoring can continue.
  await page.getByRole('button', { name: 'Wicket' }).click()
  await page.getByRole('button', { name: 'Confirm Wicket' }).click()
  await expect(page.getByRole('heading', { name: 'Next Batter' })).toBeVisible()
  await page.getByRole('radio', { name: /Alpha Player 3$/ }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.getByText('6/1')).toBeVisible()
  await expect(page.getByText('Alpha Player 3')).toBeVisible()

  // Retire the non-striker hurt and bring on a fresh batter.
  await page.getByRole('button', { name: 'Retire Batter' }).click()
  await page.getByText('Select batter').click()
  await page.getByRole('option', { name: 'Alpha Player 4', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.getByText('Alpha Player 4')).toBeVisible()

  // Finish the over (3 more legal balls bowled so far: dot, six, wicket) and pick a new bowler.
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: '1', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'New Over' })).toBeVisible()
  await page.getByText('Beta Player 2').click()
  await page.getByRole('button', { name: 'Confirm Bowler' }).click()
  await expect(page.getByText('Beta Player 2').first()).toBeVisible()
})
