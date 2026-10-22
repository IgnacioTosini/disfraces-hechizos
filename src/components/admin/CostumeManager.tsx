"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminToast from "@/components/admin/AdminToast";
import ImageCropper from "@/components/admin/ImageCropper";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/pagination/Pagination";
import { usePaginatedItems } from "@/components/ui/pagination/usePaginatedItems";
import { formatARS } from "@/lib/formatters";
import { slugify } from "@/lib/slugify";
import { ImageService } from "@/services/ImageService";
import { validateImageFile } from "@/lib/image-upload-validation";
import { readCostumeFormData } from "@/lib/validations/costume";
import type { CostumeFinderOption } from "@/lib/costume-finder-settings";
import {
  createCostume,
  deleteCostume,
  setCostumeActive,
  updateCostume,
  type CostumeActionResult,
} from "@/app/admin/disfraces/actions";

export type CostumeCategoryOption = { id: string; name: string; isActive: boolean };
type Audience = "ADULT" | "CHILD" | "UNISEX";
type CostumeVariant = { id?: string; size: string; stockQuantity: number; isActive: boolean; rentalItemsCount?: number };
type CostumeImage = { url: string; publicId: string | null; altText: string | null; sortOrder: number };

export type AdminCostume = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  audience: Audience;
  rentalPrice: string | null;
  isFeatured: boolean;
  isActive: boolean;
  assistantTags: string[];
  categoryId: string;
  category: CostumeCategoryOption;
  images: CostumeImage[];
  variants: CostumeVariant[];
};

type PendingImage = { file: File; previewUrl: string; altText: string };
type CropImage = { id: string; file: File; sourceUrl: string };
type EditorCostume = Omit<AdminCostume, "category">;

const audienceLabels: Record<Audience, string> = { ADULT: "Adultos", CHILD: "Infantiles", UNISEX: "Unisex" };
const maximumImages = 8;

export default function CostumeManager({ costumes, categories, finderOptions, loadError }: { costumes: AdminCostume[]; categories: CostumeCategoryOption[]; finderOptions: CostumeFinderOption[]; loadError: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EditorCostume | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredCostumes = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    if (!term) return costumes;
    return costumes.filter((costume) => `${costume.name} ${costume.slug} ${costume.category.name}`.toLocaleLowerCase("es").includes(term));
  }, [costumes, query]);
  const costumePagination = usePaginatedItems(filteredCostumes, 8, query);

  function showResult(result: CostumeActionResult) {
    setNotice(result.message ?? (result.success ? "Listo." : "Ocurrió un error."));
    setNoticeError(!result.success);
    if (result.success) {
      setEditing(undefined);
      router.refresh();
    }
  }

  function changeActive(costume: AdminCostume) {
    startTransition(async () => showResult(await setCostumeActive(costume.id, !costume.isActive)));
  }

  function removeCostume(costume: AdminCostume) {
    if (!window.confirm(`¿Eliminar “${costume.name}”? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const result = await deleteCostume(costume.id);
      if (result.success && result.deletedImagePublicIds?.length) {
        const responses = await Promise.all(result.deletedImagePublicIds.map((id) => ImageService.deleteImage(id)));
        if (responses.some((response) => !response.success)) result.message = "El disfraz se eliminó, pero alguna imagen no se pudo borrar de Cloudinary.";
      }
      showResult(result);
    });
  }

  return (
    <section className="costumeAdmin">
      <header className="costumeAdmin__header">
        <div><p className="adminDashboard__eyebrow">CATÁLOGO</p><h1>Disfraces</h1><p>Gestioná fichas, talles e imágenes desde un solo lugar. <Link href="/admin/asistente">Configurar etiquetas del asistente →</Link></p></div>
        <button className="categoryAdmin__primary" type="button" disabled={!categories.some((category) => category.isActive)} onClick={() => { setNotice(""); setEditing(null); }}>＋ <span>Nuevo disfraz</span></button>
      </header>

      <AdminToast message={notice} isError={noticeError} onDismiss={() => setNotice("")} />
      {loadError && <div className="categoryAdmin__loadError">No se pudieron cargar los disfraces. Revisá la conexión con la base de datos y volvé a cargar la página.</div>}
      {!categories.some((category) => category.isActive) && <div className="costumeAdmin__hint">Para crear un disfraz primero necesitás una categoría activa. <Link href="/admin/categorias">Ir a categorías →</Link></div>}

      <div className="costumeAdmin__summary">
        <article><span>En catálogo</span><strong>{costumes.length}</strong></article>
        <article><span>Activos</span><strong>{costumes.filter((costume) => costume.isActive).length}</strong></article>
        <article><span>Destacados</span><strong>{costumes.filter((costume) => costume.isFeatured).length}</strong></article>
      </div>

      <div className="costumeAdmin__panel">
        <div className="costumeAdmin__toolbar"><div><h2>Todos los disfraces</h2><p>{costumes.length === 1 ? "1 ficha" : `${costumes.length} fichas`}</p></div>
          <AdminSearch value={query} onChange={setQuery} placeholder="Buscar por nombre o categoría…" label="Buscar disfraces" />
        </div>

        {filteredCostumes.length ? <div className="costumeAdmin__list">
          {costumePagination.pageItems.map((costume) => {
            const hasRentalHistory = costume.variants.some((variant) => (variant.rentalItemsCount ?? 0) > 0);
            const assistantLabels = costume.assistantTags.map((tag) => finderOptions.find((option) => option.id === tag)?.label).filter((label): label is string => Boolean(label));
            return <article className={`costumeAdmin__row${!costume.isActive ? " costumeAdmin__row--inactive" : ""}`} key={costume.id}>
              <div className="costumeAdmin__photo" aria-hidden="true">{costume.images[0] ? <span style={{ backgroundImage: `url(${JSON.stringify(costume.images[0].url)})` }} /> : <span>{costume.name.slice(0, 1).toLocaleUpperCase("es")}</span>}</div>
              <div className="costumeAdmin__info">
                <div className="costumeAdmin__title"><h3>{costume.name}</h3><span className={`categoryAdmin__badge${costume.isActive ? " categoryAdmin__badge--active" : ""}`}>{costume.isActive ? "Publicado" : "Pausado"}</span>{costume.isFeatured && <span className="costumeAdmin__featured">★ Destacado</span>}</div>
                <p className="costumeAdmin__meta">{costume.category.name} <span>·</span> {audienceLabels[costume.audience]} <span>·</span> {costume.variants.length} {costume.variants.length === 1 ? "talle" : "talles"} <span>·</span> {costume.images.length} {costume.images.length === 1 ? "imagen" : "imágenes"}</p>
                {assistantLabels.length > 0 && <p className="costumeAdmin__assistantTags">Asistente: {assistantLabels.join(" · ")}</p>}
                {hasRentalHistory && <p className="costumeAdmin__historyNotice">Tiene solicitudes vinculadas; pausalo para conservar el historial.</p>}
                <p className="costumeAdmin__slug">/{costume.slug}</p>
              </div>
              <div className="costumeAdmin__price">{costume.rentalPrice ? formatARS(costume.rentalPrice) : <span>Sin precio</span>}<small>orientativo</small></div>
              <div className="categoryAdmin__actions">
                <button type="button" onClick={() => { setNotice(""); setEditing(costume); }}>Editar</button>
                <button type="button" disabled={isPending} onClick={() => changeActive(costume)}>{costume.isActive ? "Pausar" : "Publicar"}</button>
                <button className="categoryAdmin__delete" type="button" disabled={isPending || hasRentalHistory} title={hasRentalHistory ? "No se puede eliminar porque tiene solicitudes vinculadas." : undefined} onClick={() => removeCostume(costume)}>{hasRentalHistory ? "Con historial" : "Eliminar"}</button>
              </div>
            </article>;
          })}
        </div> : <div className="categoryAdmin__empty"><span className="categoryAdmin__emptyIcon" aria-hidden="true">✦</span><h3>{query ? "No encontramos ese disfraz" : "Todavía no hay disfraces"}</h3><p>{query ? "Probá con otro nombre o categoría." : "Creá la primera ficha para comenzar a armar tu catálogo."}</p>{query ? <button type="button" onClick={() => setQuery("")}>Limpiar búsqueda</button> : categories.some((category) => category.isActive) ? <button type="button" onClick={() => setEditing(null)}>Crear primer disfraz</button> : <Link href="/admin/categorias">Crear una categoría</Link>}</div>}
        {filteredCostumes.length > 0 && <Pagination page={costumePagination.page} pageCount={costumePagination.pageCount} onPageChange={costumePagination.setPage} itemCount={filteredCostumes.length} pageSize={8} itemLabel="disfraces" />}
      </div>

      {editing !== undefined && <CostumeEditor key={editing?.id ?? "new-costume"} costume={editing} categories={categories} finderOptions={finderOptions} busy={isPending} onClose={() => setEditing(undefined)} onSave={(result) => { if (result.success) showResult(result); }} />}
    </section>
  );
}

function CostumeEditor({ costume, categories, finderOptions, busy, onClose, onSave }: {
  costume: EditorCostume | null;
  categories: CostumeCategoryOption[];
  finderOptions: CostumeFinderOption[];
  busy: boolean;
  onClose: () => void;
  onSave: (result: CostumeActionResult) => void;
}) {
  const [name, setName] = useState(costume?.name ?? "");
  const [slug, setSlug] = useState(costume?.slug ?? "");
  const [assistantTags, setAssistantTags] = useState<string[]>(costume?.assistantTags ?? []);
  const [slugTouched, setSlugTouched] = useState(false);
  const [variants, setVariants] = useState<CostumeVariant[]>(costume?.variants.map(({ id, size, stockQuantity, isActive, rentalItemsCount }) => ({ id, size, stockQuantity, isActive, rentalItemsCount })) ?? []);
  const [existingImages, setExistingImages] = useState<CostumeImage[]>(costume?.images ?? []);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [cropQueue, setCropQueue] = useState<CropImage[]>([]);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState("");
  const [expandedImage, setExpandedImage] = useState<{ url: string; alt: string } | null>(null);
  const [saving, startTransition] = useTransition();
  const pending = busy || saving;
  const previewUrls = useRef(new Set<string>());
  const cropSourceUrls = useRef(new Set<string>());

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    cropSourceUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    if (!expandedImage) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setExpandedImage(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expandedImage]);

  function selectImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    const capacity = maximumImages - existingImages.length - pendingImages.length - cropQueue.length;
    const capacityWarning = selected.length > capacity ? `Podés agregar ${Math.max(0, capacity)} imagen${capacity === 1 ? "" : "es"} más.` : "";
    const accepted: CropImage[] = [];
    for (const file of selected.slice(0, Math.max(0, capacity))) {
      const error = validateImageFile(file);
      if (error) { setImageError(error); continue; }
      const sourceUrl = URL.createObjectURL(file);
      cropSourceUrls.current.add(sourceUrl);
      accepted.push({ id: crypto.randomUUID(), file, sourceUrl });
    }
    if (accepted.length) {
      setCropQueue((current) => [...current, ...accepted]);
      setImageError(capacityWarning);
    } else if (capacityWarning) setImageError(capacityWarning);
  }

  function applyImageCrop(file: File) {
    const sourceImage = cropQueue[0];
    if (!sourceImage) return;
    URL.revokeObjectURL(sourceImage.sourceUrl);
    cropSourceUrls.current.delete(sourceImage.sourceUrl);
    const previewUrl = URL.createObjectURL(file);
    previewUrls.current.add(previewUrl);
    setPendingImages((current) => [...current, { file, previewUrl, altText: sourceImage.file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") }]);
    setCropQueue((current) => current.slice(1));
  }

  function skipImageCrop() {
    const sourceImage = cropQueue[0];
    if (sourceImage) {
      URL.revokeObjectURL(sourceImage.sourceUrl);
      cropSourceUrls.current.delete(sourceImage.sourceUrl);
    }
    setCropQueue((current) => current.slice(1));
  }

  function removePendingImage(previewUrl: string) {
    URL.revokeObjectURL(previewUrl);
    previewUrls.current.delete(previewUrl);
    setPendingImages((current) => current.filter((image) => image.previewUrl !== previewUrl));
  }

  function removeVariant(index: number) {
    setVariants((current) => current.flatMap((variant, variantIndex) => {
      if (variantIndex !== index) return [variant];
      if (variant.id && (variant.rentalItemsCount ?? 0) > 0) return [{ ...variant, stockQuantity: 0, isActive: false }];
      return [];
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});
    const formData = new FormData(event.currentTarget);
    formData.set("variants", JSON.stringify(variants.map(({ id, size, stockQuantity, isActive }) => ({ id, size, stockQuantity, isActive }))));
    formData.set("images", JSON.stringify(existingImages.map((image, index) => ({ url: image.url, publicId: image.publicId, altText: image.altText ?? "", sortOrder: index }))));
    formData.set("assistantTags", JSON.stringify(assistantTags));
    const validation = readCostumeFormData(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) errors[issue.path.map(String).join(".") || "form"] ??= issue.message;
      setFieldErrors(errors);
      setFormError(validation.error.issues.map((issue) => `${issue.path.map(String).join(" → ") || "Formulario"}: ${issue.message}`).join(" "));
      return;
    }

    startTransition(async () => {
      const uploaded: CostumeImage[] = [];
      for (const image of pendingImages) {
        setFormError(`Subiendo ${uploaded.length + 1} de ${pendingImages.length} imágenes…`);
        const result = await ImageService.uploadImage(image.file, { folder: "productos" });
        if (!result.success) {
          await Promise.all(uploaded.flatMap((item) => item.publicId ? [ImageService.deleteImage(item.publicId)] : []));
          setFormError(result.error);
          return;
        }
        uploaded.push({ url: result.url, publicId: result.public_id, altText: image.altText.trim(), sortOrder: existingImages.length + uploaded.length });
      }

      formData.set("images", JSON.stringify([...existingImages, ...uploaded].map((image, index) => ({ url: image.url, publicId: image.publicId, altText: image.altText ?? "", sortOrder: index }))));
      const result = costume ? await updateCostume(costume.id, formData) : await createCostume(formData);
      if (!result.success) {
        await Promise.all(uploaded.flatMap((item) => item.publicId ? [ImageService.deleteImage(item.publicId)] : []));
        setFormError(result.message ?? "Revisá la información del formulario.");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      if (result.deletedImagePublicIds?.length) {
        const removed = await Promise.all(result.deletedImagePublicIds.map((id) => ImageService.deleteImage(id)));
        if (removed.some((response) => !response.success)) result.message = "Cambios guardados, pero alguna imagen anterior no se pudo borrar de Cloudinary.";
      }
      onSave(result);
    });
  }

  const activeCategories = categories.filter((category) => category.isActive || category.id === costume?.categoryId);

  return (
    <div className="costumeEditor__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section className="costumeEditor" role="dialog" aria-modal="true" aria-labelledby="costumeEditorTitle">
        <header className="costumeEditor__header"><div><p className="adminDashboard__eyebrow">{costume ? "FICHA DEL CATÁLOGO" : "NUEVO EN EL CATÁLOGO"}</p><h2 id="costumeEditorTitle">{costume ? "Editar disfraz" : "Crear disfraz"}</h2></div><button type="button" className="categoryEditor__close" onClick={onClose} disabled={pending} aria-label="Cerrar">×</button></header>
        <p className="costumeEditor__intro">Completá la ficha y agregá talles e imágenes para que puedan consultarlo.</p>

        <form className="costumeEditor__form" onSubmit={submit} noValidate>
          <section className="costumeEditor__section"><div className="costumeEditor__sectionTitle"><span>01</span><div><h3>Datos del disfraz</h3><p>Nombre, público y categoría.</p></div></div>
            <div className="costumeEditor__grid">
              <label className="categoryEditor__field"><span>Nombre <b>*</b></span><input name="name" value={name} onChange={(event) => { setName(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)); }} maxLength={100} required placeholder="Ej.: Astronauta" aria-invalid={Boolean(fieldErrors.name)} />{fieldErrors.name && <small className="costumeEditor__error">{fieldErrors.name}</small>}</label>
              <label className="categoryEditor__field"><span>Identificador de URL <b>*</b></span><input name="slug" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(slugify(event.target.value)); }} maxLength={110} required placeholder="astronauta" aria-invalid={Boolean(fieldErrors.slug)} /><small className={fieldErrors.slug ? "costumeEditor__error" : undefined}>{fieldErrors.slug ?? "Se usa en enlaces y búsquedas."}</small></label>
              <label className="categoryEditor__field"><span>Para quién <b>*</b></span><select name="audience" defaultValue={costume?.audience ?? "UNISEX"}><option value="ADULT">Adultos</option><option value="CHILD">Infantiles</option><option value="UNISEX">Unisex</option></select></label>
              <label className="categoryEditor__field"><span>Categoría <b>*</b></span><select name="categoryId" defaultValue={costume?.categoryId ?? ""} required aria-invalid={Boolean(fieldErrors.categoryId)}><option value="" disabled>Elegí una categoría</option>{activeCategories.map((category) => <option value={category.id} key={category.id}>{category.name}{!category.isActive ? " · pausada" : ""}</option>)}</select>{fieldErrors.categoryId && <small className="costumeEditor__error">{fieldErrors.categoryId}</small>}</label>
              <label className="categoryEditor__field costumeEditor__description"><span>Descripción <em>Opcional</em></span><textarea name="description" defaultValue={costume?.description ?? ""} maxLength={1200} rows={3} placeholder="Contá qué incluye o qué lo hace especial…" /></label>
              <label className="categoryEditor__field"><span>Precio orientativo <em>Opcional</em></span><div className="costumeEditor__priceInput"><span>$</span><input name="rentalPrice" type="number" min="0" max="99999999.99" step="0.01" defaultValue={costume?.rentalPrice ?? ""} placeholder="18000" /></div><small>En pesos argentinos. Se confirma con el local.</small></label>
            </div>
            <fieldset className="costumeEditor__assistantTags"><legend>Etiquetas del asistente</legend><p>Elegí los estilos que describen este disfraz. Se usan para recomendarlo en el buscador guiado.</p><div>{finderOptions.map((option) => <label key={option.id}><input type="checkbox" checked={assistantTags.includes(option.id)} onChange={(event) => setAssistantTags((current) => event.target.checked ? [...current, option.id] : current.filter((id) => id !== option.id))} /><span>{option.label}</span></label>)}</div>{fieldErrors.assistantTags && <small className="costumeEditor__error">{fieldErrors.assistantTags}</small>}</fieldset>
            <div className="costumeEditor__toggles"><label><input type="checkbox" name="isActive" defaultChecked={costume?.isActive ?? true} /><span><strong>Visible en el catálogo</strong><small>Podés pausarlo sin perder sus datos.</small></span></label><label><input type="checkbox" name="isFeatured" defaultChecked={costume?.isFeatured ?? false} /><span><strong>Marcar como destacado</strong><small>Señala los disfraces que querés priorizar.</small></span></label></div>
          </section>

          <section className="costumeEditor__section"><div className="costumeEditor__sectionTitle"><span>02</span><div><h3>Talles y stock</h3><p>Agregá las variantes disponibles para consultar.</p></div><button type="button" className="costumeEditor__add" onClick={() => setVariants((current) => [...current, { size: "", stockQuantity: 0, isActive: true }])}>＋ Agregar talle</button></div>
            <div className="costumeEditor__variants">
              {variants.map((variant, index) => <div className={`costumeEditor__variant${!variant.isActive ? " costumeEditor__variant--inactive" : ""}`} key={variant.id ?? `new-${index}`}>
                <label><span>Talle</span><input aria-invalid={Boolean(fieldErrors[`variants.${index}.size`])} value={variant.size} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, size: event.target.value } : item))} placeholder="Ej.: M o 4-6" maxLength={24} />{fieldErrors[`variants.${index}.size`] && <small className="costumeEditor__error">{fieldErrors[`variants.${index}.size`]}</small>}</label>
                <label><span>Unidades</span><input aria-invalid={Boolean(fieldErrors[`variants.${index}.stockQuantity`])} type="number" min="0" max="9999" step="1" value={variant.stockQuantity} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, stockQuantity: Number(event.target.value) } : item))} />{fieldErrors[`variants.${index}.stockQuantity`] && <small className="costumeEditor__error">{fieldErrors[`variants.${index}.stockQuantity`]}</small>}</label>
                <small className="costumeEditor__stockHint">Solo números enteros, entre 0 y 9999.</small>
                <label className="costumeEditor__variantActive"><input type="checkbox" checked={variant.isActive} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: event.target.checked } : item))} /><span>Disponible</span></label>
                <button type="button" className="costumeEditor__removeVariant" onClick={() => removeVariant(index)} aria-label={variant.id && (variant.rentalItemsCount ?? 0) > 0 ? `Pausar talle ${variant.size} para conservar su historial` : `Quitar talle ${variant.size || index + 1}`}>{variant.id && (variant.rentalItemsCount ?? 0) > 0 ? "Pausar" : "Quitar"}</button>
                {variant.id && (variant.rentalItemsCount ?? 0) > 0 && <small className="costumeEditor__variantNote">Tiene consultas vinculadas; se pausa para conservar el historial.</small>}
              </div>)}
              {!variants.length && <div className="costumeEditor__variantEmpty">Agregá al menos un talle para que puedan consultar este disfraz.</div>}
              {fieldErrors.variants && <p className="costumeEditor__error">{fieldErrors.variants}</p>}
            </div>
          </section>

          <section className="costumeEditor__section costumeEditor__section--photos"><div className="costumeEditor__sectionTitle"><span>03</span><div><h3>Fotos</h3><p>Hasta {maximumImages} imágenes. Ajustalas antes de subirlas a Cloudinary.</p></div><label className="costumeEditor__add costumeEditor__fileAdd">＋ Agregar fotos<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectImages} disabled={pending || existingImages.length + pendingImages.length + cropQueue.length >= maximumImages} /></label></div>
            <div className="costumeEditor__imageGrid">
              {existingImages.map((image, index) => <div className="costumeEditor__imageCard" key={`${image.publicId ?? image.url}-${index}`}><button type="button" className="costumeEditor__imagePhotoButton" onClick={() => setExpandedImage({ url: image.url, alt: image.altText || `Foto ${index + 1} de ${name}` })} aria-label={`Ampliar foto ${index + 1} de ${name}`}><span className="costumeEditor__imagePhoto" style={{ backgroundImage: `url(${JSON.stringify(image.url)})` }} /><small>Ver en grande</small></button><label>Texto alternativo<input maxLength={180} value={image.altText ?? ""} onChange={(event) => setExistingImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, altText: event.target.value } : item))} placeholder="Describí la imagen" /></label><button type="button" onClick={() => setExistingImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Quitar foto</button></div>)}
              {pendingImages.map((image, index) => <div className="costumeEditor__imageCard" key={image.previewUrl}><button type="button" className="costumeEditor__imagePhotoButton" onClick={() => setExpandedImage({ url: image.previewUrl, alt: image.altText || `Vista previa ${index + 1} de ${name}` })} aria-label={`Ampliar vista previa ${index + 1} de ${name}`}><span className="costumeEditor__imagePhoto" style={{ backgroundImage: `url(${JSON.stringify(image.previewUrl)})` }} /><small>Ver en grande</small></button><label>Texto alternativo<input maxLength={180} value={image.altText} onChange={(event) => setPendingImages((current) => current.map((item) => item.previewUrl === image.previewUrl ? { ...item, altText: event.target.value } : item))} placeholder="Describí la imagen" /></label><small>Vista previa local · se sube al guardar</small><button type="button" onClick={() => removePendingImage(image.previewUrl)}>Quitar foto</button></div>)}
              {!existingImages.length && !pendingImages.length && <div className="costumeEditor__imageEmpty"><span aria-hidden="true">▧</span><strong>Las fotos ayudan a elegir</strong><small>Elegí imágenes para ver una vista previa antes de subirlas.</small></div>}
            </div>
            {imageError && <p className="costumeEditor__error" role="alert">{imageError}</p>}
          </section>

          {formError && <p className="costumeEditor__formError" role="alert">{formError}</p>}
          <footer className="costumeEditor__footer"><button type="button" className="categoryEditor__cancel" onClick={onClose} disabled={pending}>Cancelar</button><button type="submit" className="categoryAdmin__primary" disabled={pending}>{pending ? "Guardando…" : costume ? "Guardar cambios" : "Crear disfraz"}</button></footer>
        </form>
      </section>
      {expandedImage && <div className="costumeEditor__imageLightbox" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpandedImage(null); }}>
        <section role="dialog" aria-modal="true" aria-label="Vista ampliada de la imagen">
          <button type="button" onClick={() => setExpandedImage(null)} aria-label="Cerrar imagen ampliada">×</button>
          <div><Image src={expandedImage.url} alt={expandedImage.alt} fill sizes="(max-width: 48rem) 96vw, 80vw" unoptimized={expandedImage.url.startsWith("blob:")} /></div>
          <p>{expandedImage.alt}</p>
        </section>
      </div>}
      {cropQueue[0] && <ImageCropper key={cropQueue[0].id} file={cropQueue[0].file} sourceUrl={cropQueue[0].sourceUrl} aspectRatio={4 / 5} title="Ajustar foto del disfraz" onCancel={skipImageCrop} onApply={applyImageCrop} />}
    </div>
  );
}
