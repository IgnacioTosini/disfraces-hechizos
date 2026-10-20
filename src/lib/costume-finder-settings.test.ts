import { describe, expect, it } from 'vitest'
import { readCostumeFinderOptions } from './validations/costume-finder'

function optionsForm(options: unknown) {
  const formData = new FormData()
  formData.set('options', JSON.stringify(options))
  return formData
}

describe('configuración del asistente de disfraces', () => {
  it('acepta opciones con nombre, identificador y palabras clave', () => {
    const result = readCostumeFinderOptions(optionsForm([{ id: 'ciencia-ficcion', label: 'Ciencia ficción', keywords: ['astronauta', 'alienígena'] }]))
    expect(result.success).toBe(true)
  })

  it('rechaza identificadores repetidos y palabras clave duplicadas', () => {
    const result = readCostumeFinderOptions(optionsForm([
      { id: 'fantasia', label: 'Fantasía', keywords: ['bruja', 'bruja'] },
      { id: 'fantasia', label: 'Otro estilo', keywords: [] },
    ]))
    expect(result.success).toBe(false)
  })

  it('rechaza una lista vacía para que el asistente conserve al menos un estilo', () => {
    expect(readCostumeFinderOptions(optionsForm([])).success).toBe(false)
  })
})
