"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminToast from "@/components/admin/AdminToast";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/pagination/Pagination";
import { usePaginatedItems } from "@/components/ui/pagination/usePaginatedItems";
import { formatARS } from "@/lib/formatters";
import { readRentalRequestFormData } from "@/lib/validations/rental-request";
import { buildRequestStatusWhatsAppUrl } from "@/lib/whatsapp-request-status";
import { createRentalRequest, markAvailabilityAlertContacted, markRentalItemsAvailableAgain, updateRentalRequestStatus, type RentalRequestActionResult } from "@/app/admin/solicitudes/actions";

type RequestStatus = "PENDING" | "CONTACTED" | "CONFIRMED" | "PICKED_UP" | "RETURNED" | "CANCELLED";
type RequestItem = { id: string; costumeName: string; size: string; quantity: number; unitPrice: string | null; pickupDate: Date; returnDate: Date; isAvailableAgain: boolean };
export type AdminRentalRequest = { id: string; pickupDate: Date; returnDate: Date; status: RequestStatus; notes: string | null; createdAt: Date; customer: { id: string; name: string; phone: string; email: string | null }; items: RequestItem[] };
export type RentalVariantOption = { id: string; size: string; rentalPrice: string | null; costume: { id: string; name: string; rentalPrice: string | null } };
type AvailabilityAlertRow = { id: string; fromDate: Date; throughDate: Date; contactedAt: Date | null; customerName: string; customerPhone: string; customerEmail: string | null; size: string; costumeName: string };

const statuses: { value: RequestStatus; label: string }[] = [
  { value: "PENDING", label: "Pendiente" }, { value: "CONTACTED", label: "Contactado" }, { value: "CONFIRMED", label: "Confirmado" },
  { value: "PICKED_UP", label: "Retirado" }, { value: "RETURNED", label: "Devuelto" }, { value: "CANCELLED", label: "Cancelado" },
];
const dateFormat = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "UTC" });

export default function RentalRequestManager({ requests, variants, alerts, loadError }: { requests: AdminRentalRequest[]; variants: RentalVariantOption[]; alerts: AvailabilityAlertRow[]; loadError: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return term ? requests.filter((request) => `${request.customer.name} ${request.customer.phone} ${request.items.map((item) => item.costumeName).join(" ")}`.toLocaleLowerCase("es").includes(term)) : requests;
  }, [requests, query]);
  const requestPagination = usePaginatedItems(filtered, 8, query);
  const pendingCount = requests.filter(({ status }) => status === "PENDING").length;
  const confirmedCount = requests.filter(({ status }) => status === "CONFIRMED" || status === "PICKED_UP").length;
  const openAlerts = alerts.filter(({ contactedAt }) => !contactedAt);

  useEffect(() => {
    const refreshRequests = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(refreshRequests, 10_000);
    return () => window.clearInterval(interval);
  }, [router]);

  function showResult(result: RentalRequestActionResult) {
    setNotice(result.message ?? (result.success ? "Listo." : "Ocurrió un error."));
    setNoticeError(!result.success);
    if (result.success) { setCreating(false); router.refresh(); }
  }

  function changeStatus(id: string, status: string) {
    startTransition(async () => showResult(await updateRentalRequestStatus(id, status)));
  }

  function confirmInspection(id: string) {
    startTransition(async () => showResult(await markRentalItemsAvailableAgain(id)));
  }

  function markAlertContacted(id: string) {
    startTransition(async () => showResult(await markAvailabilityAlertContacted(id)));
  }

  function alertWhatsAppUrl(alert: AvailabilityAlertRow) {
    const text = `Hola ${alert.customerName}, te contactamos por tu aviso de disponibilidad para ${alert.costumeName} talle ${alert.size}, del ${dateFormat.format(alert.fromDate)} al ${dateFormat.format(alert.throughDate)}. Tenemos novedades para vos.`;
    return `https://wa.me/${alert.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  }

  return <section className="rentalAdmin">
    <header className="rentalAdmin__header"><div><p className="adminDashboard__eyebrow">ALQUILERES</p><h1>Solicitudes</h1><p>Registrá consultas y seguí cada alquiler hasta la devolución.</p></div><button className="categoryAdmin__primary" type="button" disabled={!variants.length} onClick={() => { setNotice(""); setCreating(true); }}>＋ <span>Nueva solicitud</span></button></header>
    <AdminToast message={notice} isError={noticeError} onDismiss={() => setNotice("")} />
    {loadError && <div className="categoryAdmin__loadError">No se pudieron cargar las solicitudes. Revisá la conexión con la base.</div>}
    {!variants.length && !loadError && <div className="costumeAdmin__hint">No hay talles activos para incluir. Activá un talle desde <a href="/admin/disfraces">Disfraces</a> para registrar solicitudes.</div>}

    <div className="rentalAdmin__summary"><article><span>Total</span><strong>{requests.length}</strong></article><article><span>Pendientes</span><strong>{pendingCount}</strong></article><article><span>Confirmadas o retiradas</span><strong>{confirmedCount}</strong></article></div>
    <section className="availabilityAlerts" aria-labelledby="availabilityAlertsTitle">
      <header><div><p className="adminDashboard__eyebrow">SEGUIMIENTO</p><h2 id="availabilityAlertsTitle">Avisos de disponibilidad</h2><p>{openAlerts.length ? `${openAlerts.length} clientes esperan novedades` : "No hay avisos pendientes de contacto."}</p></div><span>{openAlerts.length} pendientes</span></header>
      {alerts.length > 0 && <div className="availabilityAlerts__list">{alerts.map((alert) => <article key={alert.id} className={alert.contactedAt ? "isContacted" : ""}>
        <div><strong>{alert.customerName}</strong><a href={`tel:${alert.customerPhone}`}>{alert.customerPhone}</a>{alert.customerEmail && <a href={`mailto:${alert.customerEmail}`}>{alert.customerEmail}</a>}</div>
        <p><b>{alert.costumeName} · {alert.size}</b><span>{dateFormat.format(alert.fromDate)} al {dateFormat.format(alert.throughDate)}</span></p>
        {alert.contactedAt ? <span className="availabilityAlerts__done">Contactado</span> : <div><a className="rentalAdmin__whatsapp" href={alertWhatsAppUrl(alert)} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a><button type="button" disabled={pending} onClick={() => markAlertContacted(alert.id)}>Marcar contactado</button></div>}
      </article>)}</div>}
    </section>
    <div className="rentalAdmin__panel">
      <div className="rentalAdmin__toolbar"><div><h2>Seguimiento</h2><p>{requests.length === 1 ? "1 solicitud" : `${requests.length} solicitudes`}</p></div><AdminSearch value={query} onChange={setQuery} placeholder="Buscar cliente o disfraz…" label="Buscar solicitudes" /></div>
      {filtered.length ? <><div className="rentalAdmin__list">{requestPagination.pageItems.map((request) => <article className="rentalAdmin__row" id={`solicitud-${request.id}`} key={request.id}>
        <div className="rentalAdmin__main"><div className="rentalAdmin__person"><h3>{request.customer.name}</h3><a href={`tel:${request.customer.phone}`}>{request.customer.phone}</a>{request.customer.email && <a href={`mailto:${request.customer.email}`}>{request.customer.email}</a>}</div><div className="rentalAdmin__items">{request.items.map((item) => <span key={item.id}>{item.costumeName} · {item.size}{item.quantity > 1 ? ` ×${item.quantity}` : ""}<small>{dateFormat.format(item.pickupDate)} al {dateFormat.format(item.returnDate)}</small></span>)}</div></div>
        <div className="rentalAdmin__dates"><span>Retiro</span><strong>{dateFormat.format(request.pickupDate)}</strong><span>Devolución</span><strong>{dateFormat.format(request.returnDate)}</strong></div>
        <div className="rentalAdmin__statusActions"><label className="rentalAdmin__status"><span>Estado</span><select disabled={pending} value={request.status} onChange={(event) => changeStatus(request.id, event.target.value)}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label><a className="rentalAdmin__whatsapp" href={buildRequestStatusWhatsAppUrl({ phone: request.customer.phone, customerName: request.customer.name, requestId: request.id, status: request.status, items: request.items })} target="_blank" rel="noopener noreferrer" aria-label={`Informar por WhatsApp a ${request.customer.name} sobre el estado ${statuses.find((status) => status.value === request.status)?.label}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.9 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z" /><path d="M9 9c.4 2 2 3.6 4 4" /></svg><span>Avisar por WhatsApp</span></a></div>
        {request.status === "RETURNED" && request.items.some((item) => !item.isAvailableAgain) && <div className="rentalAdmin__inspection"><p><strong>Revisión pendiente.</strong> Confirmá cuando el local haya revisado estos disfraces y puedan volver a ofrecerse.</p><button type="button" disabled={pending} onClick={() => confirmInspection(request.id)}>Confirmar disponibilidad</button></div>}
        {request.notes && <p className="rentalAdmin__notes">{request.notes}</p>}
      </article>)}</div><Pagination page={requestPagination.page} pageCount={requestPagination.pageCount} onPageChange={requestPagination.setPage} itemCount={filtered.length} pageSize={8} itemLabel="solicitudes" /></> : <div className="categoryAdmin__empty"><span className="categoryAdmin__emptyIcon" aria-hidden="true">✳</span><h3>{query ? "No encontramos esa solicitud" : "Todavía no hay solicitudes"}</h3><p>{query ? "Probá con otro cliente o disfraz." : "Al registrar una solicitud, los datos del cliente quedarán guardados en la agenda automáticamente."}</p>{query ? <button type="button" onClick={() => setQuery("")}>Limpiar búsqueda</button> : variants.length > 0 && <button type="button" onClick={() => setCreating(true)}>Crear primera solicitud</button>}</div>}
    </div>
    {creating && <RentalRequestEditor variants={variants} busy={pending} onClose={() => setCreating(false)} onSave={showResult} />}
  </section>;
}

function RentalRequestEditor({ variants, busy, onClose, onSave }: { variants: RentalVariantOption[]; busy: boolean; onClose: () => void; onSave: (result: RentalRequestActionResult) => void }) {
  const [lines, setLines] = useState([{ variantId: "", quantity: 1 }]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, startTransition] = useTransition();
  const pending = busy || saving;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setFieldErrors({});
    const data = new FormData(event.currentTarget);
    data.set("items", JSON.stringify(lines));
    const parsed = readRentalRequestFormData(data);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
      setFieldErrors(errors); setError("Revisá los datos marcados."); return;
    }
    startTransition(async () => {
      const result = await createRentalRequest(data);
      if (!result.success) { setFieldErrors(result.fieldErrors ?? {}); setError(result.message ?? "No se pudo registrar la solicitud."); return; }
      onSave(result);
    });
  }

  return <div className="rentalEditor__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}><section className="rentalEditor" role="dialog" aria-modal="true" aria-labelledby="rentalEditorTitle">
    <header><div><p className="adminDashboard__eyebrow">NUEVO ALQUILER</p><h2 id="rentalEditorTitle">Registrar solicitud</h2></div><button type="button" onClick={onClose} disabled={pending} aria-label="Cerrar">×</button></header>
    <p className="rentalEditor__intro">Al guardar, el cliente se crea automáticamente o se actualizan sus datos si ya existe con ese teléfono.</p>
    <form onSubmit={submit} noValidate>
      <div className="rentalEditor__grid"><label className="categoryEditor__field"><span>Nombre y apellido <b>*</b></span><input name="customerName" autoComplete="name" required placeholder="Ej.: Martina López" />{fieldErrors.customerName && <small className="rentalEditor__error">{fieldErrors.customerName}</small>}</label><label className="categoryEditor__field"><span>Teléfono <b>*</b></span><input name="customerPhone" type="tel" autoComplete="tel" required placeholder="+54 9 223 …" />{fieldErrors.customerPhone && <small className="rentalEditor__error">{fieldErrors.customerPhone}</small>}</label><label className="categoryEditor__field"><span>Email <em>Opcional</em></span><input name="customerEmail" type="email" autoComplete="email" placeholder="nombre@ejemplo.com" />{fieldErrors.customerEmail && <small className="rentalEditor__error">{fieldErrors.customerEmail}</small>}</label>
        <label className="categoryEditor__field"><span>Retiro <b>*</b></span><input name="pickupDate" type="date" required />{fieldErrors.pickupDate && <small className="rentalEditor__error">{fieldErrors.pickupDate}</small>}</label><label className="categoryEditor__field"><span>Devolución <b>*</b></span><input name="returnDate" type="date" required />{fieldErrors.returnDate && <small className="rentalEditor__error">{fieldErrors.returnDate}</small>}</label></div>
      <section className="rentalEditor__items"><div><h3>Disfraces y talles</h3><button type="button" className="costumeEditor__add" onClick={() => setLines((current) => [...current, { variantId: "", quantity: 1 }])}>＋ Agregar otro</button></div>
        {lines.map((line, index) => <div className="rentalEditor__line" key={index}><label className="categoryEditor__field"><span>Disfraz y talle</span><select value={line.variantId} onChange={(event) => setLines((current) => current.map((item, i) => i === index ? { ...item, variantId: event.target.value } : item))}><option value="">Elegí un talle</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.costume.name} · {variant.size}{variant.rentalPrice ? ` · ${formatARS(variant.rentalPrice)}` : ""}</option>)}</select></label><label className="categoryEditor__field"><span>Cantidad</span><input type="number" min="1" max="20" value={line.quantity} onChange={(event) => setLines((current) => current.map((item, i) => i === index ? { ...item, quantity: Number(event.target.value) } : item))} /></label>{lines.length > 1 && <button type="button" onClick={() => setLines((current) => current.filter((_, i) => i !== index))} aria-label="Quitar talle">×</button>}</div>)}
        {fieldErrors.items && <small className="rentalEditor__error">{fieldErrors.items}</small>}
      </section>
      <label className="categoryEditor__field"><span>Aclaraciones <em>Opcional</em></span><textarea name="notes" rows={3} maxLength={2000} placeholder="Detalles para tener en cuenta…" /></label>
      <p className="rentalEditor__hint">La solicitud queda pendiente; el registro no confirma disponibilidad ni reserva.</p>
      {error && <p className="rentalEditor__error" role="alert">{error}</p>}
      <footer><button type="button" className="categoryEditor__cancel" onClick={onClose} disabled={pending}>Cancelar</button><button type="submit" className="categoryAdmin__primary" disabled={pending}>{pending ? "Guardando…" : "Registrar solicitud"}</button></footer>
    </form>
  </section></div>;
}
