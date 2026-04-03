import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAsSeed(page: Page) {
  await page.goto('/login')
  await page.locator('#login-email').fill('demo@tracker.com')
  await page.locator('#login-password').fill('demo123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('/')
}

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('i18n: language switching', () => {
  test.beforeEach(async ({ page }) => {
    // Each test gets a fresh browser context (empty localStorage → language = 'en')
    await loginAsSeed(page)
  })

  // -------------------------------------------------------------------------
  // Test 1 — Default language is English
  // -------------------------------------------------------------------------
  test('1 — default language is English on all pages', async ({ page }) => {
    // Dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total Applications')).toBeVisible()

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

    // Dashboard in VI
    await expect(page.getByText('Tổng đơn ứng tuyển')).toBeVisible()
    await expect(page.getByText('Đơn ứng tuyển gần đây')).toBeVisible()

    // Nav links are now in VI — click the Jobs nav link
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
    await expect(page.getByText('Tổng đơn ứng tuyển')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Test 4 — Toggle back to English
  // -------------------------------------------------------------------------
  test('4 — toggle back to English reverts all strings', async ({ page }) => {
    await switchToVI(page)

    // Switch back to EN
    await openSettings(page, 'Cài đặt')
    await clickLang(page, 'EN')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total Applications')).toBeVisible()
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

    // Step 2 — date applied label
    await expect(page.getByText('Ngày ứng tuyển').first()).toBeVisible()
    // Status label
    await expect(page.getByText('Trạng thái').first()).toBeVisible()
    await page.getByRole('button', { name: 'Tiếp theo' }).click()

    // Step 3 — notes label
    await expect(page.getByText('Ghi chú').first()).toBeVisible()

    // Submit
    await page.getByRole('button', { name: 'Gửi' }).click()

    // Success screen
    await expect(page.getByText('Đã thêm đơn ứng tuyển!')).toBeVisible()
    await page.waitForURL('/jobs')
  })

  // -------------------------------------------------------------------------
  // Test 6 — Application Detail in Vietnamese
  // -------------------------------------------------------------------------
  test('6 — Application Detail labels in Vietnamese', async ({ page }) => {
    await switchToVI(page)

    // Navigate to first available job in list
    await page.goto('/jobs')
    await page.waitForSelector('text=Google', { timeout: 10000 })
    await page.getByText('Google').first().click()
    await page.waitForURL(/\/jobs\/\d+/)

    // Back link
    await expect(page.getByText('Quay lại danh sách')).toBeVisible()

    // Application Timeline heading
    await expect(page.getByText('Tiến trình ứng tuyển')).toBeVisible()

    // Info grid labels
    await expect(page.getByText('Địa điểm').first()).toBeVisible()
    await expect(page.getByText('Nguồn').first()).toBeVisible()

    // Update Status button (only visible for Applied / Interview status)
    const updateBtn = page.getByRole('button', { name: 'Cập nhật trạng thái' })
    if (await updateBtn.isVisible()) {
      await updateBtn.click()

      // Dialog labels
      await expect(page.getByText('Trạng thái mới')).toBeVisible()
      await expect(page.getByText('Ghi chú (tùy chọn)')).toBeVisible()

      // Cancel button
      await page.getByRole('button', { name: 'Hủy' }).click()
      await expect(updateBtn).toBeVisible()
    }

    // Delete button
    await expect(page.getByRole('button', { name: 'Xóa' })).toBeVisible()
  })
})
