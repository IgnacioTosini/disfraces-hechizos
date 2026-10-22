"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminToast from "@/components/admin/AdminToast";
import ImageCropper from "@/components/admin/ImageCropper";
import { saveOccasionAccess, type OccasionAccessActionResult } from "@/app/admin/ocasiones/actions";
import { validateImageFile } from "@/lib/image-upload-validation";
import type { CostumeFinderOption } from "@/lib/costume-finder-settings";
import type { OccasionAccess, OccasionAccessCard } from "@/lib/occasion-access";
import { ImageService } from "@/services/ImageService";
import "./_admin-occasion-access.scss";

type OccasionId = OccasionAccessCard["id"];

export default function OccasionAccessManager({ initialCards, options }: { initialCards: OccasionAccess; options: CostumeFinderOption[] }) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [files, setFiles] = useState<Partial<Record<OccasionId, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<OccasionId, string>>>({});
  const [cropSelection, setCropSelection] = useState<{ file: File; id: OccasionId; sourceUrl: string } | null>(null);
  const previewUrls = useRef<string[]>([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);
  useEffect(() => () => { if (cropSelection?.sourceUrl) URL.revokeObjectURL(cropSelection.sourceUrl); }, [cropSelection?.sourceUrl]);

  function updateCard(id: OccasionId, update: Partial<OccasionAccessCard>) {
    setCards((current) => current.map((card) => card.id === id ? { ...card, ...update } : card));
  }

  function toggleTag(card: OccasionAccessCard, tag: string) {
    const tags = card.tags.includes(tag) ? card.tags.filter((value) => value !== tag) : [...card.tags, tag];
    updateCard(card.id, { tags });
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>, id: OccasionId) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      setMessage(error);
      setIsError(true);
      event.target.value = "";
      return;
    }
    setCropSelection({ file, id, sourceUrl: URL.createObjectURL(file) });
    setMessage("");
  }

  function applyImageCrop(file: File) {
    if (!cropSelection) return;
    const url = URL.createObjectURL(file);
    previewUrls.current.push(url);
    setFiles((current) => ({ ...current, [cropSelection.id]: file }));
    setPreviews((current) => ({ ...current, [cropSelection.id]: url }));
    setCropSelection(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    const uploaded: string[] = [];
    const nextCards: OccasionAccess = [];
    try {
      for (const card of cards) {
        const file = files[card.id];
        if (!file) {
          nextCards.push(card);
          continue;
        }
        setMessage(`Subiendo imagen de ${card.title}…`);
        const result = await ImageService.uploadImage(file, { folder: "ocasiones" });
        if (!result.success) {
          await Promise.all(uploaded.map((publicId) => ImageService.deleteImage(publicId)));
          setMessage(result.error);
          setIsError(true);
          return;
        }
        uploaded.push(result.public_id);
        nextCards.push({ ...card, imageUrl: result.url, imagePublicId: result.public_id });
      }

      const formData = new FormData();
      formData.set("cards", JSON.stringify(nextCards));
      const result = await saveOccasionAccess(formData);
      if (!result.success) {
        await Promise.all(uploaded.map((publicId) => ImageService.deleteImage(publicId)));
        showResult(result);
        return;
      }

      const cleanup = await Promise.all((result.previousImagePublicIds ?? []).map((publicId) => ImageService.deleteImage(publicId)));
      setCards(nextCards);
      setFiles({});
      setPreviews({});
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current = [];
      showResult({ ...result, message: cleanup.some((item) => !item.success) ? "Cambios guardados; alguna imagen anterior no se pudo borrar de Cloudinary." : result.message });
      router.refresh();
    } catch {
      await Promise.all(uploaded.map((publicId) => ImageService.deleteImage(publicId)));
      setMessage("No se pudieron guardar los cambios. Intentá de nuevo.");
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  }

  function showResult(result: OccasionAccessActionResult) {
    setMessage(result.message);
    setIsError(!result.success);
  }

  return <section className="occasionAdmin">
    <header className="occasionAdmin__header"><div><p className="adminDashboard__eyebrow">PÁGINA DE INICIO</p><h1>Accesos por ocasión</h1><p>Personalizá las tarjetas que aparecen en el Home. Cada una lleva al catálogo con las etiquetas elegidas.</p></div></header>
    <AdminToast message={message} isError={isError} onDismiss={() => setMessage("")} />
    {!options.length && <p className="occasionAdmin__notice">Primero configurá etiquetas en <a href="/admin/asistente">Asistente de búsqueda</a>.</p>}
    <form className="occasionAdmin__grid" onSubmit={submit}>
      {cards.map((card, index) => <article className="occasionAdmin__card" key={card.id}>
        <div className="occasionAdmin__cardHeading"><span>0{index + 1}</span><div><h2>{card.title}</h2><small>Tarjeta de ocasión</small></div></div>
        <div className="occasionAdmin__image">
          <Image src={previews[card.id] ?? card.imageUrl} alt={card.imageAlt} fill sizes="(max-width: 700px) 100vw, 30vw" unoptimized={Boolean(previews[card.id])} />
          <label> Cambiar imagen <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectImage(event, card.id)} disabled={isSaving} /></label>
        </div>
        <div className="occasionAdmin__fields">
          <label><span>Título</span><input value={card.title} onChange={(event) => updateCard(card.id, { title: event.target.value })} maxLength={60} required /></label>
          <label><span>Descripción</span><textarea value={card.description} onChange={(event) => updateCard(card.id, { description: event.target.value })} maxLength={140} rows={2} required /></label>
          <label><span>Texto alternativo de la imagen</span><input value={card.imageAlt} onChange={(event) => updateCard(card.id, { imageAlt: event.target.value })} maxLength={180} required /></label>
        </div>
        <fieldset className="occasionAdmin__tags"><legend>Etiquetas que mostrarán disfraces</legend><div>{options.map((option) => <label key={option.id}><input type="checkbox" checked={card.tags.includes(option.id)} onChange={() => toggleTag(card, option.id)} /><span>{option.label}</span></label>)}</div></fieldset>
      </article>)}
      <footer className="occasionAdmin__footer"><p>Podés reubicar cada imagen antes de guardarla; se suben a Cloudinary al guardar.</p><button className="categoryAdmin__primary" type="submit" disabled={isSaving || !options.length}>{isSaving ? "Guardando…" : "Guardar accesos"}</button></footer>
    </form>
    {cropSelection && <ImageCropper key={cropSelection.sourceUrl} file={cropSelection.file} sourceUrl={cropSelection.sourceUrl} aspectRatio={2} title="Ajustar imagen de ocasión" onCancel={() => setCropSelection(null)} onApply={applyImageCrop} />}
  </section>;
}
