import { test, expect } from '@playwright/test'
import { createOngoingMatch } from './helpers/createOngoingMatch'

// Drives desktop sidebar/wizard labels (shared with match-setup.spec.ts).
test.skip(({ isMobile }) => isMobile, 'desktop-only workflow')

async function startInnings(
  page: import('@playwright/test').Page,
  striker: string,
  nonStriker: string,
  bowler: string
) {
  await page.getByText('Select opening striker').click()
  await page.getByRole('option', { name: striker, exact: true }).click()
  await page.getByText('Select opening non-striker').click()
  await page.getByRole('option', { name: nonStriker, exact: true }).click()
  await page.getByText('Select opening bowler').click()
  await page.getByRole('option', { name: bowler, exact: true }).click()
  await page.getByRole('button', { name: 'Start Innings' }).click()
}

async function bowlSixDots(page: import('@playwright/test').Page) {
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: '1', exact: true }).click()
  }
}

test('plays a 1-over match to completion and shows the result, scorecard and statistics', async ({
  page,
}) => {
  await createOngoingMatch(page, { matchName: 'One Over Decider', oversPerInnings: 1 })

  await page.getByRole('link', { name: 'Live Scoring' }).click()
  await expect(page.getByRole('heading', { name: 'Start Innings' })).toBeVisible()
  await startInnings(page, 'Alpha Player 1', 'Alpha Player 2', 'Beta Player 1')

  await bowlSixDots(page)

  // The over (and the overs-limited innings) is now complete; end it.
  await expect(page.getByText(/natural conclusion/)).toBeVisible()
  await page.getByRole('button', { name: 'End Innings' }).click()
  await page.getByRole('button', { name: 'End Innings' }).click() // confirm in dialog

  // Second innings: Beta chases a target of 7.
  await expect(page.getByRole('heading', { name: /Start Innings 2/ })).toBeVisible()
  await expect(page.getByText(/Target: 7 runs/)).toBeVisible()
  await startInnings(page, 'Beta Player 1', 'Beta Player 2', 'Alpha Player 1')

  // Beta hits a six on the first ball, passing the target of 7 immediately.
  await page.getByRole('button', { name: '6', exact: true }).click()
  await page.getByRole('button', { name: '6', exact: true }).click()

  // The chase has already succeeded; end the innings to finalize the result.
  await expect(page.getByText(/natural conclusion/)).toBeVisible()
  await page.getByRole('button', { name: 'End Innings' }).click()
  await page.getByRole('button', { name: 'End Innings' }).click() // confirm in dialog

  // Match should now be decided.
  await expect(page.getByText(/won/)).toBeVisible()

  await page.getByRole('link', { name: 'View Scorecard' }).click()
  await expect(page.getByRole('heading', { name: 'One Over Decider' })).toBeVisible()
  await expect(page.getByText('Batting — Team Beta')).toBeVisible()
  await page.getByRole('tab', { name: 'ALP' }).click()
  await expect(page.getByText('Batting — Team Alpha')).toBeVisible()

  await page.getByRole('link', { name: 'Matches' }).click()
  await page.getByRole('link', { name: 'One Over Decider' }).click()
  await page.getByRole('main').getByRole('link', { name: 'Statistics' }).click()
  await expect(page.getByText('Run Progression')).toBeVisible()
  await expect(page.getByText('Top Scorer')).toBeVisible()
})
