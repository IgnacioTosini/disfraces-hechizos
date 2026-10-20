import { prisma } from '@/lib/prisma'
import {
  costumeFinderOptionsSchema,
  defaultCostumeFinderOptions,
  type CostumeFinderOption,
} from '@/lib/validations/costume-finder'

export { defaultCostumeFinderOptions, type CostumeFinderOption } from '@/lib/validations/costume-finder'

export async function getCostumeFinderOptions(): Promise<CostumeFinderOption[]> {
  try {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'store' }, select: { costumeFinderOptions: true } })
    const parsed = costumeFinderOptionsSchema.safeParse(settings?.costumeFinderOptions)
    return parsed.success ? parsed.data : defaultCostumeFinderOptions.map((option) => ({ ...option, keywords: [...option.keywords] }))
  } catch (error) {
    console.error('[store] No se pudieron cargar las opciones del asistente', error)
    return defaultCostumeFinderOptions.map((option) => ({ ...option, keywords: [...option.keywords] }))
  }
}
