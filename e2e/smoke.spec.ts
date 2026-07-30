import { expect, test } from '@playwright/test'

test('home page smoke', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Last Shelter' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Создать комнату' })).toBeVisible()
})

test('create page renders host form', async ({ page }) => {
  await page.goto('/create')
  await expect(page.getByRole('heading', { name: 'Новая комната' })).toBeVisible()
  await expect(page.getByLabel('Ваше имя')).toBeVisible()
})
