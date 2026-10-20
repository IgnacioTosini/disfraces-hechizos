'use client'

import { useCallback, useMemo, useState } from 'react'

export function usePaginatedItems<T>(items: T[], pageSize: number, resetKey: string | number = '') {
    const [pagination, setPagination] = useState({ key: resetKey, page: 1 })
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
    const currentPage = pagination.key === resetKey ? Math.min(pagination.page, pageCount) : 1
    const pageItems = useMemo(
        () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [currentPage, items, pageSize],
    )
    const setPage = useCallback((page: number) => setPagination({ key: resetKey, page }), [resetKey])

    return { pageItems, page: currentPage, pageCount, setPage }
}
