# Seguridad, privacidad y requisitos legales

> Esto no es asesoría legal. La tienda **no** debe considerarse conforme a la normativa hasta que un abogado
> revise los textos y procesos.

## Controles implementados

| Control | Dónde |
| --- | --- |
| Validación de entradas en servidor (zod) | `src/lib/validation/checkout.ts`, Server Actions |
| Precios, stock, envío y total recalculados en servidor | `src/server/pricing/quote.ts`, repositorio de pedidos |
| Reserva de stock transaccional con bloqueo de filas | `src/server/orders/postgres-repository.ts` |
| Idempotencia de pedidos y eventos de pago | `idempotency_key` único, `payment_events` único |
| Verificación de firma de webhooks en tiempo constante | `src/server/payments/wompi.ts` |
| Acceso al pedido solo con token (hash SHA-256 en BD) | `/pedido`, `src/server/orders/tokens.ts` |
| RLS: público solo lee catálogo publicado | migración inicial |
| Secretos solo en servidor (`server-only`) | `src/server/env.ts`, `.env.example` |
| Límite de frecuencia básico (por instancia) | `src/server/rate-limit.ts` |
| Cabeceras: nosniff, frame DENY, referrer, permissions | `next.config.ts` |
| Logs sin datos personales | acciones y webhook registran solo mensajes/IDs |
| No se almacenan datos de tarjeta | pago en checkout alojado por Wompi |
| 404 reales y `noindex` en demo | `src/proxy.ts`, `robots.ts`, metadatos |

### Pendientes de seguridad
- Límite de frecuencia compartido (Postgres/Redis) en lugar de memoria por instancia.
- Content-Security-Policy (requiere revisar los dominios de Wompi y analítica que se usen).
- Autenticación de administración (ver `docs/administracion.md`).
- Conciliación periódica con la API de Wompi.
- Monitoreo/alertas de errores (p. ej. Sentry) y de pedidos `needs_review`.

## Marco colombiano a revisar (referencias)

- **Protección de datos personales**: Ley 1581 de 2012 y Decreto 1377 de 2013 (compilado en el Decreto 1074
  de 2015). Requiere política de tratamiento, autorización previa y expresa, aviso de privacidad, canal de
  consultas y reclamos y, si aplica, registro en el RNBD ante la SIC. El boletín pide consentimiento explícito
  y está desactivado hasta tener base de datos (no se guarda nada).
- **Protección al consumidor**: Ley 1480 de 2011 — información de producto y precio (con impuestos),
  identidad del vendedor en ventas a distancia (art. 50), **derecho de retracto** (art. 47) y **reversión del
  pago** (art. 51, reglamentado en el Decreto 1074 de 2015; el MinCIT tiene un proyecto de modificación en
  curso: verificar su estado).
- **Comercio electrónico**: Ley 527 de 1999 (mensajes de datos y validez de contratos electrónicos).
- Facturación electrónica DIAN, régimen tributario e IVA: definir con contador.

## Información que falta del negocio

Razón social y NIT, dirección para notificaciones, canales y horarios de atención, políticas de cambios,
devoluciones y garantías, procedimiento de retracto y reversión, términos y condiciones, política de
privacidad aprobada, responsable del tratamiento de datos.
