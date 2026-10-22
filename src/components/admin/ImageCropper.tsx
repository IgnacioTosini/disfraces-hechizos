"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import "./_image-cropper.scss";

type ImageCropperProps = {
  file: File;
  sourceUrl: string;
  aspectRatio: number;
  title: string;
  onCancel: () => void;
  onApply: (file: File) => void;
};

export default function ImageCropper({ file, sourceUrl, aspectRatio, title, onCancel, onApply }: ImageCropperProps) {
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointerRef = useRef<{ id: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(stage);
    return () => observer.disconnect();
  }, [sourceUrl]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button, input")?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !processing) onCancel(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onCancel, processing]);

  const baseScale = naturalSize.width && stageSize.width
    ? Math.max(stageSize.width / naturalSize.width, stageSize.height / naturalSize.height)
    : 0;
  const renderedWidth = naturalSize.width * baseScale * zoom;
  const renderedHeight = naturalSize.height * baseScale * zoom;

  function clampOffset(x: number, y: number) {
    const maxX = Math.max(0, (renderedWidth - stageSize.width) / 2);
    const maxY = Math.max(0, (renderedHeight - stageSize.height) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!stageRef.current || !naturalSize.width) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = pointerRef.current;
    if (!start || start.id !== event.pointerId) return;
    setOffset(clampOffset(start.offsetX + event.clientX - start.x, start.offsetY + event.clientY - start.y));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerRef.current?.id === event.pointerId) pointerRef.current = null;
  }

  function updateZoom(value: number) {
    setZoom(value);
    const width = naturalSize.width * baseScale * value;
    const height = naturalSize.height * baseScale * value;
    const maxX = Math.max(0, (width - stageSize.width) / 2);
    const maxY = Math.max(0, (height - stageSize.height) / 2);
    setOffset((current) => ({ x: Math.min(maxX, Math.max(-maxX, current.x)), y: Math.min(maxY, Math.max(-maxY, current.y)) }));
  }

  async function applyCrop() {
    const image = imageRef.current;
    if (!image || !stageSize.width || !naturalSize.width) return;
    setProcessing(true);
    setError("");
    try {
      const scale = baseScale * zoom;
      const imageLeft = (stageSize.width - renderedWidth) / 2 + offset.x;
      const imageTop = (stageSize.height - renderedHeight) / 2 + offset.y;
      const sourceX = Math.max(0, -imageLeft / scale);
      const sourceY = Math.max(0, -imageTop / scale);
      const sourceWidth = Math.min(naturalSize.width - sourceX, stageSize.width / scale);
      const sourceHeight = Math.min(naturalSize.height - sourceY, stageSize.height / scale);
      const outputScale = Math.min(1, 1600 / sourceWidth, 1600 / sourceHeight);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sourceWidth * outputScale));
      canvas.height = Math.max(1, Math.round(sourceHeight * outputScale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo preparar la imagen.");
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("No se pudo recortar la imagen.")), file.type, .92));
      const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      const name = file.name.replace(/\.[^.]+$/, "") || "imagen";
      onApply(new File([blob], `${name}-recortada.${extension}`, { type: blob.type, lastModified: Date.now() }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo recortar la imagen.");
    } finally {
      setProcessing(false);
    }
  }

  return <div className="imageCropper__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !processing) onCancel(); }}>
    <section className="imageCropper" role="dialog" aria-modal="true" aria-labelledby="imageCropperTitle" ref={dialogRef}>
      <header><div><p>PREPARAR IMAGEN</p><h2 id="imageCropperTitle">{title}</h2></div><button type="button" onClick={onCancel} disabled={processing} aria-label="Cerrar editor">×</button></header>
      <p className="imageCropper__help">Arrastrá la imagen para ubicarla y usá el control para acercar o alejar.</p>
      <div className="imageCropper__stageWrap"><div
        className="imageCropper__stage"
        style={{ aspectRatio, maxWidth: `min(48rem, ${55 * aspectRatio}dvh)` }}
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {sourceUrl && <Image ref={imageRef} src={sourceUrl} alt="Vista previa para recortar" unoptimized width={naturalSize.width || 1} height={naturalSize.height || 1} draggable={false} onLoad={(event) => setNaturalSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} style={{ width: renderedWidth, height: renderedHeight, left: `calc(50% + ${offset.x}px)`, top: `calc(50% + ${offset.y}px)` }} />}
        {!naturalSize.width && <span className="imageCropper__loading">Cargando imagen…</span>}
      </div></div>
      <label className="imageCropper__zoom"><span>Zoom</span><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => updateZoom(Number(event.target.value))} disabled={!naturalSize.width || processing} /><output>{Math.round(zoom * 100)}%</output></label>
      <p className="imageCropper__hint">La imagen se recortará en esta proporción y recién se subirá a Cloudinary al guardar.</p>
      {error && <p className="imageCropper__error" role="alert">{error}</p>}
      <footer><button type="button" onClick={onCancel} disabled={processing}>Cancelar</button><button type="button" onClick={() => void applyCrop()} disabled={!naturalSize.width || processing}>{processing ? "Preparando…" : "Usar esta imagen"}</button></footer>
    </section>
  </div>;
}
