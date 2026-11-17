import { test, expect } from '@playwright/test'
import { createOngoingMatch } from './helpers/createOngoingMatch'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Drives desktop sidebar/wizard labels (shared with match-setup.spec.ts).
test.skip(({ isMobile }) => isMobile, 'desktop-only workflow')

test('exports a match, removes it from the session, and re-imports it from the downloaded file', async ({
  page,
}) => {
  await createOngoingMatch(page, { matchName: 'Import Export Match' })

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('main').getByRole('button', { name: 'Export' }).click()
  const download = await downloadPromise

  const downloadPath = path.join(os.tmpdir(), `boundaryx-e2e-${Date.now()}.json`)
  await download.saveAs(downloadPath)

  const exportedJson = JSON.parse(fs.readFileSync(downloadPath, 'utf-8'))
  expect(exportedJson.app).toBe('BoundaryX')
  expect(exportedJson.match.name).toBe('Import Export Match')

  // Remove the match from the session, confirming its JSON file on disk is unaffected.
  await page.getByRole('link', { name: 'Matches' }).click()
  await page.getByRole('button', { name: /Remove Import Export Match/ }).click()
  await page.getByRole('button', { name: 'Remove' }).click()
  await expect(page.getByRole('link', { name: 'Import Export Match' })).not.toBeVisible()
  expect(fs.existsSync(downloadPath)).toBe(true)

  // Re-import the exported file into the (now match-less) session.
  await page.getByRole('link', { name: 'Dashboard' }).click()
  await page.getByRole('link', { name: 'Import Match' }).click()
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(downloadPath)

  await expect(page.getByText('1 match found')).toBeVisible()
  await expect(page.getByText('Figures reconcile')).toBeVisible()
  await page.getByRole('button', { name: /Import 1 Match/ }).click()
  await expect(page.getByText('Imported 1 match into this session.')).toBeVisible()

  await page.getByRole('button', { name: 'Go to Matches' }).click()
  await expect(page.getByRole('link', { name: 'Import Export Match' })).toBeVisible()

  fs.unlinkSync(downloadPath)
})

test('offers skip/copy/cancel when importing a match already loaded in the session', async ({
  page,
}) => {
  await createOngoingMatch(page, { matchName: 'Duplicate Source Match' })

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('main').getByRole('button', { name: 'Export' }).click()
  const download = await downloadPromise
  const downloadPath = path.join(os.tmpdir(), `boundaryx-e2e-dup-${Date.now()}.json`)
  await download.saveAs(downloadPath)

  // Re-import the same file while the original match is still loaded.
  await page.getByRole('link', { name: 'Dashboard' }).click()
  await page.getByRole('link', { name: 'Import Match' }).click()
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(downloadPath)

  await expect(page.getByRole('heading', { name: 'Duplicate match' })).toBeVisible()
  await page.getByRole('button', { name: 'Import as a new copy' }).click()

  await expect(page.getByText('1 match found')).toBeVisible()
  await page.getByRole('button', { name: /Import 1 Match/ }).click()
  await expect(page.getByText('Imported 1 match into this session.')).toBeVisible()

  await page.getByRole('button', { name: 'Go to Matches' }).click()
  await expect(page.getByRole('link', { name: 'Duplicate Source Match' })).toHaveCount(2)

  fs.unlinkSync(downloadPath)
})
