/**
 * Longitud de pie aproximada por talla EU (punto París: talla ≈ 1,5 × horma;
 * horma ≈ pie + 1,5 cm). Referencia general, no una tabla de fabricante.
 */
export function footLengthCm(euSize: number): number {
  return Math.round((euSize / 1.5 - 1.5) * 10) / 10;
}
