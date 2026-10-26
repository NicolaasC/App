"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface QuantitySelectorProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md";
}

export function QuantitySelector({ value, max, onChange, disabled, label = "Cantidad", size = "md" }: QuantitySelectorProps) {
  const h = size === "sm" ? "h-9" : "h-12";
  const w = size === "sm" ? "w-9" : "w-11";
  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center rounded-sm border border-line-strong bg-paper", h)}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        className={cn("inline-flex h-full items-center justify-center disabled:opacity-35", w)}
        aria-label="Disminuir cantidad"
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="w-8 text-center text-sm tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        className={cn("inline-flex h-full items-center justify-center disabled:opacity-35", w)}
        aria-label="Aumentar cantidad"
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
