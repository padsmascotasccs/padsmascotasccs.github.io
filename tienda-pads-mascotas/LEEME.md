# Tienda online — Pads Mascotas

Sitio estático (HTML + CSS + JavaScript). No necesita instalar nada ni compilar:
se edita un archivo de datos y se sube la carpeta a cualquier hosting.

## Verla en tu computadora

Clic derecho sobre `servidor-local.ps1` → **Ejecutar con PowerShell** y abre
<http://localhost:5173>. (Abrir `index.html` con doble clic no funciona: el
navegador bloquea la lectura del catálogo.)

## Lo primero que debes configurar — `data/config.js`

| Qué | Dónde |
| --- | --- |
| Tu número de WhatsApp | `whatsapp.numero` (solo dígitos, con código de país) |
| Apagar los productos de ejemplo | `modoDemo: false` |
| Nombre, ubicación, logo | `marca` |
| Moneda | `moneda` |
| Textos y fotos del inicio | `hero` |
| Sobre nosotros | `nosotros` |
| Opciones de entrega del formulario | `pedido.opcionesEntrega` |

## Productos — `data/products.json`

```json
{
  "categorias": [{ "id": "mi-categoria", "nombre": "Mi categoría" }],
  "productos": [
    {
      "id": "nombre-unico-sin-espacios",
      "nombre": "Nombre del producto",
      "categoria": "mi-categoria",
      "precio": 10.5,
      "descripcionCorta": "Una línea para la tarjeta.",
      "descripcion": "Texto completo de la ficha.",
      "caracteristicas": ["Dato 1", "Dato 2"],
      "imagenes": ["assets/img/productos/foto-1.jpg", "assets/img/productos/foto-2.jpg"],
      "disponible": true,
      "destacado": true,
      "modelo3d": null
    }
  ]
}
```

- **Añadir**: copia un bloque, cambia el `id` y los datos. **Eliminar**: borra el bloque.
- `precio: null` → muestra «Precio a consultar» y no suma al total.
- `disponible: false` → aparece como agotado y no se puede añadir al carrito.
- `destacado: true` → sale en el inicio (máx. 4) y primero en el catálogo.
- Fotos: guárdalas en `assets/img/productos/`. Verticales 4:5 (p. ej. 1200×1500 px), JPG o WebP, menos de 300 KB.
- `data/demo/products.json` tiene ejemplos de cada caso.

## Modelos 3D

Guarda el archivo `.glb` (o `.gltf`) en `assets/modelos/` y pon su ruta en
`"modelo3d"` del producto, p. ej. `"assets/modelos/mi-producto.glb"`. Aparece
solo en la sala 3D y en su ficha. Recomendado: menos de 5 MB por modelo.

## Instagram — `data/instagram.json`

Instagram no permite mostrar el feed automáticamente sin una app aprobada por
Meta, así que la galería es manual (hasta 8 publicaciones):

```json
{ "publicaciones": [
  { "imagen": "assets/img/instagram/1.jpg", "enlace": "https://www.instagram.com/p/XXXX/", "alt": "Descripción" },
  { "enlace": "https://www.instagram.com/p/YYYY/", "incrustar": true }
] }
```

La segunda forma usa la inserción oficial de Instagram (no hace falta subir la foto).

## Publicarla

Sube la carpeta completa a Netlify (arrastrar y soltar), Cloudflare Pages,
Vercel o GitHub Pages. No requiere configuración. Después añade `sitemap.xml`
con tu dominio definitivo.

## Estructura

```
index.html · catalogo.html · producto.html · modelos-3d.html · pedido.html
data/        configuración, productos e Instagram (lo que tú editas)
assets/css/  estilos (colores y tipografías al inicio de styles.css)
assets/js/   core (carrito, WhatsApp) · layout · catalogo · producto · showroom · pedido
```

## Crecimiento futuro

- **Panel de administración**: el catálogo es un JSON, así que se puede conectar
  un CMS con acceso protegido (p. ej. Decap CMS o una hoja de cálculo) sin rehacer la tienda.
- **Pagos online**: `assets/js/pedido.js` tiene los canales de pedido separados
  (`CANALES`); se añade una pasarela como un canal más.
