/** Bogotá D. C. y los 32 departamentos de Colombia. */
export const BOGOTA = "Bogotá D. C.";

export const COLOMBIA_DEPARTMENTS = [
  BOGOTA,
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés, Providencia y Santa Catalina",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const;

export type Department = (typeof COLOMBIA_DEPARTMENTS)[number];

export function isDepartment(value: string): value is Department {
  return (COLOMBIA_DEPARTMENTS as readonly string[]).includes(value);
}

/**
 * Normaliza un teléfono colombiano a 10 dígitos (celular 3XX o fijo 60X).
 * Acepta espacios, guiones y prefijo +57. Devuelve null si no es válido.
 */
export function normalizeColombianPhone(input: string): string | null {
  let digits = input.replace(/[\s().-]/g, "");
  if (digits.startsWith("+57")) digits = digits.slice(3);
  else if (digits.startsWith("57") && digits.length === 12) digits = digits.slice(2);
  return /^(3\d{9}|60\d{8})$/.test(digits) ? digits : null;
}
