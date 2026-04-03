import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Auth helpers (same pattern as smoke.spec.ts — no seed data required)
// ---------------------------------------------------------------------------

function uniqueEmail() {
  return `i18n-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`
}

const password = 'password123'
const name = 'i18n Tester'

async function register(page: Page) {
  await page.goto('/login')
  await page.getByRole('tab', { name: 'Create Account' }).click()
  await page.locator('#register-name').fill(name)
  await page.locator('#register-email').fill(uniqueEmail())
  await page.locator('#register-password').fill(password)
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL('/')
}

// ---------------------------------------------------------------------------
// i18n helpers
// ---------------------------------------------------------------------------

/** Open the Settings gear-icon dropdown.
 *  The button aria-label is t('settings.title'), so it changes with language.
 *  Pass the current language's label: 'Settings' (EN) or 'Cài đặt' (VI). */
async function openSettings(page: Page, label = 'Settings') {
  await page.getByRole('button', { name: label, exact: true }).click()
}

/** Click the EN or VI button inside the already-open Settings dropdown. */
async function clickLang(page: Page, code: 'EN' | 'VI') {
  await page.getByRole('button', { name: code, exact: true }).click()
}

/** Switch UI to Vietnamese and wait for the Dashboard heading to confirm.
 *  Also closes the dropdown afterwards so subsequent openSettings() calls
 *  will open it (not toggle-close it). */
async function switchToVI(page: Page) {
  await openSettings(page, 'Settings')
  await clickLang(page, 'VI')
  await expect(page.getByRole('heading', { name: 'Bảng điều khiển' })).toBeVisible()
  // Close dropdown by clicking the heading (triggers outside-click handler)
  await page.getByRole('heading', { name: 'Bảng điều khiển' }).click()
}

/** Create a minimal job (step through Add Application form in English). */
async function addJob(page: Page, company: string) {
  await page.getByRole('button', { name: /Add Application/i }).click()
  await page.waitForURL('/jobs/new')
  await page.getByPlaceholder('e.g. Google').fill(company)
  await page.getByPlaceholder('e.g. Senior Product Designer').fill('Engineer')
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Submit' }).click()
  await page.waitForURL('/jobs')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('i18n: language switching', () => {
  test.beforeEach(async ({ page }) => {
    // Fresh user per test — no seed data dependency, works in CI
    await register(page)
  })

  // -------------------------------------------------------------------------
  // Test 1 — Default language is English
  // -------------------------------------------------------------------------
  test('1 — default language is English on all pages', async ({ page }) => {
    // Dashboard (subtitle is always visible regardless of data)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Track your job application progress')).toBeVisible()

    // Jobs page
    await page.getByRole('link', { name: 'Applications' }).click()
    await page.waitForURL('/jobs')
    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()
    await expect(page.getByPlaceholder('Search company or role...')).toBeVisible()

    // Analytics page
    await page.getByRole('link', { name: 'Analytics' }).click()
    await page.waitForURL('/analytics')
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
    await expect(page.getByText('Applications per Week')).toBeVisible()
    await expect(page.getByText('Interview Conversion')).toBeVisible()
    await expect(page.getByText('Source Performance')).toBeVisible()
    await expect(page.getByText('Key Metrics')).toBeVisible()

    // Settings dropdown labels
    await page.goto('/')
    await openSettings(page, 'Settings')
    await expect(page.getByText('Theme')).toBeVisible()
    await expect(page.getByText('Language')).toBeVisible()
    await expect(page.getByText('Light')).toBeVisible()
    await expect(page.getByText('Dark')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Test 2 — Toggle to Vietnamese: all pages switch
  // -------------------------------------------------------------------------
  test('2 — toggle to Vietnamese switches all pages', async ({ page }) => {
    await switchToVI(page)

    // Dashboard in VI (subtitle always visible)
    await expect(page.getByText('Theo dõi tiến trình ứng tuyển việc làm')).toBeVisible()

    // Jobs page in VI
    await page.getByRole('link', { name: 'Ứng tuyển' }).click()
    await page.waitForURL('/jobs')
    await expect(page.getByRole('heading', { name: 'Đơn ứng tuyển' })).toBeVisible()
    await expect(page.getByPlaceholder('Tìm công ty hoặc vị trí...')).toBeVisible()

    // Analytics page in VI
    await page.getByRole('link', { name: 'Phân tích' }).click()
    await page.waitForURL('/analytics')
    await expect(page.getByRole('heading', { name: 'Phân tích' })).toBeVisible()
    await expect(page.getByText('Đơn ứng tuyển theo tuần')).toBeVisible()
    await expect(page.getByText('Tỷ lệ chuyển đổi phỏng vấn')).toBeVisible()
    await expect(page.getByText('Hiệu quả nguồn ứng tuyển')).toBeVisible()
    await expect(page.getByText('Chỉ số chính')).toBeVisible()

    // Settings dropdown labels also translated
    await page.goto('/')
    await openSettings(page, 'Cài đặt')
    await expect(page.getByText('Giao diện')).toBeVisible()
    await expect(page.getByText('Ngôn ngữ')).toBeVisible()
    await expect(page.getByText('Sáng')).toBeVisible()
    await expect(page.getByText('Tối')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Test 3 — Persistence: reload preserves Vietnamese
  // -------------------------------------------------------------------------
  test('3 — Vietnamese persists after page reload', async ({ page }) => {
    await switchToVI(page)

    await page.reload()
    await page.waitForURL('/')

    await expect(page.getByRole('heading', { name: 'Bảng điều khiển' })).toBeVisible()
    await expect(page.getByText('Theo dõi tiến trình ứng tuyển việc làm')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Test 4 — Toggle back to English
  // -------------------------------------------------------------------------
  test('4 — toggle back to English reverts all strings', async ({ page }) => {
    await switchToVI(page)

    await openSettings(page, 'Cài đặt')
    await clickLang(page, 'EN')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Track your job application progress')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Test 5 — Add Application form in Vietnamese
  // -------------------------------------------------------------------------
  test('5 — Add Application form labels in Vietnamese', async ({ page }) => {
    await switchToVI(page)

    await page.goto('/jobs/new')

    // Page heading and step labels
    await expect(page.getByRole('heading', { name: 'Thêm đơn ứng tuyển' })).toBeVisible()
    await expect(page.getByText('Thông tin cơ bản')).toBeVisible()
    await expect(page.getByText('Chi tiết')).toBeVisible()
    // Back button
    await expect(page.getByText('Quay lại').first()).toBeVisible()

    // Fill step 1 and click Next
    await page.getByPlaceholder('vd: Google').fill('CôngTyTest')
    await page.getByPlaceholder('vd: Senior Product Designer').fill('Kỹ sư phần mềm')
    await page.getByRole('button', { name: 'Tiếp theo' }).click()

    // Step 2 — date applied + status labels
    await expect(page.getByText('Ngày ứng tuyển').first()).toBeVisible()
    await expect(page.getByText('Trạng thái').first()).toBeVisible()
    await page.getByRole('button', { name: 'Tiếp theo' }).click()

    // Step 3 — notes label
    await expect(page.getByText('Ghi chú').first()).toBeVisible()

    // Submit and confirm success screen
    await page.getByRole('button', { name: 'Gửi' }).click()
    await expect(page.getByText('Đã thêm đơn ứng tuyển!')).toBeVisible()
    await page.waitForURL('/jobs')
  })

  // -------------------------------------------------------------------------
  // Test 6 — Application Detail in Vietnamese
  // -------------------------------------------------------------------------
  test('6 — Application Detail labels in Vietnamese', async ({ page }) => {
    // Create a job first (in English — no seed data needed)
    const company = `i18nCo-${Date.now()}`
    await addJob(page, company)

    // Go to Dashboard and switch to VI
    await page.goto('/')
    await switchToVI(page)

    // Navigate to the created job
    await page.goto('/jobs')
    await page.getByText(company).first().click()
    await page.waitForURL(/\/jobs\/\d+/)

    // Back link
    await expect(page.getByText('Quay lại danh sách')).toBeVisible()

    // Application Timeline heading
    await expect(page.getByText('Tiến trình ứng tuyển')).toBeVisible()

    // Info grid labels
    await expect(page.getByText('Địa điểm').first()).toBeVisible()
    await expect(page.getByText('Nguồn').first()).toBeVisible()

    // Edit button should always be visible (replaces old "Update Status")
    const editBtn = page.getByRole('button', { name: 'Chỉnh sửa' })
    await expect(editBtn).toBeVisible()
    await editBtn.click()

    // Edit mode: Save Changes button visible in Vietnamese
    await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible()

    // Cancel button exits edit mode
    await page.getByRole('button', { name: 'Hủy' }).click()

    // Back to view mode: Edit button visible again
    await expect(editBtn).toBeVisible()

    // Delete button
    await expect(page.getByRole('button', { name: 'Xóa' })).toBeVisible()
  })
})
