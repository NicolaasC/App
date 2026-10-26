# Imágenes

## Fuente actual (provisional)

27 fotografías de **Unsplash** seleccionadas con el conector oficial de su API el 26-oct-2026. Para cada una
se verificó en la respuesta de la API:

- `premium: false` (gratuita, [Unsplash License](https://unsplash.com/license): uso comercial permitido; no se
  pueden vender las fotos sin modificarlas ni replicar un servicio similar a Unsplash).
- Autor y perfil, dimensiones y el texto alternativo publicado por Unsplash (base de los textos en español).
- Que la descripción no nombre marcas de terceros (se descartaron resultados con Nike, Lacoste, etc.).

El registro está en un único archivo: `src/data/demo/images.ts`. Cada producto usa una foto distinta y el
catálogo demo se ajustó para que cada producto describa lo que su foto muestra.

### Cumplimiento de las directrices de la API de Unsplash

- **Hotlinking**: las imágenes se sirven desde `images.unsplash.com`; el redimensionado lo hace su CDN
  mediante un `loader` de `next/image` (no consume la optimización de imágenes de Vercel).
- **Registro de uso**: se llamó al endpoint de descarga (`download_asset`) de las 27 fotos al incorporarlas.
  Al añadir una foto nueva, repetir ese paso.
- **Atribución**: "Foto de *Autor* en Unsplash" con enlaces de referencia en hero, bloque editorial, ficha de
  producto y la página `/creditos`.

### Limitaciones

- No pude ver las imágenes: el entorno de desarrollo no tiene red hacia `images.unsplash.com`. La
  correspondencia foto–producto se basa en los datos de la API. **Revisar visualmente** en el despliegue de
  Preview (encuadre, logotipos visibles de terceros, calidad).
- Son fotos de stock: **no muestran el producto que se vende**. La interfaz lo indica ("Foto de referencia").
  Sustituirlas por fotografía propia del inventario real antes del lanzamiento.
- Sin conexión con Unsplash la interfaz muestra un placeholder neutro ("Foto pendiente").

## Implementación

- `next/image` con `fill`, `sizes` por contexto, carga diferida salvo imágenes prioritarias (hero, primeras
  tarjetas, galería).
- Contenedores con proporción fija (4:5 producto, 3:4 categoría) → sin saltos de diseño.
- `onError` muestra el placeholder si una imagen falla.
- Fotos por color: `colorId` en la imagen; un color sin foto muestra "Foto pendiente para el color X".

## Para fotografía propia

Fondo neutro (marfil/arena), luz suave, ángulos consistentes (lateral, 3/4, suela, detalle, puesta), mínimo
2000 px en el lado mayor, proporción 4:5. Guardar en `/public/images/productos/` o Supabase Storage y registrar
en `product_images` con `provisional = false`.
