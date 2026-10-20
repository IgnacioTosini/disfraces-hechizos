'use client'

import { useMemo, useState } from 'react'

export type BusyRentalRange = { from: string; through: string; quantity: number }

function shiftDate(value: string, days: number) {
    const date = new Date(`${value}T00:00:00.000Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

function monthStart(value: string) {
    return `${value.slice(0, 7)}-01`
}

const dayFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', timeZone: 'UTC' })
const monthFormat = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const accessibleDateFormat = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full', timeZone: 'UTC' })
const weekdays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

export default function RentalDatePicker({
    from, through, reservations, stockQuantity, startDate, endDate, loading, loadError, onStartDate, onEndDate,
}: {
    from: string
    through: string
    reservations: BusyRentalRange[]
    stockQuantity: number
    startDate: string
    endDate: string
    loading: boolean
    loadError: string
    onStartDate: (value: string) => void
    onEndDate: (value: string) => void
}) {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })
    const [visibleMonth, setVisibleMonth] = useState(monthStart(today))
    const [rangeMessage, setRangeMessage] = useState('')
    const monthDate = new Date(`${visibleMonth}T00:00:00.000Z`)
    const daysInMonth = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)).getUTCDate()
    const leadingDays = (monthDate.getUTCDay() + 6) % 7
    const dates = Array.from({ length: daysInMonth }, (_, index) => `${visibleMonth.slice(0, 7)}-${String(index + 1).padStart(2, '0')}`)
    const blockedDays = useMemo(() => {
        const occupancy = new Map<string, number>()
        for (const reservation of reservations) {
            const first = reservation.from < from ? from : reservation.from
            const last = reservation.through > through ? through : reservation.through
            if (last < first) continue
            for (let date = first; date <= last; date = shiftDate(date, 1)) {
                occupancy.set(date, (occupancy.get(date) ?? 0) + reservation.quantity)
            }
        }
        return new Set([...occupancy].filter(([, quantity]) => quantity >= stockQuantity).map(([date]) => date))
    }, [from, reservations, stockQuantity, through])
    const minimumMonth = monthStart(from)
    const maximumMonth = monthStart(through)
    const previousMonth = shiftDate(visibleMonth, -1).slice(0, 7) + '-01'
    const nextMonth = shiftDate(visibleMonth, 32).slice(0, 7) + '-01'

    function selectDate(date: string) {
        setRangeMessage('')
        if (!startDate || endDate || date < startDate) {
            onStartDate(date)
            onEndDate('')
            return
        }
        let firstBlocked = false
        for (const blocked of blockedDays) {
            if (blocked >= startDate && blocked <= date) {
                firstBlocked = true
                break
            }
        }
        if (firstBlocked) {
            setRangeMessage('El período incluye un día sin unidades disponibles para este talle. Elegí otro rango.')
            return
        }
        onEndDate(date)
    }

    return <div className='rentalCalendar'>
        <div className='rentalCalendar__selection' aria-live='polite'>
            <span><small>Desde</small><strong>{startDate ? dayFormat.format(new Date(`${startDate}T00:00:00.000Z`)) : 'Elegí un día'}</strong></span>
            <span aria-hidden='true'>→</span>
            <span><small>Hasta</small><strong>{endDate ? dayFormat.format(new Date(`${endDate}T00:00:00.000Z`)) : 'Elegí un día'}</strong></span>
        </div>
        <div className='rentalCalendar__heading'>
            <button type='button' onClick={() => setVisibleMonth(previousMonth)} disabled={previousMonth < minimumMonth} aria-label='Mes anterior'>‹</button>
            <h3>{monthFormat.format(monthDate)}</h3>
            <button type='button' onClick={() => setVisibleMonth(nextMonth)} disabled={nextMonth > maximumMonth} aria-label='Mes siguiente'>›</button>
        </div>
        {loading ? <p className='rentalCalendar__message'>Consultando fechas de este talle…</p> : loadError ? <p className='rentalCalendar__message rentalCalendar__message--error' role='alert'>{loadError}</p> : <>
            <div className='rentalCalendar__grid' role='grid' aria-label='Elegí las fechas del alquiler'>
                {weekdays.map((day) => <span className='rentalCalendar__weekday' role='columnheader' key={day}>{day}</span>)}
                {Array.from({ length: leadingDays }, (_, index) => <span className='rentalCalendar__blank' role='gridcell' key={`blank-${index}`} />)}
                {dates.map((date) => {
                    const isBlocked = blockedDays.has(date)
                    const isPast = date < from
                    const disabled = isPast || date > through || isBlocked
                    const isSelected = date === startDate || date === endDate
                    const isInRange = Boolean(startDate && endDate && date >= startDate && date <= endDate)
                    const label = accessibleDateFormat.format(new Date(`${date}T00:00:00.000Z`))
                    return <button type='button' role='gridcell' key={date} className={`rentalCalendar__day${isPast ? ' isPast' : ''}${isBlocked ? ' isUnavailable' : ''}${isSelected ? ' isSelected' : ''}${isInRange ? ' isInRange' : ''}`} disabled={disabled || loading} aria-label={`${label}${isPast ? ', fecha pasada' : isBlocked ? ', sin disponibilidad' : ''}`} aria-selected={isSelected} title={isPast ? 'Esta fecha ya pasó' : isBlocked ? 'Sin unidades disponibles para este talle' : label} onClick={() => selectDate(date)}>{dayFormat.format(new Date(`${date}T00:00:00.000Z`))}</button>
                })}
            </div>
            <div className='rentalCalendar__legend'><span><i /> Disponible</span><span><i className='isUnavailable' /> Sin unidades para este talle</span></div>
            {rangeMessage && <p className='rentalCalendar__message rentalCalendar__message--error' role='alert'>{rangeMessage}</p>}
            <p className='rentalCalendar__note'>Los días ocupados se calculan con las solicitudes confirmadas y los disfraces pendientes de revisión. El local confirma la disponibilidad final.</p>
        </>}
    </div>
}
