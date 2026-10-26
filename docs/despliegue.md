# Despliegue en Vercel

> No se ha realizado ningún despliegue: este entorno no tiene acceso a Vercel ni credenciales. No comprar
> dominios, contratar planes ni activar pagos sin autorización expresa del negocio.

## Ambientes

| Ambiente | Uso | Catálogo | Pagos | Indexable |
| --- | --- | --- | --- | --- |
| Local | Desarrollo | `demo` o Supabase de desarrollo | `none` o Wompi sandbox | No |
| Preview (Vercel) | Cada rama / PR | Supabase de staging | Wompi **sandbox** | No |
| Production | Tienda pública | Supabase de producción | Wompi **producción** | Solo con catálogo real |

Usar **proyectos Supabase separados** para staging y producción.

## 1. Requisitos locales
Node 22, npm 10+, Git. Opcional: Supabase CLI y PostgreSQL local para pruebas de integración.

## 2. Instalación
`npm ci`

## 3–4. Configuración y variables
Copiar `.env.example` a `.env.local`. En Vercel: *Project → Settings → Environment Variables*, definiendo cada
variable por ambiente (Preview / Production). Secretos solo como variables sin prefijo `NEXT_PUBLIC_`.

## 5–6. Base de datos y migraciones
1. Crear proyecto en Supabase (región más cercana disponible, p. ej. São Paulo).
2. Aplicar `supabase/migrations/*` en orden (`supabase db push` o editor SQL).
3. Copiar la cadena **Transaction pooler** (puerto 6543) a `DATABASE_URL`.
4. Cargar catálogo: real (pendiente de herramienta de administración) o demo con `npm run db:seed-demo` solo en staging.
5. `CATALOG_SOURCE=supabase`.

## 7. Git
Repositorio: `github.com/NicolaasC/App` (rama `main`). Recomendado: proteger `main` y trabajar por ramas + PR.

## 8. Configuración de Vercel
- Importar el repositorio; framework Next.js. `vercel.json` define `npm ci`, `npm run build`
  y la tarea programada diaria de vencimiento de pedidos
  (en plan Hobby, Vercel Cron solo permite ejecuciones diarias; con mayor volumen conviene cada 15–30 min).
- `NEXT_PUBLIC_SITE_URL` por ambiente; `CRON_SECRET` para la tarea programada.

## 9. Despliegues de prueba (Preview)
Cada push a una rama crea un Preview. Verificar con:
```bash
npm run typecheck && npm run lint && npm test && npm run build
BASE_URL=https://<preview>.vercel.app npm run test:e2e
```
Con Vercel Deployment Protection activa, el e2e necesita el *bypass token* de Vercel.

## 10. Verificación en producción (checklist)
- [ ] Datos legales, contacto, políticas aprobados (`docs/seguridad-y-legal.md`).
- [ ] Catálogo real, fotos propias, `isDemo = false`, `NEXT_PUBLIC_SITE_INDEXABLE=true`.
- [ ] Compra de prueba de bajo valor en producción y reembolso; webhook recibido y pedido `paid`.
- [ ] Lighthouse en la URL pública, `/robots.txt`, `/sitemap.xml`.
- [ ] Alertas: revisar logs de `wompi webhook` y pedidos con `needs_review`.

## 11. Dominio
Comprar `.co`/`.com.co` (pendiente de decisión), añadirlo en Vercel → Domains, configurar DNS, actualizar
`NEXT_PUBLIC_SITE_URL` y la URL de eventos en Wompi.

## 12–13. Pagos y webhooks
Ver `docs/pagos.md`. Registrar `https://<dominio>/api/webhooks/wompi` en Wompi por ambiente y probar un evento.

## 14. Actualizaciones
Rama → PR → Preview verificado → merge a `main` (deploy a Production). Migraciones: aplicar primero en
staging; en producción antes del deploy si son compatibles hacia atrás (añadir columnas antes de usarlas).

## 15. Recuperación
- Código: Vercel → Deployments → *Promote/Instant Rollback* al despliegue anterior.
- Datos: backups de Supabase (diarios en planes pagos; activar PITR si el volumen lo justifica). No revertir
  migraciones destructivas sin backup; preferir migraciones correctivas hacia adelante.
- Pagos: ante caída del webhook, Wompi reintenta; para diferencias, conciliar consultando la API de transacciones.
