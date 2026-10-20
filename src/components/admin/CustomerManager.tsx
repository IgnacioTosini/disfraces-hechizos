"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminToast from "@/components/admin/AdminToast";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/pagination/Pagination";
import { usePaginatedItems } from "@/components/ui/pagination/usePaginatedItems";
import { readCustomerFormData } from "@/lib/validations/customer";
import Link from "next/link";
import { updateCustomer, type CustomerActionResult } from "@/app/admin/clientes/actions";

export type AdminCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  rentalRequestsCount: number;
};

type CustomerDraft = Pick<AdminCustomer, "id" | "name" | "phone" | "email" | "rentalRequestsCount">;

export default function CustomerManager({ customers, loadError }: { customers: AdminCustomer[]; loadError: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CustomerDraft | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return term ? customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.email ?? ""}`.toLocaleLowerCase("es").includes(term)) : customers;
  }, [customers, query]);
  const customerPagination = usePaginatedItems(filtered, 10, query);

  function showResult(result: CustomerActionResult) {
    setNotice(result.message ?? (result.success ? "Listo." : "Ocurrió un error."));
    setNoticeError(!result.success);
    if (result.success) { setEditing(undefined); router.refresh(); }
  }

  return <section className="customerAdmin">
    <header className="customerAdmin__header">
      <div><p className="adminDashboard__eyebrow">ALQUILERES</p><h1>Clientes</h1><p>Consultá y mantené actualizados los datos de contacto.</p></div>
      <Link className="categoryAdmin__primary" href="/admin/solicitudes">＋ <span>Nueva solicitud</span></Link>
    </header>

    <AdminToast message={notice} isError={noticeError} onDismiss={() => setNotice("")} />
    {loadError && <div className="categoryAdmin__loadError">No se pudieron cargar los clientes. Revisá la conexión con la base de datos y volvé a cargar la página.</div>}

    <div className="customerAdmin__summary">
      <article><span>Clientes</span><strong>{customers.length}</strong></article>
      <article><span>Con solicitudes</span><strong>{customers.filter((customer) => customer.rentalRequestsCount > 0).length}</strong></article>
      <article><span>Solicitudes registradas</span><strong>{customers.reduce((sum, customer) => sum + customer.rentalRequestsCount, 0)}</strong></article>
    </div>

    <div className="customerAdmin__panel">
      <div className="customerAdmin__toolbar"><div><h2>Agenda de clientes</h2><p>{customers.length === 1 ? "1 cliente" : `${customers.length} clientes`}</p></div>
        <AdminSearch value={query} onChange={setQuery} placeholder="Buscar por nombre, teléfono o email…" label="Buscar clientes" />
      </div>

      {filtered.length ? <><div className="customerAdmin__list">{customerPagination.pageItems.map((customer) => <article className="customerAdmin__row" key={customer.id}>
        <div className="customerAdmin__avatar" aria-hidden="true">{customer.name.trim().slice(0, 1).toLocaleUpperCase("es")}</div>
        <div className="customerAdmin__info"><h3>{customer.name}</h3><a href={`tel:${customer.phone}`}>{customer.phone}</a>{customer.email && <a href={`mailto:${customer.email}`}>{customer.email}</a>}</div>
        <div className="customerAdmin__requests"><strong>{customer.rentalRequestsCount}</strong><span>{customer.rentalRequestsCount === 1 ? "solicitud" : "solicitudes"}</span></div>
        <div className="categoryAdmin__actions"><button type="button" onClick={() => { setNotice(""); setEditing(customer); }}>Editar datos</button></div>
      </article>)}</div><Pagination page={customerPagination.page} pageCount={customerPagination.pageCount} onPageChange={customerPagination.setPage} itemCount={filtered.length} pageSize={10} itemLabel="clientes" /></> : <div className="categoryAdmin__empty"><span className="categoryAdmin__emptyIcon" aria-hidden="true">♙</span><h3>{query ? "No encontramos ese cliente" : "Todavía no hay clientes"}</h3><p>{query ? "Probá con otro nombre, teléfono o email." : "Los clientes aparecerán acá automáticamente cuando registres una solicitud."}</p>{query ? <button type="button" onClick={() => setQuery("")}>Limpiar búsqueda</button> : <Link href="/admin/solicitudes">Crear primera solicitud</Link>}</div>}
    </div>

    {editing && <CustomerEditor key={editing.id} customer={editing} onClose={() => setEditing(undefined)} onSave={showResult} />}
  </section>;
}

function CustomerEditor({ customer, onClose, onSave }: { customer: CustomerDraft; onClose: () => void; onSave: (result: CustomerActionResult) => void }) {
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, startTransition] = useTransition();
  const pending = saving;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    const data = new FormData(event.currentTarget);
    const parsed = readCustomerFormData(data);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
      setFieldErrors(errors);
      setError("Revisá los datos marcados.");
      return;
    }
    startTransition(async () => {
      const result = await updateCustomer(customer.id, data);
      if (!result.success) { setError(result.message ?? "No se pudieron guardar los datos."); setFieldErrors(result.fieldErrors ?? {}); return; }
      onSave(result);
    });
  }

  return <div className="customerEditor__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
    <section className="customerEditor" role="dialog" aria-modal="true" aria-labelledby="customerEditorTitle">
      <header><div><p className="adminDashboard__eyebrow">AGENDA DE CLIENTES</p><h2 id="customerEditorTitle">Editar datos</h2></div><button type="button" onClick={onClose} disabled={pending} aria-label="Cerrar">×</button></header>
      <p className="customerEditor__intro">Los datos se actualizan en la ficha del cliente y se mantienen asociados a sus solicitudes.</p>
      <form onSubmit={submit} noValidate>
        <label className="categoryEditor__field"><span>Nombre y apellido <b>*</b></span><input name="name" defaultValue={customer?.name ?? ""} maxLength={100} autoComplete="name" required aria-invalid={Boolean(fieldErrors.name)} placeholder="Ej.: Martina López" />{fieldErrors.name && <small className="customerEditor__error">{fieldErrors.name}</small>}</label>
        <label className="categoryEditor__field"><span>Teléfono <b>*</b></span><input name="phone" defaultValue={customer?.phone ?? ""} maxLength={30} type="tel" autoComplete="tel" required aria-invalid={Boolean(fieldErrors.phone)} placeholder="+54 9 223 …" />{fieldErrors.phone && <small className="customerEditor__error">{fieldErrors.phone}</small>}</label>
        <label className="categoryEditor__field"><span>Email <em>Opcional</em></span><input name="email" defaultValue={customer?.email ?? ""} maxLength={254} type="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} placeholder="nombre@ejemplo.com" />{fieldErrors.email && <small className="customerEditor__error">{fieldErrors.email}</small>}</label>
        <p className="customerEditor__history">Este cliente tiene {customer.rentalRequestsCount} {customer.rentalRequestsCount === 1 ? "solicitud asociada" : "solicitudes asociadas"}. Los clientes se originan en solicitudes y no se eliminan desde esta sección.</p>
        {error && <p className="customerEditor__error" role="alert">{error}</p>}
        <footer><button type="button" className="categoryEditor__cancel" onClick={onClose} disabled={pending}>Cancelar</button><button type="submit" className="categoryAdmin__primary" disabled={pending}>{pending ? "Guardando…" : "Guardar cambios"}</button></footer>
      </form>
    </section>
  </div>;
}
