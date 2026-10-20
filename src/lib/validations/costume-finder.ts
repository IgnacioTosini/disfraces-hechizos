import { z } from 'zod'

export const defaultCostumeFinderOptions = [
  { id: 'fantasia', label: 'Fantasía y aventura', keywords: ['fantasía', 'aventura', 'bruja', 'pirata', 'medieval', 'mago', 'princesa', 'héroe', 'superhéroe'] },
  { id: 'historicos', label: 'Históricos', keywords: ['histórico', 'egipcio', 'romano', 'reina', 'rey', 'pirata', 'vikingo'] },
  { id: 'profesiones', label: 'Profesiones', keywords: ['profesión', 'astronauta', 'doctor', 'médico', 'policía', 'bombero', 'chef'] },
  { id: 'terror', label: 'Terror', keywords: ['terror', 'bruja', 'vampiro', 'zombi', 'fantasma', 'monstruo'] },
  { id: 'animados', label: 'Animados', keywords: ['animado', 'dinosaurio', 'animal', 'hada', 'payaso', 'personaje'] },
] as const

export const costumeFinderOptionSchema = z.object({
  id: z.string().trim().min(2).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usá minúsculas, números y guiones.'),
  label: z.string().trim().min(2, 'Escribí un nombre para la opción.').max(50),
  keywords: z.array(z.string().trim().min(2).max(40)).max(12),
})

export const costumeFinderOptionsSchema = z.array(costumeFinderOptionSchema).min(1, 'Dejá al menos una opción de estilo.').max(12, 'Podés crear hasta 12 opciones.')
  .superRefine((options, context) => {
    const ids = new Set<string>()
    for (const [index, option] of options.entries()) {
      if (ids.has(option.id)) context.addIssue({ code: 'custom', path: [index, 'id'], message: 'No repitas el identificador.' })
      ids.add(option.id)
      if (new Set(option.keywords.map((word) => word.toLocaleLowerCase('es'))).size !== option.keywords.length) {
        context.addIssue({ code: 'custom', path: [index, 'keywords'], message: 'Quitá las palabras clave repetidas.' })
      }
    }
  })

export type CostumeFinderOption = z.infer<typeof costumeFinderOptionSchema>

export function readCostumeFinderOptions(formData: FormData) {
  try {
    return costumeFinderOptionsSchema.safeParse(JSON.parse(String(formData.get('options') ?? 'null')))
  } catch {
    return costumeFinderOptionsSchema.safeParse(null)
  }
}
