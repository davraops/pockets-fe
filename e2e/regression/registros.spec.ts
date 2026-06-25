import { test, expect } from '@playwright/test'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { e2ePassword } from '../fixtures/auth'
import { authenticatedBeforeEach } from '../fixtures/authenticated'
import { e2eLabel } from '../fixtures/testData'

function createTempTextFile(label: string): { filePath: string; title: string } {
  const title = `Archivo ${label}`
  const filePath = join(tmpdir(), `pockets-e2e-${label.replace(/\s+/g, '-')}.txt`)
  writeFileSync(filePath, `Contenido E2E ${label}\n`, 'utf8')
  return { filePath, title }
}

test.describe('Registros regression', { tag: '@regression' }, () => {
  authenticatedBeforeEach()
  test.setTimeout(90_000)

  test('create empleado and open detail', async ({ page }) => {
    const label = e2eLabel()
    const name = `Empleado ${label}`
    const identification = `${Date.now()}`.slice(-10)

    await page.goto('/registros/empleados')
    await page.getByRole('button', { name: 'Agregar empleado' }).click()
    await expect(page.getByRole('heading', { name: 'Agregar empleado' })).toBeVisible()

    await page.locator('#name').fill(name)
    await page.locator('#identification').fill(identification)
    await page.locator('form.empleados-form').getByRole('button', { name: 'Agregar empleado' }).click()

    const card = page.getByRole('button', { name: new RegExp(`Ver empleado ${name}`) })
    await expect(card).toBeVisible({ timeout: 15_000 })
    await card.click()
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible({ timeout: 10_000 })
  })

  test('cuaderno adds second text block with autosave', async ({ page }) => {
    const label = e2eLabel()
    const noteTitle = `Cuaderno ${label}`
    const block1 = `Bloque 1 ${label}`
    const block2 = `Bloque 2 ${label}`

    await page.goto('/registros/cuadernos')
    await page.getByRole('button', { name: 'Nuevo cuaderno' }).first().click()
    await page.locator('#titulo').fill(noteTitle)
    await page.getByRole('button', { name: 'Crear y abrir' }).click()
    await expect(page.getByLabel('Título del cuaderno')).toHaveValue(noteTitle, {
      timeout: 15_000,
    })

    await page.getByRole('textbox', { name: 'Texto' }).first().fill(block1)
    await page.locator('.cuaderno-block-row').first().hover()
    await page.getByRole('button', { name: 'Añadir bloque debajo' }).first().click({ force: true })

    const secondBlock = page.getByRole('textbox', { name: 'Texto' }).nth(1)
    await expect(secondBlock).toBeVisible({ timeout: 10_000 })
    await secondBlock.fill(block2)

    await expect(page.getByText('Guardado')).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Texto' }).first()).toContainText(block1, {
      timeout: 15_000,
    })
    await expect(page.getByRole('textbox', { name: 'Texto' }).nth(1)).toContainText(block2, {
      timeout: 15_000,
    })
  })

  test('create vehículo and persist after reload', async ({ page }) => {
    const name = `Vehículo ${e2eLabel()}`

    await page.goto('/registros/vehiculos')
    await page.getByRole('button', { name: 'Agregar vehículo' }).click()
    await page.locator('#name').fill(name)
    await page.locator('form.vehiculos-form').getByRole('button', { name: 'Agregar vehículo' }).click()

    await expect(page.getByRole('button', { name: new RegExp(`Ver vehículo ${name}`) })).toBeVisible({
      timeout: 15_000,
    })

    await page.reload()
    await expect(page.getByRole('button', { name: new RegExp(`Ver vehículo ${name}`) })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('create patrimonio item and persist after reload', async ({ page }) => {
    const name = `Ítem ${e2eLabel()}`

    await page.goto('/registros/patrimonio')
    await page.getByRole('button', { name: 'Agregar ítem' }).click()
    await page.locator('#name').fill(name)
    await page.getByRole('button', { name: 'Agregar ítem', exact: true }).click()

    await expect(page.getByRole('button', { name: new RegExp(`Ver ítem ${name}`) })).toBeVisible({
      timeout: 15_000,
    })

    await page.reload()
    await expect(page.getByRole('button', { name: new RegExp(`Ver ítem ${name}`) })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('password generator produces output and can copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/registros/generador-contrasenas')

    await expect(page.getByRole('heading', { name: 'Generador de contraseñas', level: 2 })).toBeVisible()
    const output = page.getByLabel('Contraseña generada')
    const initial = (await output.textContent())?.trim() ?? ''
    expect(initial.length).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Generar contraseña' }).click()
    await expect(output).not.toHaveText(initial, { timeout: 5_000 })

    await page.getByRole('button', { name: 'Copiar contraseña', exact: true }).click()
    await expect(page.getByText('Contraseña copiada al portapapeles')).toBeVisible({ timeout: 5_000 })
  })

  test('decrypt secreto with user password', async ({ page }) => {
    const label = e2eLabel()
    const secretTitle = `Secreto ${label}`
    const secretValue = `valor-${label}`

    await page.goto('/registros/secretos')
    await page.getByRole('button', { name: 'Agregar secreto' }).click()
    await page.locator('#titulo').fill(secretTitle)
    await page.locator('#valor').fill(secretValue)
    await page.getByRole('button', { name: 'Guardar' }).click()

    await expect(page.getByRole('button', { name: `Ver secreto ${secretTitle}` })).toBeVisible({
      timeout: 15_000,
    })

    await page.getByRole('button', { name: `Desencriptar ${secretTitle}` }).click()
    const decryptDialog = page.locator('.modal-panel.secretos-modal').filter({
      has: page.getByRole('heading', { name: 'Desencriptar secreto' }),
    })
    await expect(decryptDialog).toBeVisible()

    await decryptDialog.locator('#decrypt-password').fill(e2ePassword())
    await decryptDialog.getByRole('button', { name: 'Desencriptar', exact: true }).click()

    await expect(page.getByText('Secreto desencriptado exitosamente')).toBeVisible({ timeout: 15_000 })
    await expect(decryptDialog.locator('#decrypted-value')).toHaveValue(secretValue)
  })

  test('open text archivo preview viewer from detail modal', async ({ page }) => {
    const label = e2eLabel()
    const { filePath, title } = createTempTextFile(label)

    try {
      await page.goto('/registros/archivos')
      await page.getByRole('button', { name: 'Subir archivo' }).first().click()
      await page.locator('#file').setInputFiles(filePath)
      await page.locator('#title').fill(title)
      await page.locator('form').getByRole('button', { name: 'Subir archivo' }).click()

      await page.getByRole('button', { name: `Ver archivo ${title}` }).click()
      const detailDialog = page.getByRole('dialog').filter({ has: page.getByText('Documentos · Detalle') })
      await expect(detailDialog.getByRole('heading', { name: title, level: 2 })).toBeVisible({
        timeout: 15_000,
      })

      await detailDialog.getByRole('button', { name: 'Ver' }).click()
      await expect(page.getByText('Documentos · Vista previa')).toBeVisible({ timeout: 15_000 })
      await expect(page.locator(`iframe[title="Vista previa de ${title}"]`)).toBeVisible({
        timeout: 30_000,
      })
    } finally {
      unlinkSync(filePath)
    }
  })
})
