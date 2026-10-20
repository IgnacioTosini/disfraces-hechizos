const arsFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
})

export function formatARS(value: number | string) {
    return arsFormatter.format(Number(value))
}
