# Pagos

## Proveedor recomendado: Wompi

Recomendación provisional: **Wompi** (Bancolombia) por su Web Checkout alojado — la tienda nunca recibe datos
de tarjeta —, cobertura de medios locales y webhooks firmados. Mercado Pago es la alternativa evaluada; la
arquitectura (`PaymentEvent` normalizado en `src/server/orders/types.ts`) permite añadir otro proveedor.

Antes de contratar, confirmar con cada proveedor: comisiones vigentes, medios de pago habilitados, tiempos de
dispersión, requisitos de vinculación (RUT, cámara de comercio, cuenta bancaria) y condiciones de contracargos.
**No se ha contratado ni configurado ninguna cuenta.**

## Implementación (src/server/payments/wompi.ts)

Basada en la documentación pública de Wompi Colombia consultada el 26-oct-2026
([eventos](https://docs.wompi.co/en/docs/colombia/eventos/)). Verificar contra la versión vigente.

- **Firma de integridad**: `SHA-256(referencia + monto_en_centavos + "COP" [+ expiración] + secreto_de_integridad)`,
  calculada en el servidor.
- **Redirección**: `https://checkout.wompi.co/p/` con `public-key`, `currency`, `amount-in-cents`, `reference`,
  `signature:integrity`, `redirect-url` y `customer-data:email`. *Los nombres de estos parámetros deben confirmarse
  en la documentación del Web Checkout antes de activar producción.*
- **Webhook** `POST /api/webhooks/wompi`: recalcula `SHA-256(valores de signature.properties + timestamp + secreto_de_eventos)`
  y lo compara en tiempo constante con `signature.checksum` y, si llega, con `X-Event-Checksum`. Rechaza si el
  secreto está vacío. La lista de propiedades se lee de cada evento (no está fija en el código).
- Respuestas: 401 firma inválida · 400 JSON/estructura inválida · 200 aplicado/duplicado/ignorado · 500 error
  temporal (Wompi reintenta) · 503 sin configurar.
- La página `/pedido` **no** cambia estados: solo muestra lo que registró el webhook.

## Casos cubiertos

| Caso | Comportamiento | Prueba |
| --- | --- | --- |
| Evento repetido | `duplicate`, sin efectos | integración |
| Pendiente → aprobado | pedido `paid` | integración + navegador |
| Rechazado / error | pedido `payment_failed`, stock liberado | integración |
| Eventos fuera de orden | `stale`, sin efectos | integración |
| Monto o moneda distintos | no se marca pagado, `needs_review` | integración |
| Pago aprobado tras vencer el pedido | `needs_review` (no se ignora dinero recibido) | integración |
| Anulación tras pago | `refunded` + `needs_review` | unitaria (estados) |
| Referencia desconocida | registrado, sin efectos | integración |
| Error de base de datos | 500 para reintento | integración |
| Productos demo con llaves de producción | bloqueado antes de crear el pedido | integración |

## Pendiente para activar pagos reales

1. Crear cuenta Wompi (sandbox primero) y obtener llaves y secretos.
2. Configurar en Vercel (Preview: llaves `test`; Production: llaves `prod`) las variables de `.env.example`.
3. Registrar la URL de eventos en el dashboard de Wompi para cada ambiente:
   `https://<dominio>/api/webhooks/wompi`.
4. Pruebas en sandbox con las tarjetas/medios de prueba de Wompi: aprobado, rechazado, pendiente (PSE).
5. Consultar la transacción en la API de Wompi para conciliar diferencias (pendiente de implementar: tarea de
   conciliación periódica que use `WOMPI_PRIVATE_KEY`).
6. Confirmar parámetros del Web Checkout y la vigencia de la fórmula de firma.
