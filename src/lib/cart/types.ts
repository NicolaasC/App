/**
 * Carrito de invitado. Se guarda en localStorage solo para recordar la
 * selección; precio y existencias SIEMPRE se recalculan en el servidor.
 */
export interface CartItem {
  sku: string;
  quantity: number;
  /** Datos de presentación capturados al agregar. No son fuente de verdad. */
  snapshot: {
    productSlug: string;
    name: string;
    colorName: string;
    size: number;
    unitPrice: number;
    imageId: string | null;
  };
  addedAt: number;
}

export interface CartState {
  version: 1;
  items: CartItem[];
}

export const EMPTY_CART: CartState = { version: 1, items: [] };
