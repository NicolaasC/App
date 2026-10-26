import { NextResponse, type NextRequest } from "next/server";
import { demoProducts } from "@/data/demo/products";

/**
 * Con Partial Prerendering, `notFound()` en una ruta dinámica no prerenderizada
 * se ejecuta cuando la respuesta ya empezó (200 + noindex). Este proxy
 * responde 404 real antes de renderizar:
 *  - Siempre para slugs con formato inválido.
 *  - Con el catálogo de demostración, también para slugs que no existen.
 * Con CATALOG_SOURCE=supabase los slugs desconocidos quedan como 404 "suave"
 * (página de no encontrado + noindex) para no consultar la BD en cada petición.
 */
const SLUG = /^[a-z0-9-]{1,120}$/;
const useDemo = (process.env.CATALOG_SOURCE ?? "demo") === "demo";
const productSlugs = new Set(demoProducts.filter((p) => p.status === "published").map((p) => p.slug));
const categorySlugs = new Set(demoProducts.filter((p) => p.status === "published").map((p) => p.category));

function notFound(request: NextRequest) {
  return NextResponse.rewrite(new URL("/__no-encontrado", request.url), { status: 404 });
}

export function proxy(request: NextRequest) {
  const [, section, slug] = request.nextUrl.pathname.split("/");
  if (!slug || !SLUG.test(slug)) return notFound(request);
  if (useDemo) {
    if (section === "producto" && !productSlugs.has(slug)) return notFound(request);
    if (section === "catalogo" && !categorySlugs.has(slug as never)) return notFound(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/producto/:slug", "/catalogo/:slug"],
};
