import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface OngoingMatchOptions {
  matchName?: string
  matchDate?: string
  oversPerInnings?: number
}

async function addPlayerInWizard(page: Page, name: string) {
  await page.getByPlaceholder('Player name').fill(name)
  await page.getByRole('button', { name: 'Add' }).click()
}

/**
 * Drives the full New Match wizard (details -> rules -> Team A name ->
 * Team B name -> Team A players -> Team A XI -> Team B players -> Team B
 * XI -> toss -> confirm) to reach an ongoing match named
 * "Alpha vs Beta Opener" with Team Alpha (11 players) and Team Beta
 * (11 players), Team Alpha batting first. Shared by match-setup.spec.ts
 * and live-scoring.spec.ts so the latter doesn't duplicate this walkthrough.
 */
export async function createOngoingMatch(page: Page, options: OngoingMatchOptions = {}) {
  const matchName = options.matchName ?? 'Alpha vs Beta Opener'
  const matchDate = options.matchDate ?? '2026-11-15'

  await page.goto('/')
  await page.getByRole('link', { name: 'New Match' }).click()
  await page.getByLabel('Match name').fill(matchName)
  await page.getByLabel('Match date').fill(matchDate)
  await page.getByRole('button', { name: 'Next' }).click() // -> Rules
  if (options.oversPerInnings !== undefined) {
    await page.getByLabel('Overs per innings').fill(String(options.oversPerInnings))
  }
  await page.getByRole('button', { name: 'Next' }).click() // -> Team A name

  await page.getByLabel('Team A name').fill('Team Alpha')
  await page.getByRole('button', { name: 'Next' }).click() // -> Team B name

  await page.getByLabel('Team B name').fill('Team Beta')
  await page.getByRole('button', { name: 'Next' }).click() // -> Team A players

  for (let i = 1; i <= 11; i++) {
    await addPlayerInWizard(page, `Alpha Player ${i}`)
  }
  await page.getByRole('button', { name: 'Next' }).click() // -> Team A XI

  for (let i = 1; i <= 11; i++) {
    await page.getByLabel(`Alpha Player ${i}`, { exact: true }).click()
  }
  await page.getByRole('button', { name: 'Next' }).click() // -> Team B players

  for (let i = 1; i <= 11; i++) {
    await addPlayerInWizard(page, `Beta Player ${i}`)
  }
  await page.getByRole('button', { name: 'Next' }).click() // -> Team B XI

  for (let i = 1; i <= 11; i++) {
    await page.getByLabel(`Beta Player ${i}`, { exact: true }).click()
  }
  await page.getByRole('button', { name: 'Next' }).click() // -> Toss

  await page.getByLabel('Team Alpha').click()
  await page.getByLabel('Bat first').click()
  await page.getByRole('button', { name: 'Next' }).click() // -> Confirm

  await page.getByRole('button', { name: 'Start Match' }).click()
  await expect(page.getByRole('heading', { name: matchName })).toBeVisible()
}
