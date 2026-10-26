const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const copFormatterWithCents = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea pesos colombianos. Sin decimales cuando el valor es entero. */
export function formatCOP(value: number): string {
  if (!Number.isFinite(value)) throw new RangeError("Precio inválido");
  return Number.isInteger(value) ? copFormatter.format(value) : copFormatterWithCents.format(value);
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
