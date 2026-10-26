import type { Category } from "@/lib/catalog/types";

export const demoCategories: Category[] = [
  {
    slug: "sneakers",
    name: "Sneakers",
    description: "Tenis para la ciudad, el día a día y el fin de semana.",
    position: 1,
  },
  {
    slug: "casual",
    name: "Casual",
    description: "Mocasines, náuticos y zapatos cómodos para todos los días.",
    position: 2,
  },
  {
    slug: "formal",
    name: "Formal",
    description: "Zapatos de vestir para la oficina y las ocasiones especiales.",
    position: 3,
  },
  {
    slug: "botas",
    name: "Botas",
    description: "Botas y botines para la lluvia, el frío y el estilo urbano.",
    position: 4,
  },
  {
    slug: "sandalias",
    name: "Sandalias",
    description: "Sandalias para clima cálido, viajes y descanso.",
    position: 5,
  },
  {
    slug: "otros",
    name: "Otros estilos",
    description: "Modelos que no encajan en una sola categoría.",
    position: 6,
  },
];
