import './_pagination.scss'

type PaginationProps = {
    page: number
    pageCount: number
    onPageChange: (page: number) => void
    itemCount: number
    pageSize: number
    itemLabel: string
}

export default function Pagination({ page, pageCount, onPageChange, itemCount, pageSize, itemLabel }: PaginationProps) {
    if (pageCount <= 1) return null

    const firstItem = (page - 1) * pageSize + 1
    const lastItem = Math.min(page * pageSize, itemCount)
    const pages: (number | '…')[] = pageCount <= 7
        ? Array.from({ length: pageCount }, (_, index) => index + 1)
        : [1, ...(page > 3 ? ['…' as const] : []), ...[page - 1, page, page + 1].filter((number) => number > 1 && number < pageCount), ...(page < pageCount - 2 ? ['…' as const] : []), pageCount]

    return (
        <nav className='pagination' aria-label={`Paginación de ${itemLabel}`}>
            <p>Mostrando <strong>{firstItem}–{lastItem}</strong> de <strong>{itemCount}</strong> {itemLabel}</p>
            <div className='pagination__controls'>
                <button type='button' onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label='Página anterior'>← <span>Anterior</span></button>
                <div className='pagination__pages'>
                    {pages.map((pageNumber, index) => pageNumber === '…'
                        ? <span className='pagination__ellipsis' key={`ellipsis-${index}`} aria-hidden='true'>…</span>
                        : <button type='button' key={pageNumber} onClick={() => onPageChange(pageNumber)} className={pageNumber === page ? 'isCurrent' : ''} aria-label={`Página ${pageNumber}`} aria-current={pageNumber === page ? 'page' : undefined}>{pageNumber}</button>)}
                </div>
                <button type='button' onClick={() => onPageChange(page + 1)} disabled={page === pageCount} aria-label='Página siguiente'><span>Siguiente</span> →</button>
            </div>
        </nav>
    )
}
