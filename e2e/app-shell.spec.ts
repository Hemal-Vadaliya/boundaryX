import { test, expect } from '@playwright/test'

test('dashboard loads with empty state and navigation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('No matches loaded yet')).toBeVisible()
})

test('can navigate between desktop nav items', async ({ page, isMobile }) => {
  await page.goto('/')
  const settingsLinkName = isMobile ? 'More' : 'Settings'
  await page.getByRole('link', { name: settingsLinkName }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})

test('theme toggle switches between dark and light', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  const initialIsDark = await html.evaluate((el) => el.classList.contains('dark'))

  await page.getByRole('button', { name: /switch to (light|dark) theme/i }).click()

  const toggledIsDark = await html.evaluate((el) => el.classList.contains('dark'))
  expect(toggledIsDark).not.toBe(initialIsDark)
})
