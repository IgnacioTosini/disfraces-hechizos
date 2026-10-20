"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminToast from "@/components/admin/AdminToast";
import { validateImageFile } from "@/lib/image-upload-validation";
import { DEFAULT_HOME_PAGE_COPY, type HomeHeroContent, type HomePageCopy } from "@/lib/home-hero";
import type { StoreCatalogCostume } from "@/lib/store-catalog";
import HomePagePreview from "@/components/admin/HomePagePreview";
import { ImageService } from "@/services/ImageService";
import { saveHomeHeroContent, type HomeHeroActionResult } from "@/app/admin/inicio/actions";

type HeroFields = Omit<HomeHeroContent, "id" | "updatedAt" | "sections">;
type HeroFieldName = keyof HeroFields;
type HeroCopyField = Exclude<HeroFieldName, "imageUrl" | "imagePublicId">;
type CopyTextKey = Exclude<keyof HomePageCopy, "howSteps" | "faqItems" | "occasionAccess">;

export default function HomeHeroManager({ initialContent, costumes }: { initialContent: HomeHeroContent; costumes: StoreCatalogCostume[] }) {
  const router = useRouter();
  const [values, setValues] = useState<HeroFields>({
    eyebrow: initialContent.eyebrow,
    titleLineOne: initialContent.titleLineOne,
    titleLineTwo: initialContent.titleLineTwo,
    titleHighlight: initialContent.titleHighlight,
    description: initialContent.description,
    primaryCtaLabel: initialContent.primaryCtaLabel,
    secondaryCtaLabel: initialContent.secondaryCtaLabel,
    locationText: initialContent.locationText,
    imageUrl: initialContent.imageUrl,
    imagePublicId: initialContent.imagePublicId,
    imageAlt: initialContent.imageAlt,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pageCopy, setPageCopy] = useState<HomePageCopy>(initialContent.sections ?? DEFAULT_HOME_PAGE_COPY);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [localPreview, setLocalPreview] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => { if (localPreview) URL.revokeObjectURL(localPreview); };
  }, [localPreview]);

  function updateField(field: HeroFieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageError = validateImageFile(file);
    if (imageError) {
      setNotice(imageError);
      setNoticeIsError(true);
      event.target.value = "";
      return;
    }
    setImageFile(file);
    setLocalPreview(URL.createObjectURL(file));
    setNotice("");
  }

  function restoreCurrentImage() {
    setImageFile(null);
    setLocalPreview("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    formData.set("imageUrl", values.imageUrl);
    formData.set("imagePublicId", values.imagePublicId ?? "");
    formData.set("sections", JSON.stringify(pageCopy));
    let uploadedPublicId: string | null = null;

    try {
      if (imageFile) {
        setNotice("Optimizando y subiendo la imagen…");
        setNoticeIsError(false);
        const upload = await ImageService.uploadImage(imageFile, { folder: "contenido-inicio" });
        if (!upload.success) {
          setNotice(upload.error);
          setNoticeIsError(true);
          return;
        }
        uploadedPublicId = upload.public_id;
        formData.set("imageUrl", upload.url);
        formData.set("imagePublicId", upload.public_id);
      }

      const result = await saveHomeHeroContent(formData);
      if (!result.success && uploadedPublicId) await ImageService.deleteImage(uploadedPublicId);
      if (result.success && result.previousImagePublicId) {
        const removed = await ImageService.deleteImage(result.previousImagePublicId);
        if (!removed.success) result.message = "Cambios guardados; no se pudo borrar la imagen anterior de Cloudinary.";
      }

      showResult(result);
      if (!result.success) return;

      if (uploadedPublicId) {
        setValues((current) => ({ ...current, imageUrl: formData.get("imageUrl") as string, imagePublicId: uploadedPublicId }));
        setImageFile(null);
        setLocalPreview("");
      }
      router.refresh();
    } catch {
      if (uploadedPublicId) await ImageService.deleteImage(uploadedPublicId);
      setNotice("No se pudo guardar el contenido. Intentá nuevamente.");
      setNoticeIsError(true);
    } finally {
      setIsSaving(false);
    }
  }

  function showResult(result: HomeHeroActionResult) {
    setNotice(result.message ?? (result.success ? "Cambios guardados." : "Revisá los datos del formulario."));
    setNoticeIsError(!result.success);
    setFieldErrors(result.fieldErrors ?? {});
  }

  function field(id: HeroCopyField, label: string, maxLength: number, placeholder?: string, wide = false) {
    return (
      <label className={`heroEditor__field${wide ? " heroEditor__field--wide" : ""}`} key={id}>
        <span>{label}</span>
        <input
          name={id}
          value={values[id]}
          onChange={(event) => updateField(id, event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={Boolean(fieldErrors[id])}
          aria-describedby={fieldErrors[id] ? `${id}-error` : undefined}
        />
        {fieldErrors[id] && <small id={`${id}-error`} className="heroEditor__fieldError">{fieldErrors[id]}</small>}
      </label>
    );
  }

  function copyField(id: CopyTextKey, label: string, wide = false, multiline = false) {
    const value = pageCopy[id] as string;
    const control = multiline
      ? <textarea value={value} rows={3} maxLength={300} onChange={(event) => setPageCopy((current) => ({ ...current, [id]: event.target.value }))} />
      : <input value={value} maxLength={id === 'bannerText' ? 120 : 220} onChange={(event) => setPageCopy((current) => ({ ...current, [id]: event.target.value }))} />;
    return <label className={`heroEditor__field${wide ? ' heroEditor__field--wide' : ''}`} key={id}><span>{label}</span>{control}<small>{value.length} caracteres</small></label>;
  }

  if (showFullPreview) {
    return <section className="heroEditor heroEditor--fullPreview">
      <div className="homePreviewToolbar"><div><span>VISTA PREVIA</span><strong>Inicio completo</strong><small>Revisá los cambios antes de guardarlos.</small></div><div><button type="button" onClick={() => setShowFullPreview(false)}>← Volver a editar</button><button type="button" disabled={isSaving} onClick={() => document.getElementById('homeContentSave')?.click()}>{isSaving ? 'Guardando…' : 'Guardar cambios'}</button></div></div>
      <HomePagePreview content={{ ...initialContent, ...values, sections: pageCopy }} imageSrc={localPreview || values.imageUrl} costumes={costumes} />
      <form className="homePreviewSubmit" onSubmit={submit}>
        {Object.entries(values).map(([key, value]) => <input key={key} type="hidden" name={key} value={value ?? ''} />)}
        <input type="hidden" name="sections" value={JSON.stringify(pageCopy)} />
        <button id="homeContentSave" type="submit" disabled={isSaving} aria-hidden="true" tabIndex={-1} />
      </form>
    </section>;
  }

  return (
    <section className="heroEditor">
      <header className="heroEditor__header">
        <div>
          <p className="adminDashboard__eyebrow">PÁGINA DE INICIO</p>
          <h1>Contenido del inicio</h1>
          <p>Editá los textos de la página principal y revisá el resultado completo antes de publicarlo.</p>
        </div>
        <div className="heroEditor__headerActions"><button type="button" onClick={() => setShowFullPreview(true)}>Ver Home completo</button><span className="heroEditor__scope"><span aria-hidden="true">⌂</span> Textos del Home</span></div>
      </header>

      <AdminToast message={notice} isError={noticeIsError} onDismiss={() => setNotice("")} />

      <form className="heroEditor__layout" onSubmit={submit}>
        <aside className="heroEditor__previewColumn">
          <div className="heroEditor__previewHeading"><div><span>VISTA PREVIA</span><small>Así se verá en el inicio</small></div><span className="heroEditor__live"><i /> En vivo</span></div>
          <div className="heroEditor__preview">
            <Image src={localPreview || values.imageUrl} alt={values.imageAlt} fill sizes="(max-width: 900px) 100vw, 36vw" loading="eager" unoptimized={Boolean(localPreview)} />
            <div className="heroEditor__previewShade" />
            <div className="heroEditor__previewCopy">
              <span>{values.eyebrow || "Texto superior"}</span>
              <h2>{values.titleLineOne || "Título"}<br />{values.titleLineTwo} <em>{values.titleHighlight}</em></h2>
              <p>{values.description}</p>
            </div>
            <span className="heroEditor__previewPin" aria-hidden="true">✦</span>
          </div>

          <div className="heroEditor__imageControls">
            <div className="heroEditor__imageCopy"><strong>Imagen principal</strong><small>JPG, PNG o WebP · máximo 10 MB</small></div>
            <label className="heroEditor__fileButton">
              {imageFile ? "Cambiar imagen" : "Elegir imagen"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} disabled={isSaving} />
            </label>
            {imageFile && <button className="heroEditor__restore" type="button" onClick={restoreCurrentImage} disabled={isSaving}>Descartar</button>}
          </div>
          {imageFile && <p className="heroEditor__uploadHint">La vista previa es local. Se subirá a Cloudinary al guardar.</p>}
          {fieldErrors.imageUrl && <p className="heroEditor__fieldError" role="alert">{fieldErrors.imageUrl}</p>}
        </aside>

        <div className="heroEditor__fields">
          <div className="heroEditor__sectionHeading"><span>01</span><div><h2>Texto de portada</h2><p>El título conserva el destacado amarillo del diseño.</p></div></div>
          <div className="heroEditor__fieldGrid">
            {field("eyebrow", "Texto superior", 80, "Disfraces para cada ocasión", true)}
            {field("titleLineOne", "Título · primera línea", 50, "Hoy podés")}
            {field("titleLineTwo", "Título · segunda línea", 32, "ser")}
            {field("titleHighlight", "Frase destacada", 60, "quien quieras", true)}
            <label className="heroEditor__field heroEditor__field--wide">
              <span>Descripción</span>
              <textarea name="description" value={values.description} onChange={(event) => updateField("description", event.target.value)} rows={3} maxLength={360} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? "description-error" : undefined} />
              {fieldErrors.description && <small id="description-error" className="heroEditor__fieldError">{fieldErrors.description}</small>}
              <small className="heroEditor__counter">{values.description.length}/360</small>
            </label>
          </div>

          <div className="heroEditor__sectionHeading heroEditor__sectionHeading--secondary"><span>02</span><div><h2>Acciones e información</h2><p>Los destinos de los botones se mantienen conectados al sitio.</p></div></div>
          <div className="heroEditor__fieldGrid">
            {field("primaryCtaLabel", "Botón principal", 40, "Explorar disfraces")}
            {field("secondaryCtaLabel", "Botón secundario", 50, "Cómo funciona el alquiler")}
            {field("locationText", "Ubicación", 100, "Local en España 1744 · Mar del Plata", true)}
            {field("imageAlt", "Descripción accesible de la imagen", 180, "Describí brevemente la foto", true)}
          </div>

          <div className="heroEditor__sectionHeading heroEditor__sectionHeading--secondary"><span>03</span><div><h2>Secciones del inicio</h2><p>Estos textos no modifican categorías ni disfraces.</p></div></div>
          <details className="homeCopyGroup" open><summary>Banner superior y categorías</summary><div className="heroEditor__fieldGrid">
            {copyField('bannerText', 'Mensaje del banner', true)}
            {copyField('categoriesTitle', 'Título de categorías')}{copyField('categoriesDescription', 'Texto de categorías', true)}
          </div></details>
          <details className="homeCopyGroup"><summary>Selección e Instagram</summary><div className="heroEditor__fieldGrid">
            {copyField('featuredTitleLead', 'Título principal')}{copyField('featuredTitleHighlight', 'Texto destacado')}
            {copyField('featuredCta', 'Botón de catálogo')}{copyField('instagramTitle', 'Título de Instagram')}
            {copyField('instagramDescription', 'Descripción de Instagram', true)}{copyField('instagramAction', 'Enlace de Instagram')}
          </div></details>
          <details className="homeCopyGroup"><summary>Cómo funciona</summary><div className="heroEditor__fieldGrid">
            {copyField('howEyebrow', 'Rótulo')}{copyField('howTitle', 'Título')}{copyField('howDescription', 'Descripción', true, true)}
            {pageCopy.howSteps.map((step, index) => <div className="homeCopyItem" key={`step-${index}`}><strong>Paso {index + 1}</strong>
              <label className="heroEditor__field"><span>Título</span><input value={step.title} onChange={(event) => setPageCopy((current) => ({ ...current, howSteps: current.howSteps.map((item, i) => i === index ? { ...item, title: event.target.value } : item) }))} /></label>
              <label className="heroEditor__field"><span>Descripción</span><textarea rows={2} value={step.description} onChange={(event) => setPageCopy((current) => ({ ...current, howSteps: current.howSteps.map((item, i) => i === index ? { ...item, description: event.target.value } : item) }))} /></label>
            </div>)}
          </div></details>
          <details className="homeCopyGroup"><summary>Preguntas frecuentes</summary><div className="heroEditor__fieldGrid">
            {copyField('faqEyebrow', 'Rótulo')}{copyField('faqTitle', 'Título')}{copyField('faqDescription', 'Descripción', true, true)}
            {pageCopy.faqItems.map((item, index) => <div className="homeCopyItem" key={`faq-${index}`}><strong>Pregunta {index + 1}</strong>
              <label className="heroEditor__field"><span>Pregunta</span><input value={item.question} onChange={(event) => setPageCopy((current) => ({ ...current, faqItems: current.faqItems.map((faq, i) => i === index ? { ...faq, question: event.target.value } : faq) }))} /></label>
              <label className="heroEditor__field"><span>Respuesta</span><textarea rows={3} value={item.answer} onChange={(event) => setPageCopy((current) => ({ ...current, faqItems: current.faqItems.map((faq, i) => i === index ? { ...faq, answer: event.target.value } : faq) }))} /></label>
            </div>)}
          </div></details>
          <details className="homeCopyGroup"><summary>Pie de página</summary><div className="heroEditor__fieldGrid">
            {copyField('footerCtaTitle', 'Título del llamado a la acción', true)}{copyField('footerCtaDescription', 'Texto del llamado a la acción', true, true)}
            {copyField('footerCtaButton', 'Botón')}{copyField('footerAbout', 'Descripción del local', true, true)}
            {copyField('footerAddress', 'Dirección')}{copyField('footerMapLabel', 'Enlace de Maps')}
            {copyField('footerPhoneLabel', 'Etiqueta de teléfono')}{copyField('footerPhoneValue', 'Teléfono')}
            {copyField('footerHoursLabel', 'Etiqueta de horario')}{copyField('footerHoursValue', 'Horario')}
            {copyField('footerDisclaimer', 'Aviso del pie', true, true)}
          </div></details>

          <footer className="heroEditor__footer">
            <p>Podés revisar la página completa antes de guardar. Los productos y categorías se administran aparte.</p>
            <button type="button" className="heroEditor__previewButton" onClick={() => setShowFullPreview(true)}>Ver Home completo</button>
            <button type="submit" disabled={isSaving}>{isSaving ? "Guardando cambios…" : "Guardar cambios"}<span aria-hidden="true">→</span></button>
          </footer>
        </div>
      </form>
    </section>
  );
}
