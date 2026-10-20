"use client";

import { useEffect, useRef } from "react";

export default function AdminToast({ message, isError, onDismiss }: { message: string; isError: boolean; onDismiss: () => void }) {
  const dismissRef = useRef(onDismiss);

  useEffect(() => { dismissRef.current = onDismiss; }, [onDismiss]);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => dismissRef.current(), 4200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message) return null;
  return <div key={message} className={`adminToast${isError ? " adminToast--error" : " adminToast--success"}`} role={isError ? "alert" : "status"} aria-live={isError ? "assertive" : "polite"}>
    <span className="adminToast__icon" aria-hidden="true">{isError ? "!" : "✓"}</span>
    <p>{message}</p>
    <button type="button" onClick={onDismiss} aria-label="Cerrar notificación">×</button>
    <span className="adminToast__progress" aria-hidden="true" />
  </div>;
}
