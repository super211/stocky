import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

// Signs in with a real Firebase account, so the credentials come from the environment:
//   E2E_EMAIL=you@example.com E2E_PASSWORD=... npm run test:e2e
// The account must already exist and have finished onboarding (otherwise login lands on /setup).
const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

// Screenshots go to the repo-level logs/ folder (stockyapp/tests -> ../../logs).
const logsDir = (file: string) => fileURLToPath(new URL(`../../logs/${file}`, import.meta.url))

test.describe('login to the diary', () => {
  test('a signed-in user lands on the diary', async ({ page }) => {
    test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD to run this test')

    const problems: string[] = []
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
    page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`))

    await page.goto('/login')
    await page.getByLabel('Email').fill(email!)
    await page.getByLabel('Password', { exact: true }).fill(password!)
    await page.getByRole('button', { name: 'Log in', exact: true }).click()

    // Home is the diary. An account that has not onboarded would be sent to /setup instead.
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Today', { exact: true })).toBeVisible()

    const summary = page.getByRole('region', { name: 'Calorie summary' })
    await expect(summary).toBeVisible()
    await expect(summary.getByText('Goal', { exact: true })).toBeVisible()
    await expect(summary.getByText('Food', { exact: true })).toBeVisible()
    await expect(summary.getByRole('progressbar')).toBeVisible()

    for (const meal of ['Breakfast', 'Lunch', 'Dinner', 'Snacks']) {
      await expect(page.getByRole('heading', { name: meal })).toBeVisible()
    }

    const tabs = page.getByRole('navigation', { name: 'Main' })
    for (const tab of ['Diary', 'Foods', 'History', 'Settings']) {
      await expect(tabs.getByRole('link', { name: tab })).toBeVisible()
    }
    await expect(tabs.getByRole('link', { name: 'Diary' })).toHaveAttribute('aria-current', 'page')

    await page.screenshot({ path: logsDir('diary-after-login.png') })
    expect(problems).toEqual([])
  })

  test('shows an error and stays on login for a wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody-e2e@example.com')
    await page.getByLabel('Password', { exact: true }).fill('not-a-real-password')
    await page.getByRole('button', { name: 'Log in', exact: true }).click()

    await expect(page.getByRole('alert')).toHaveText('Incorrect email or password.')
    await expect(page).toHaveURL(/\/login$/)
  })
})
