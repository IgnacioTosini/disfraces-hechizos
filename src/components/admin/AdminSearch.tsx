type AdminSearchProps = {
    value: string
    onChange: (value: string) => void
    placeholder: string
    label: string
}

export default function AdminSearch({ value, onChange, placeholder, label }: AdminSearchProps) {
    return (
        <label className="categoryAdmin__search">
            <span aria-hidden="true">⌕</span>
            <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={label} />
            {value && <button type="button" onClick={() => onChange('')} aria-label="Limpiar búsqueda">×</button>}
        </label>
    )
}
