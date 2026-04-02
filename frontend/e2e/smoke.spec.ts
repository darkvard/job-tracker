import { test, expect, type Page } from '@playwright/test'

// Unique per run — avoids conflicts with demo data or parallel runs
const email = `e2e-${Date.now()}@test.local`
const password = 'password123'
const name = 'E2E Tester'
const company = `PlaywrightCo-${Date.now()}`

async function register(page: Page) {
  await page.goto('/login')
  await page.getByRole('tab', { name: 'Create Account' }).click()
  await page.locator('#register-name').fill(name)
  await page.locator('#register-email').fill(email)
  await page.locator('#register-password').fill(password)
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL('/')
}

test.describe('Job Tracker smoke', () => {
  test('1 — register → Dashboard visible', async ({ page }) => {
    await register(page)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('2 — add job → appears in ApplicationsList', async ({ page }) => {
    await register(page)

    // Navigate to add form
    await page.getByRole('button', { name: /Add Application/i }).click()
    await page.waitForURL('/jobs/new')

    // Step 1: company + role
    await page.getByPlaceholder('e.g. Google').fill(company)
    await page.getByPlaceholder('e.g. Senior Product Designer').fill('SDE')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 2: leave defaults (LinkedIn / Applied)
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3: submit
    await page.getByRole('button', { name: 'Submit' }).click()

    // Success animation → redirect to /jobs
    await page.waitForURL('/jobs')

    await expect(page.getByText(company)).toBeVisible()
  })

  test('3 — open detail → update status Applied→Interview → badge updates', async ({ page }) => {
    await register(page)

    // Add job first
    await page.getByRole('button', { name: /Add Application/i }).click()
    await page.getByPlaceholder('e.g. Google').fill(company)
    await page.getByPlaceholder('e.g. Senior Product Designer').fill('SDE')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Submit' }).click()
    await page.waitForURL('/jobs')

    // Click the card to open detail
    await page.getByText(company).first().click()
    await page.waitForURL(/\/jobs\/\d+/)

    // Update status
    await page.getByRole('button', { name: 'Update Status' }).click()
    // Select "Interview" in the status dialog (it's the first transition for Applied)
    await page.locator('select').selectOption('Interview')
    await page.getByRole('button', { name: 'Confirm' }).click()

    // Status badge should now show Interview
    await expect(page.getByText('Interview').first()).toBeVisible()
  })

  test('4 — Analytics page → 4 chart sections render', async ({ page }) => {
    await register(page)

    await page.getByRole('link', { name: 'Analytics' }).click()
    await page.waitForURL('/analytics')

    // Analytics page heading
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()

    // At minimum: the 4 chart section titles visible after loading
    await expect(page.getByText('Weekly Applications')).toBeVisible()
    await expect(page.getByText('Application Funnel')).toBeVisible()
    await expect(page.getByText('Source Breakdown')).toBeVisible()
    await expect(page.getByText('Key Metrics')).toBeVisible()
  })

  test('5 — delete job → job gone from list', async ({ page }) => {
    await register(page)

    // Add job
    await page.getByRole('button', { name: /Add Application/i }).click()
    await page.getByPlaceholder('e.g. Google').fill(company)
    await page.getByPlaceholder('e.g. Senior Product Designer').fill('SDE')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Submit' }).click()
    await page.waitForURL('/jobs')

    // Open detail
    await page.getByText(company).first().click()
    await page.waitForURL(/\/jobs\/\d+/)

    // Delete — opens AlertDialog
    await page.getByRole('button', { name: 'Delete' }).click()
    // Confirm inside the AlertDialog
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()

    // Navigates back to /jobs; company should be gone
    await page.waitForURL('/jobs')
    await expect(page.getByText(company)).not.toBeVisible()
  })

  test('6 — logout → redirected to Login page', async ({ page }) => {
    await register(page)

    // Click the user avatar (title="Logout")
    await page.getByTitle('Logout').click()

    await page.waitForURL('/login')
    await expect(page.getByText('JobTracker')).toBeVisible()
  })
})
