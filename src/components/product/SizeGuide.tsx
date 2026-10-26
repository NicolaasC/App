"use client";

import { Ruler } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { footLengthCm } from "@/lib/catalog/sizes";

export function SizeGuide({ sizes }: { sizes: number[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 hover:decoration-2"
        aria-haspopup="dialog"
      >
        <Ruler className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Guía de tallas
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Guía de tallas">
        <div className="space-y-5 text-sm">
          <p className="text-ink/80">
            Usamos numeración europea (EU). Mide tu pie de pie, del talón a la punta del dedo más largo, y elige la
            talla cuya longitud sea igual o ligeramente mayor.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left tabular-nums">
              <caption className="sr-only">Equivalencia aproximada entre talla y longitud de pie</caption>
              <thead>
                <tr className="border-b border-ink text-xs uppercase tracking-[0.1em] text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Talla EU</th>
                  <th scope="col" className="py-2 font-medium">Pie aprox. (cm)</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((s) => (
                  <tr key={s} className="border-b border-line">
                    <td className="py-2 pr-4">{s}</td>
                    <td className="py-2">{footLengthCm(s).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="rounded-sm bg-sand-soft p-3 text-xs text-ink/80">
            Las equivalencias son orientativas y pueden variar según el fabricante, la horma y el modelo. Cuando
            tengamos la tabla oficial de cada proveedor la mostraremos aquí.
          </p>
        </div>
      </Modal>
    </>
  );
}
