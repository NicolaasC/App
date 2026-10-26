# Estado del proyecto

Última actualización: 26-oct-2026.

## Completado

- **Base**: Next.js 16.4 (App Router, Cache Components), TypeScript estricto, Tailwind 4 con tokens,
  componentes reutilizables (botones, campos, paneles laterales, modales, notificaciones, estados vacíos y de carga).
- **Tienda**: inicio editorial configurable, header y menú móvil, búsqueda, categorías (solo con productos),
  destacados, novedades, colecciones derivadas del catálogo, bloque editorial, beneficios (ocultos hasta tener
  condiciones reales), boletín (sin falso éxito), footer, páginas informativas y legales en borrador, 404 y errores.
- **Catálogo**: 23 productos demo en 6 categorías, filtros combinables (categoría, género, talla, color, precio,
  existencias, colección), búsqueda, 4 ordenamientos, URL compartible con historial, panel móvil.
- **Producto**: galería por color, variantes color+talla con stock por variante, tallas agotadas bloqueadas,
  cantidad limitada, guía de tallas con advertencia, materiales marcados como no verificados, envíos/cambios,
  relacionados, créditos de foto.
- **Carrito y checkout**: carrito persistente, recalculado y corregido por el servidor; checkout con campos
  colombianos, validación en español, envío por zona (demo) y total en servidor; idempotencia.
- **Backend**: esquema PostgreSQL/Supabase con RLS, pedidos transaccionales, pagos Wompi (firma de integridad,
  webhook verificado e idempotente), página de pedido con token, vencimiento programado.
- **Calidad**: 66 pruebas, 13 recorridos e2e, Lighthouse medido (ver `docs/pruebas.md`).

## Modos de funcionamiento

| Configuración | Comportamiento |
| --- | --- |
| Por defecto (sin variables) | Catálogo demo; checkout valida y calcula, **no crea pedidos ni cobra** |
| `DATABASE_URL` + `CATALOG_SOURCE=supabase` + Wompi + `ORDER_TOKEN_SECRET` | Pedidos reales y redirección a Wompi |

## Decisiones e información que necesito del negocio

1. **Marca**: nombre, logotipo, tono, texto "Nosotros". (Hoy: "Calzado Estudio", provisional en `src/config/site.ts`.)
2. **Fotografías**: autorizar el acceso de red a `unsplash.com` e `images.unsplash.com` para descargar y revisar
   las fotos demo, o entregar fotografía propia.
3. **Inventario real**: productos, tallas (¿numeración EU o colombiana?), colores, precios con IVA, existencias,
   materiales verificados y tablas de tallas del proveedor.
4. **Pagos**: confirmar Wompi (recomendado) o Mercado Pago, y crear cuenta sandbox.
5. **Logística**: transportadora, cobertura, tarifas, tiempos, envío gratis, reglas Bogotá vs. resto del país.
6. **Legal**: razón social, NIT, dirección, canales de atención, políticas (cambios, retracto, reversión,
   garantía, privacidad, términos) revisadas por un abogado.
7. **Infraestructura**: GitHub (`NicolaasC/App`) y Vercel (`tienda-calzado`) listos. Falta: proyectos Supabase
   (staging/producción), cuenta Wompi y dominio.
8. **Presupuesto**: define plan de Vercel (frecuencia de cron), Supabase (backups) y si se construye el panel
   administrativo ahora.

## Pendiente técnico (por prioridad)

1. Descargar y revisar visualmente las fotos (bloqueado por red) o sustituirlas.
2. Panel administrativo con Supabase Auth (`docs/administracion.md`).
3. Guardar suscripciones al boletín en `newsletter_subscriptions` (tabla lista; falta la escritura).
4. Correo transaccional de confirmación de pedido (proveedor por definir).
5. Conciliación periódica con la API de Wompi; confirmar parámetros del Web Checkout.
6. Límite de frecuencia compartido; Content-Security-Policy; monitoreo de errores.
7. Con catálogo en base de datos: invalidar caché (`revalidateTag("catalog")`) al editar productos y 404 real
   para slugs desconocidos (hoy 404 "suave" con `noindex`).
8. Datos estructurados `Product` solo cuando haya productos reales (implementado, desactivado en demo).
