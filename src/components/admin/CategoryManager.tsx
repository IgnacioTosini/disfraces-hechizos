"use client";

import { useEffect, useMemo, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminToast from "@/components/admin/AdminToast";
import ImageCropper from "@/components/admin/ImageCropper";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/pagination/Pagination";
import { usePaginatedItems } from "@/components/ui/pagination/usePaginatedItems";
import { slugify } from "@/lib/slugify";
import { ImageService } from "@/services/ImageService";
import { validateImageFile } from "@/lib/image-upload-validation";
import {
  createCategory,
  deleteCategory,
  setCategoryActive,
  updateCategory,
  type CategoryActionResult,
} from "@/app/admin/categorias/actions";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { costumes: number };
};

type EditorCategory = Omit<AdminCategory, "_count">;

export default function CategoryManager({ categories, loadError }: { categories: AdminCategory[]; loadError: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EditorCategory | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleCategories = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    if (!term) return categories;
    return categories.filter((category) =>
      `${category.name} ${category.slug} ${category.description ?? ""}`.toLocaleLowerCase("es").includes(term),
    );
  }, [categories, query]);
  const categoryPagination = usePaginatedItems(visibleCategories, 8, query);

  const activeCount = categories.filter((category) => category.isActive).length;
  const inactiveCount = categories.length - activeCount;

  function showResult(result: CategoryActionResult) {
    setNotice(result.message ?? (result.success ? "Listo." : "Ocurrió un error."));
    setNoticeError(!result.success);
    if (result.success) {
      setEditing(undefined);
      router.refresh();
    }
  }

  function changeActive(category: AdminCategory) {
    startTransition(async () => showResult(await setCategoryActive(category.id, !category.isActive)));
  }

  function removeCategory(category: AdminCategory) {
    if (!window.confirm(`¿Eliminar “${category.name}”? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.success && result.imagePublicId) {
        const removed = await ImageService.deleteImage(result.imagePublicId);
        if (!removed.success) result.message = "La categoría se eliminó, pero no se pudo borrar su imagen de Cloudinary.";
      }
      showResult(result);
    });
  }

  return (
    <section className="categoryAdmin">
      <header className="categoryAdmin__header">
        <div>
          <p className="adminDashboard__eyebrow">CATÁLOGO</p>
          <h1>Categorías</h1>
          <p>Ordená las temáticas que organizan tus disfraces.</p>
        </div>
        <button className="categoryAdmin__primary" type="button" onClick={() => { setNotice(""); setEditing(null); }}>＋ <span>Nueva categoría</span></button>
      </header>

      <AdminToast message={notice} isError={noticeError} onDismiss={() => setNotice("")} />
      {loadError && <div className="categoryAdmin__loadError">No se pudieron cargar las categorías. Revisá la conexión con la base de datos y volvé a cargar la página.</div>}

      <div className="categoryAdmin__overview">
        <article><span>Total</span><strong>{categories.length}</strong><small>categorías creadas</small></article>
        <article><span>Visibles</span><strong>{activeCount}</strong><small>disponibles en el sitio</small></article>
        <article><span>Pausadas</span><strong>{inactiveCount}</strong><small>ocultas del catálogo</small></article>
      </div>

      <div className="categoryAdmin__listPanel">
        <div className="categoryAdmin__toolbar">
          <div><h2>Tu organización</h2><p>{categories.length === 1 ? "1 categoría" : `${categories.length} categorías`}</p></div>
          <AdminSearch value={query} onChange={setQuery} placeholder="Buscar categoría…" label="Buscar categorías" />
        </div>

        {visibleCategories.length ? (
          <>
          <div className="categoryAdmin__list">
            {categoryPagination.pageItems.map((category) => (
              <article className={`categoryAdmin__row${!category.isActive ? " categoryAdmin__row--inactive" : ""}`} key={category.id}>
                <div className="categoryAdmin__image" aria-hidden="true">
                  {category.imageUrl ? <span className="categoryAdmin__imagePhoto" style={{ backgroundImage: `url(${JSON.stringify(category.imageUrl)})` }} /> : <span>{category.name.slice(0, 1).toLocaleUpperCase("es")}</span>}
                </div>
                <div className="categoryAdmin__details">
                  <div className="categoryAdmin__titleLine"><h3>{category.name}</h3><span className={`categoryAdmin__badge${category.isActive ? " categoryAdmin__badge--active" : ""}`}>{category.isActive ? "Visible" : "Pausada"}</span></div>
                  <p className="categoryAdmin__slug">/{category.slug}</p>
                  {category.description && <p className="categoryAdmin__description">{category.description}</p>}
                </div>
                <div className="categoryAdmin__count"><strong>{category._count.costumes}</strong><span>{category._count.costumes === 1 ? "disfraz" : "disfraces"}</span></div>
                <div className="categoryAdmin__actions">
                  <button type="button" onClick={() => { setNotice(""); setEditing(category); }}>Editar</button>
                  <button type="button" disabled={isPending} onClick={() => changeActive(category)}>{category.isActive ? "Pausar" : "Activar"}</button>
                  {category._count.costumes === 0 && <button className="categoryAdmin__delete" type="button" disabled={isPending} onClick={() => removeCategory(category)} aria-label={`Eliminar ${category.name}`}>Eliminar</button>}
                </div>
              </article>
            ))}
          </div>
          <Pagination page={categoryPagination.page} pageCount={categoryPagination.pageCount} onPageChange={categoryPagination.setPage} itemCount={visibleCategories.length} pageSize={8} itemLabel="categorías" />
          </>
        ) : (
          <div className="categoryAdmin__empty">
            <span className="categoryAdmin__emptyIcon" aria-hidden="true">✳</span>
            <h3>{query ? "No encontramos esa categoría" : "Todavía no hay categorías"}</h3>
            <p>{query ? "Probá con otro nombre o identificador." : "Creá la primera para empezar a ordenar el catálogo de disfraces."}</p>
            {query ? <button type="button" onClick={() => setQuery("")}>Limpiar búsqueda</button> : <button type="button" onClick={() => setEditing(null)}>Crear primera categoría</button>}
          </div>
        )}
      </div>

      {editing !== undefined && <CategoryEditor key={editing?.id ?? "new-category"} category={editing} busy={isPending} onClose={() => setEditing(undefined)} onSave={(result) => {
        if (!result.success) {
          setNotice(result.message ?? "Revisá los datos del formulario.");
          setNoticeError(true);
        } else showResult(result);
      }} />}
    </section>
  );
}

function CategoryEditor({ category, busy, onClose, onSave }: {
  category: EditorCategory | null;
  busy: boolean;
  onClose: () => void;
  onSave: (result: CategoryActionResult) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? "");
  const [imagePublicId, setImagePublicId] = useState(category?.imagePublicId ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [cropSelection, setCropSelection] = useState<{ file: File; sourceUrl: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, startTransition] = useTransition();
  const pending = busy || saving;

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  useEffect(() => () => { if (cropSelection?.sourceUrl) URL.revokeObjectURL(cropSelection.sourceUrl); }, [cropSelection?.sourceUrl]);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      event.target.value = "";
      return;
    }
    setImageError("");
    setCropSelection({ file, sourceUrl: URL.createObjectURL(file) });
  }

  function applyImageCrop(file: File) {
    setImageFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setCropSelection(null);
  }

  function clearImage() {
    setImageFile(null);
    setLocalPreviewUrl("");
    setImageUrl("");
    setImagePublicId("");
    setImageError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      let uploadedPublicId: string | null = null;
      if (imageFile) {
        setFormError("Optimizando y subiendo imagen…");
        const upload = await ImageService.uploadImage(imageFile, { folder: "categorias" });
        if (!upload.success) {
          setFormError(upload.error);
          return;
        }
        uploadedPublicId = upload.public_id;
        formData.set("imageUrl", upload.url);
        formData.set("imagePublicId", upload.public_id);
      } else {
        formData.set("imageUrl", imageUrl);
        formData.set("imagePublicId", imagePublicId);
      }

      const result = category ? await updateCategory(category.id, formData) : await createCategory(formData);
      if (!result.success && uploadedPublicId) await ImageService.deleteImage(uploadedPublicId);
      if (result.success && category?.imagePublicId && category.imagePublicId !== (uploadedPublicId ?? imagePublicId)) {
        const removed = await ImageService.deleteImage(category.imagePublicId);
        if (!removed.success) result.message = "Cambios guardados, pero no se pudo borrar la imagen anterior de Cloudinary.";
      }
      setFieldErrors(result.fieldErrors ?? {});
      if (!result.success) setFormError(result.message ?? "No se pudo guardar.");
      onSave(result);
    });
  }

  return (
    <div className="categoryEditor__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section className="categoryEditor" role="dialog" aria-modal="true" aria-labelledby="categoryEditorTitle">
        <header className="categoryEditor__header">
          <div><p className="adminDashboard__eyebrow">{category ? "ACTUALIZAR" : "NUEVA EN EL CATÁLOGO"}</p><h2 id="categoryEditorTitle">{category ? "Editar categoría" : "Crear categoría"}</h2></div>
          <button type="button" className="categoryEditor__close" onClick={onClose} disabled={pending} aria-label="Cerrar">×</button>
        </header>
        <p className="categoryEditor__intro">Una buena categoría ayuda a encontrar rápido el disfraz ideal.</p>
        <form className="categoryEditor__form" onSubmit={submit} noValidate>
          <label className="categoryEditor__field">
            <span>Nombre <b>*</b></span>
            <input name="name" value={name} onChange={(event) => { const nextName = event.target.value; setName(nextName); if (!slugTouched) setSlug(slugify(nextName)); }} maxLength={80} required autoFocus placeholder="Ej.: Fiesta y celebración" aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "category-name-error" : undefined} />
            {fieldErrors.name && <small id="category-name-error">{fieldErrors.name}</small>}
          </label>
          <label className="categoryEditor__field">
            <span>Identificador de URL <b>*</b></span>
            <div className="categoryEditor__slugInput"><span>/</span><input name="slug" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(slugify(event.target.value)); }} maxLength={90} required placeholder="fiesta-y-celebracion" aria-invalid={Boolean(fieldErrors.slug)} aria-describedby={fieldErrors.slug ? "category-slug-help category-slug-error" : "category-slug-help"} /></div>
            <small id={fieldErrors.slug ? "category-slug-error" : "category-slug-help"}>{fieldErrors.slug ?? "Se usa en los enlaces públicos. Podés editarlo."}</small>
          </label>
          <label className="categoryEditor__field">
            <span>Descripción <em>Opcional</em></span>
            <textarea name="description" defaultValue={category?.description ?? ""} rows={3} maxLength={500} placeholder="Contá qué disfraces se agrupan acá…" />
            <small>Hasta 500 caracteres.</small>
          </label>
          <div className="categoryEditor__field">
            <span>Imagen de portada <em>Opcional</em></span>
            <div className="categoryEditor__imagePicker">
              <div className="categoryEditor__imagePreview">
                {(localPreviewUrl || imageUrl) ? <span style={{ backgroundImage: `url(${JSON.stringify(localPreviewUrl || imageUrl)})` }} /> : <span className="categoryEditor__imagePlaceholder">Vista previa</span>}
              </div>
              <div className="categoryEditor__imageControls">
                <label className="categoryEditor__fileButton">
                  {imageFile ? "Elegir otra imagen" : imageUrl ? "Reemplazar imagen" : "Elegir imagen"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} disabled={pending} />
                </label>
                {(imageUrl || imageFile) && <button className="categoryEditor__removeImage" type="button" onClick={clearImage} disabled={pending}>Quitar imagen</button>}
                <small>{imageFile ? "La imagen ajustada se subirá a Cloudinary al guardar." : "JPG, PNG o WebP · máximo 10 MB · podés reubicarla antes de subirla"}</small>
                {imageError && <small className="categoryEditor__imageError" role="alert">{imageError}</small>}
                {fieldErrors.imageUrl && <small className="categoryEditor__imageError">{fieldErrors.imageUrl}</small>}
              </div>
            </div>
            <input type="hidden" name="imageUrl" value={imageUrl} />
            <input type="hidden" name="imagePublicId" value={imagePublicId} />
          </div>
          <label className="categoryEditor__field categoryEditor__field--short">
            <span>Posición en el catálogo</span>
            <input name="sortOrder" type="number" min="0" max="9999" step="1" defaultValue={category?.sortOrder ?? 0} aria-invalid={Boolean(fieldErrors.sortOrder)} />
            {fieldErrors.sortOrder && <small>{fieldErrors.sortOrder}</small>}
          </label>
          {formError && <p className="categoryEditor__error" role="alert">{formError}</p>}
          <footer className="categoryEditor__footer">
            <button type="button" className="categoryEditor__cancel" onClick={onClose} disabled={pending}>Cancelar</button>
            <button type="submit" className="categoryAdmin__primary" disabled={pending}>{pending ? imageFile ? "Subiendo y guardando…" : "Guardando…" : category ? "Guardar cambios" : "Crear categoría"}</button>
          </footer>
        </form>
      </section>
      {cropSelection && <ImageCropper key={cropSelection.sourceUrl} file={cropSelection.file} sourceUrl={cropSelection.sourceUrl} aspectRatio={1} title="Ajustar imagen de categoría" onCancel={() => setCropSelection(null)} onApply={applyImageCrop} />}
    </div>
  );
}
