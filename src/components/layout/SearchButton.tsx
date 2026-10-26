"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-sm hover:bg-tone-soft"
        aria-label="Buscar"
        aria-haspopup="dialog"
      >
        <Search className="size-5" strokeWidth={1.5} aria-hidden="true" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Buscar en la tienda">
        <form
          role="search"
          action="/catalogo"
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
            setOpen(false);
            router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo");
          }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          <label htmlFor="busqueda-global" className="sr-only">
            Buscar productos
          </label>
          <input
            id="busqueda-global"
            name="q"
            type="search"
            autoFocus
            maxLength={80}
            placeholder="Botas, sneakers, sandalias…"
            className="h-12 flex-1 rounded-sm border border-line-strong bg-paper px-4 text-base placeholder:text-stone focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink"
          />
          <Button type="submit" size="lg">
            Buscar
          </Button>
        </form>
      </Modal>
    </>
  );
}
