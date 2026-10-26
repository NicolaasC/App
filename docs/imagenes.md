# Imágenes

## Fuente actual (provisional)

27 fotografías de **Unsplash**, publicadas bajo la [Unsplash License](https://unsplash.com/license) (uso
comercial gratuito, sin atribución obligatoria; no permite vender las fotos sin modificar ni replicar un servicio
similar). Se registran en un único lugar: `src/data/demo/images.ts`, con ID, página de origen, autor (cuando se
conoce) y texto alternativo en español. Cada producto usa una foto distinta.

### Limitaciones — revisar antes del lanzamiento

- **No se revisaron visualmente.** El entorno de desarrollo tiene la red restringida: no puede abrir
  unsplash.com ni images.unsplash.com. Las fotos se identificaron por búsqueda web a partir de su título público.
  Hay que abrir cada página de origen y confirmar: que es gratuita (no Unsplash+), que el contenido coincide con
  la descripción, la calidad y que no muestra logotipos de terceros (algunas pueden mostrar marcas).
- Son fotos de stock: **no muestran el producto que se vende**. La interfaz lo indica ("Foto de referencia").
  Sustituirlas por fotografía propia del inventario real.
- La autoría de 8 fotos figura como "por confirmar".
- No se usó el *Unsplash Dataset*: sus términos solo permiten entrenamiento interno de modelos.

## Descarga

`npm run images:fetch` descarga cada foto desde su endpoint público de descarga, la redimensiona a 2000 px
máximo (JPEG q82) en `public/images/demo/` y genera `src/data/demo/downloaded-images.json` con dimensiones.
Fallos individuales no detienen el script (`--strict` para que sí). En Vercel se ejecuta antes del build
(`vercel.json`). Recomendado: ejecutarlo una vez en local y **versionar las imágenes** para no depender de
Unsplash en cada despliegue.

Sin imágenes descargadas, la interfaz muestra un placeholder neutro ("Foto pendiente").

## Implementación

- `next/image` con `fill`, `sizes` por contexto, AVIF/WebP, calidades permitidas 70/85, carga diferida salvo
  imágenes prioritarias (hero, primeras tarjetas, galería).
- Contenedores con proporción fija (4:5 producto, 3:4 categoría) → sin saltos de diseño (CLS medido = 0).
- `onError` muestra el placeholder si un archivo falla.
- Fotos por color: `colorId` en la imagen; un color sin foto muestra "Foto pendiente para el color X".

## Para fotografía propia

Formato recomendado: fondo neutro (marfil/arena), luz suave, ángulos consistentes (lateral, 3/4, suela, detalle,
puesta), mínimo 2000 px en el lado mayor, proporción 4:5. Subir a Supabase Storage o `/public/images/productos/`
y registrar en `product_images` con `provisional = false`.
