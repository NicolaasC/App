import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addItem,
  CART_STORAGE_KEY,
  estimatedSubtotal,
  itemCount,
  MAX_CART_LINES,
  parseStoredCart,
  removeItem,
  setQuantity,
} from "@/lib/cart/cart";
import { EMPTY_CART, type CartItem } from "@/lib/cart/types";

const item = (sku: string, unitPrice = 100000): Omit<CartItem, "addedAt" | "quantity"> => ({
  sku,
  snapshot: { productSlug: "p", name: "Producto", colorName: "Negro", size: 38, unitPrice, imageId: null },
});

describe("operaciones del carrito", () => {
  it("agrega y acumula sin superar existencias", () => {
    let r = addItem(EMPTY_CART, item("A"), 2, 3, 1);
    expect(r).toMatchObject({ added: 2, limited: false });
    r = addItem(r.state, item("A"), 2, 3, 2);
    expect(r).toMatchObject({ added: 1, limited: true });
    expect(r.state.items[0].quantity).toBe(3);
    r = addItem(r.state, item("A"), 1, 3, 3);
    expect(r).toMatchObject({ added: 0, limited: true });
  });

  it("respeta el máximo por línea aunque haya más existencias", () => {
    const r = addItem(EMPTY_CART, item("A"), 50, 100);
    expect(r.state.items[0].quantity).toBe(10);
  });

  it("no agrega variantes agotadas", () => {
    const r = addItem(EMPTY_CART, item("A"), 1, 0);
    expect(r.added).toBe(0);
    expect(r.state.items).toHaveLength(0);
  });

  it("modifica, elimina y calcula subtotales estimados", () => {
    let s = addItem(EMPTY_CART, item("A", 100000), 1, 5).state;
    s = addItem(s, item("B", 50000), 2, 5).state;
    expect(itemCount(s)).toBe(3);
    expect(estimatedSubtotal(s)).toBe(200000);
    s = setQuantity(s, "A", 3);
    expect(estimatedSubtotal(s)).toBe(400000);
    s = setQuantity(s, "B", 0);
    expect(s.items.map((i) => i.sku)).toEqual(["A"]);
    s = removeItem(s, "A");
    expect(s.items).toHaveLength(0);
  });

  it("limita el número de líneas", () => {
    let s = EMPTY_CART;
    for (let i = 0; i < MAX_CART_LINES; i++) s = addItem(s, item(`S${i}`), 1, 5).state;
    expect(addItem(s, item("EXTRA"), 1, 5).added).toBe(0);
  });
});

describe("persistencia", () => {
  it("tolera datos corruptos o manipulados", () => {
    expect(parseStoredCart(null)).toEqual(EMPTY_CART);
    expect(parseStoredCart("{no es json")).toEqual(EMPTY_CART);
    expect(parseStoredCart(JSON.stringify({ version: 2, items: [] }))).toEqual(EMPTY_CART);
    const valid = { sku: "A", quantity: 2, snapshot: item("A").snapshot, addedAt: 1 };
    const stored = JSON.stringify({
      version: 1,
      items: [valid, { ...valid }, { ...valid, sku: "B", quantity: 999 }, { sku: "C" }],
    });
    // Duplicados e inválidos se descartan.
    expect(parseStoredCart(stored).items.map((i) => i.sku)).toEqual(["A"]);
  });

  describe("almacén del navegador", () => {
    const storage = new Map<string, string>();
    beforeEach(() => {
      storage.clear();
      vi.resetModules();
      vi.stubGlobal("window", {
        localStorage: {
          getItem: (k: string) => storage.get(k) ?? null,
          setItem: (k: string, v: string) => storage.set(k, v),
        },
        addEventListener: () => {},
      });
    });
    afterEach(() => vi.unstubAllGlobals());

    it("guarda y recupera el carrito entre recargas", async () => {
      const store = await import("@/lib/cart/store");
      store.updateCart((s) => addItem(s, item("A"), 2, 5).state);
      expect(JSON.parse(storage.get(CART_STORAGE_KEY)!).items[0]).toMatchObject({ sku: "A", quantity: 2 });

      vi.resetModules(); // simula una recarga de página
      const reloaded = await import("@/lib/cart/store");
      expect(reloaded.getCart().items[0]).toMatchObject({ sku: "A", quantity: 2 });
    });

    it("sigue funcionando si localStorage falla", async () => {
      vi.stubGlobal("window", {
        localStorage: {
          getItem: () => {
            throw new Error("bloqueado");
          },
          setItem: () => {
            throw new Error("lleno");
          },
        },
        addEventListener: () => {},
      });
      const store = await import("@/lib/cart/store");
      expect(() => store.updateCart((s) => addItem(s, item("A"), 1, 5).state)).not.toThrow();
      expect(store.getCart().items).toHaveLength(1);
    });
  });
});
