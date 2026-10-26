"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  /** Oculta visualmente el título (sigue disponible para lectores de pantalla). */
  hideTitle?: boolean;
}

export function Modal({ open, onClose, title, children, className, hideTitle }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
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
        "m-auto w-[min(40rem,calc(100vw-2rem))] max-h-[min(44rem,calc(100dvh-2rem))] rounded-sm bg-ivory p-0 text-ink backdrop:bg-ink/30 backdrop:animate-fade-in animate-fade-in",
        className,
      )}
    >
      {open ? (
        <div className="relative p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 className={cn("font-serif text-3xl", hideTitle && "sr-only")}>{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-1 ml-auto inline-flex size-10 items-center justify-center rounded-sm hover:bg-sand-soft"
              aria-label="Cerrar"
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
