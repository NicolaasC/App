"use client";

import { useSyncExternalStore } from "react";
import { CART_STORAGE_KEY, parseStoredCart } from "./cart";
import { EMPTY_CART, type CartState } from "./types";

/**
 * Almacén del carrito en el navegador (localStorage + sincronización entre
 * pestañas). Sin dependencias externas.
 */
type Listener = () => void;

const listeners = new Set<Listener>();
let state: CartState = EMPTY_CART;
let hydrated = false;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    state = parseStoredCart(storage()?.getItem(CART_STORAGE_KEY) ?? null);
  } catch {
    // Almacenamiento bloqueado (p. ej. modo privado): carrito solo en memoria.
    state = EMPTY_CART;
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== CART_STORAGE_KEY) return;
    state = parseStoredCart(event.newValue);
    listeners.forEach((l) => l());
  });
}

export function getCart(): CartState {
  hydrate();
  return state;
}

export function updateCart(updater: (current: CartState) => CartState) {
  hydrate();
  const next = updater(state);
  if (next === state) return;
  state = next;
  try {
    storage()?.setItem(CART_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Almacenamiento lleno o bloqueado: el carrito sigue en memoria esta sesión.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Estado del carrito; en el servidor y en el primer render es un carrito vacío. */
export function useCart(): CartState {
  return useSyncExternalStore(subscribe, getCart, () => EMPTY_CART);
}

/** true una vez que el carrito guardado se ha leído en el cliente. */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
