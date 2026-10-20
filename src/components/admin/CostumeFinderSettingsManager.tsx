"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminToast from "@/components/admin/AdminToast";
import { saveCostumeFinderOptions } from "@/app/admin/asistente/actions";
import { slugify } from "@/lib/slugify";
import type { CostumeFinderOption } from "@/lib/costume-finder-settings";

export default function CostumeFinderSettingsManager({ initialOptions, usageByTag }: { initialOptions: CostumeFinderOption[]; usageByTag: Record<string, number> }) {
  const router = useRouter();
  const [options, setOptions] = useState<CostumeFinderOption[]>(initialOptions);
  const [newLabel, setNewLabel] = useState("");
  const [keywordsText, setKeywordsText] = useState<Record<string, string>>(() => Object.fromEntries(initialOptions.map((option) => [option.id, option.keywords.join(", ")])));
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const assignedCount = useMemo(() => Object.values(usageByTag).reduce((total, count) => total + count, 0), [usageByTag]);

  function updateLabel(id: string, label: string) {
    setOptions((current) => current.map((option) => option.id === id ? { ...option, label } : option));
  }

  function updateKeywords(id: string, value: string) {
    setKeywordsText((current) => ({ ...current, [id]: value }));
    const keywords = value.split(",").map((word) => word.trim()).filter(Boolean);
    setOptions((current) => current.map((option) => option.id === id ? { ...option, keywords } : option));
  }

  function addOption() {
    const label = newLabel.trim();
    if (label.length < 2) return;
    const base = slugify(label) || "estilo";
    let id = base;
    let suffix = 2;
    while (options.some((option) => option.id === id)) id = `${base}-${suffix++}`;
    setOptions((current) => [...current, { id, label, keywords: [] }]);
    setKeywordsText((current) => ({ ...current, [id]: "" }));
    setNewLabel("");
  }

  function removeOption(id: string) {
    if ((usageByTag[id] ?? 0) > 0) return;
    setOptions((current) => current.filter((option) => option.id !== id));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    formData.set("options", JSON.stringify(options));
    startTransition(async () => {
      const result = await saveCostumeFinderOptions(formData);
      setMessage(result.message);
      setIsError(!result.success);
      if (result.success) router.refresh();
    });
  }

  return <section className="finderSettings">
    <header className="finderSettings__header"><div><p className="adminDashboard__eyebrow">CATÁLOGO</p><h1>Asistente de búsqueda</h1><p>Configurá los estilos que aparecen en el asistente y las palabras que ayudan a encontrarlos.</p></div></header>
    <AdminToast message={message} isError={isError} onDismiss={() => setMessage("")} />
    <div className="finderSettings__intro"><strong>{assignedCount} etiquetas asignadas</strong><span>Las relaciones se hacen desde la ficha de cada disfraz. Las categorías del catálogo quedan independientes.</span></div>

    <form className="finderSettings__panel" onSubmit={submit}>
      <div className="finderSettings__panelHeader"><div><h2>Estilos disponibles</h2><p>El nombre se muestra al cliente. Las palabras clave permiten encontrar disfraces aunque no tengan esa etiqueta manual.</p></div><span>{options.length} / 12</span></div>
      <div className="finderSettings__list">
        {options.map((option) => <article className="finderSettings__option" key={option.id}>
          <div className="finderSettings__optionTitle"><span>ESTILO</span><code>{option.id}</code></div>
          <label><span>Nombre visible</span><input value={option.label} onChange={(event) => updateLabel(option.id, event.target.value)} maxLength={50} required /></label>
          <label><span>Palabras clave <small>separadas por coma</small></span><textarea value={keywordsText[option.id] ?? ""} onChange={(event) => updateKeywords(option.id, event.target.value)} rows={2} placeholder="Ej.: hada, princesa, mago" /></label>
          <div className="finderSettings__optionFooter"><small>{usageByTag[option.id] ?? 0} disfraces usan esta etiqueta</small><button type="button" className="finderSettings__remove" disabled={isPending || (usageByTag[option.id] ?? 0) > 0 || options.length <= 1} onClick={() => removeOption(option.id)} title={(usageByTag[option.id] ?? 0) > 0 ? "Quitá esta etiqueta de los disfraces antes de eliminarla." : undefined}>Eliminar</button></div>
        </article>)}
      </div>
      <div className="finderSettings__add"><label><span>Agregar estilo</span><input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} maxLength={50} placeholder="Ej.: Ciencia ficción" /></label><button type="button" disabled={options.length >= 12 || newLabel.trim().length < 2} onClick={addOption}>＋ Agregar</button></div>
      <footer className="finderSettings__footer"><p>Los cambios se aplican al catálogo y al asistente al guardar.</p><button className="categoryAdmin__primary" type="submit" disabled={isPending}>{isPending ? "Guardando…" : "Guardar estilos"}</button></footer>
    </form>
  </section>;
}
