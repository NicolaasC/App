"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

interface ToastData {
  id: number;
  tone: "success" | "error" | "info";
  message: string;
  action?: { label: string; href: string };
}

const ToastContext = createContext<((toast: Omit<ToastData, "id">) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (toast: Omit<ToastData, "id">) => {
      const id = ++counter.current;
      setToasts((list) => [...list.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm animate-fade-in items-start gap-3 rounded-sm bg-ink px-4 py-3.5 text-sm text-paper shadow-[0_8px_30px_-12px_rgb(38_38_34/0.5)]"
          >
            {t.tone === "error" ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
            )}
            <div className="flex-1">
              <p>{t.message}</p>
              {t.action ? (
                <Link href={t.action.href} className="mt-1 inline-block underline underline-offset-4">
                  {t.action.label}
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-m-1 rounded-sm p-1 opacity-70 hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
