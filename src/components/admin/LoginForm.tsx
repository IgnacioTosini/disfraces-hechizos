"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "No se pudo iniciar sesión.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="adminLogin__form" onSubmit={handleSubmit}>
      <label htmlFor="admin-password">Contraseña</label>
      <div className="adminLogin__passwordField">
        <input
          id="admin-password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "admin-login-error" : undefined}
          required
        />
        <button
          className="adminLogin__visibility"
          type="button"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((visible) => !visible)}
        >
          {showPassword ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.4 9.5 6.1a1.7 1.7 0 0 1 0 1.8 13 13 0 0 1-3.1 3.5M6.2 6.2a14 14 0 0 0-3.7 4.9 1.7 1.7 0 0 0 0 1.8C3.5 14.6 7 19 12 19c.7 0 1.3-.1 1.9-.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          )}
        </button>
      </div>
      {error && <p id="admin-login-error" className="adminLogin__error" role="alert">{error}</p>}
      <button className="adminLogin__submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Ingresando…" : "Ingresar al panel"}</span>
        {!isSubmitting && <span className="adminLogin__submitArrow" aria-hidden="true">→</span>}
        {isSubmitting && <span className="adminLogin__spinner" aria-hidden="true" />}
      </button>
    </form>
  );
}
