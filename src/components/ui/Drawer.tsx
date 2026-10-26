"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Panel lateral sobre <dialog> nativo: bloqueo de foco, Escape y fondo
 * inerte los aporta el navegador.
 */
export function Drawer({ open, onClose, title, side = "right", children, footer, className }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "fixed inset-y-0 m-0 h-dvh max-h-dvh w-[min(26rem,100vw)] max-w-none bg-canvas p-0 text-ink backdrop:bg-black/65 backdrop:animate-fade-in",
        side === "right" ? "left-auto right-0 animate-slide-in-right" : "left-0 right-auto animate-slide-in-left",
        className,
      )}
    >
      {open ? (
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.14em]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 inline-flex size-10 items-center justify-center rounded-sm hover:bg-tone-soft"
              aria-label="Cerrar"
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer ? <div className="shrink-0 border-t border-line bg-canvas p-5">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}
