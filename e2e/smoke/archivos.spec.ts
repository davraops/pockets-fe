import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, expect } from '@playwright/test'
import { hasE2ECredentials, loginViaUi } from '../fixtures/auth'
import { e2eLabel } from '../fixtures/testData'

const PRESIGNED_THRESHOLD_BYTES = 10 * 1024 * 1024

function hasPresignedUploadEnv(): boolean {
  return process.env.E2E_PRESIGNED_UPLOAD === 'true'
}

function createTempTextFile(label: string): { filePath: string; title: string } {
  const title = `Archivo ${label}`
  const filePath = join(tmpdir(), `pockets-e2e-${label.replace(/\s+/g, '-')}.txt`)
  writeFileSync(filePath, `Contenido E2E ${label}\n`, 'utf8')
  return { filePath, title }
}

function createTempLargeFile(label: string): { filePath: string; title: string } {
  const title = `Archivo grande ${label}`
  const filePath = join(tmpdir(), `pockets-e2e-large-${label.replace(/\s+/g, '-')}.bin`)
  writeFileSync(filePath, Buffer.alloc(PRESIGNED_THRESHOLD_BYTES + 64 * 1024, 0x41))
  return { filePath, title }
}

test.describe('Archivos smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated smoke tests')
    await loginViaUi(page)
  })

  test('archivos module renders', async ({ page }) => {
    await page.goto('/registros/archivos')

    await expect(page.getByRole('button', { name: 'Subir archivo' }).first()).toBeVisible({
      timeout: 20_000,
    })
  })

  test('upload small file via multipart and persist after reload', async ({ page }) => {
    const label = e2eLabel()
    const { filePath, title } = createTempTextFile(label)

    try {
      await page.goto('/registros/archivos')
      await page.getByRole('button', { name: 'Subir archivo' }).first().click()

      await expect(page.getByRole('heading', { name: 'Subir archivo' })).toBeVisible()
      await page.locator('#file').setInputFiles(filePath)
      await page.locator('#title').fill(title)
      await page.locator('form').getByRole('button', { name: 'Subir archivo' }).click()

      await expect(page.getByRole('button', { name: `Ver archivo ${title}` })).toBeVisible({
        timeout: 30_000,
      })

      await page.reload()
      await expect(page.getByRole('button', { name: `Ver archivo ${title}` })).toBeVisible({
        timeout: 15_000,
      })
    } finally {
      unlinkSync(filePath)
    }
  })

  test(
    'upload large file via presigned S3 flow',
    { tag: '@nightly' },
    async ({ page }) => {
      test.skip(
        !hasPresignedUploadEnv(),
        'Set E2E_PRESIGNED_UPLOAD=true to run presigned upload (requires S3 + CORS)'
      )

      const label = e2eLabel()
      const { filePath, title } = createTempLargeFile(label)
      const uploadSteps: string[] = []

      page.on('request', request => {
        const url = request.url()
        if (url.includes('/files/upload-url')) {
          uploadSteps.push('upload-url')
        }
        if (request.method() === 'PUT' && /amazonaws\.com|localhost/i.test(url)) {
          uploadSteps.push('s3-put')
        }
        if (/\/files\/[^/]+\/complete/.test(url)) {
          uploadSteps.push('complete')
        }
      })

      try {
        await page.goto('/registros/archivos')
        await page.getByRole('button', { name: 'Subir archivo' }).first().click()
        await page.locator('#file').setInputFiles(filePath)
        await page.locator('#title').fill(title)
        await page.locator('form').getByRole('button', { name: 'Subir archivo' }).click()

        await expect(page.getByRole('button', { name: `Ver archivo ${title}` })).toBeVisible({
          timeout: 120_000,
        })

        expect(uploadSteps).toContain('upload-url')
        expect(uploadSteps).toContain('s3-put')
        expect(uploadSteps).toContain('complete')
        expect(uploadSteps.indexOf('upload-url')).toBeLessThan(uploadSteps.indexOf('s3-put'))
        expect(uploadSteps.indexOf('s3-put')).toBeLessThan(uploadSteps.indexOf('complete'))
      } finally {
        unlinkSync(filePath)
      }
    }
  )
})
