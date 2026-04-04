import { test, expect, type Page } from '@playwright/test'

// Unique per test call — avoids AlreadyExists when multiple tests each register
function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`
}

const password = 'password123'
const name = 'E2E Tester'

async function register(page: Page) {
  const email = uniqueEmail()
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

    const company = `PlaywrightCo-${Date.now()}`

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

    const company = `PlaywrightCo-${Date.now()}`

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

    // Enter inline edit mode and update status
    await page.getByRole('button', { name: 'Edit' }).click()
    // Status select is first select in the header (before source select in info grid)
    await page.locator('select').first().selectOption('Interview')
    await page.getByRole('button', { name: 'Save Changes' }).click()

    // Wait for edit mode to exit (Edit button reappears = save succeeded)
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    // Status badge shows Interview — use span to avoid matching hidden <option>
    await expect(page.locator('span').filter({ hasText: /^Interview$/ })).toBeVisible()
  })

  test('4 — Analytics page → 4 chart sections render', async ({ page }) => {
    await register(page)

    await page.getByRole('link', { name: 'Analytics' }).click()
    await page.waitForURL('/analytics')

    // Analytics page heading
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()

    // 4 chart section titles (always rendered regardless of data)
    await expect(page.getByText('Applications per Week')).toBeVisible()
    await expect(page.getByText('Interview Conversion')).toBeVisible()
    await expect(page.getByText('Source Performance')).toBeVisible()
    await expect(page.getByText('Key Metrics')).toBeVisible()
  })

  test('5 — delete job → job gone from list', async ({ page }) => {
    await register(page)

    const company = `PlaywrightCo-${Date.now()}`

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

    // Open the user dropdown (avatar button)
    await page.getByTitle('Profile').click()
    // Click Logout inside the dropdown
    await page.getByRole('button', { name: 'Logout' }).click()

    await page.waitForURL('/login')
    await expect(page.getByText('JobTracker')).toBeVisible()
  })

  test('7 — profile page → edit name → save → toast visible', async ({ page }) => {
    await register(page)

    // Open user dropdown → navigate to Profile
    await page.getByTitle('Profile').click()
    await page.getByRole('button', { name: 'Profile' }).click()
    await page.waitForURL('/profile')

    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()

    // Edit name
    const nameInput = page.getByLabel('Full Name')
    await nameInput.clear()
    await nameInput.fill('Updated Name')

    // Save
    await page.getByRole('button', { name: 'Save Changes' }).click()

    // Toast should appear
    await expect(page.getByText('Profile updated')).toBeVisible()
  })
})
