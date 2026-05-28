# Fantasía — Instrucciones de configuración

## Archivos del proyecto

| Archivo | Descripción |
|---|---|
| `demo.html` | **Abre este primero** — funciona sin configurar Sheets, con 12 disfraces de ejemplo |
| `index.html` | Versión conectada a Google Sheets (requiere configurar el ID) |
| `style.css` | Estilos del sitio |
| `app.js` | Lógica y conexión con Google Sheets |

---

## Paso 1 — Crear la Google Sheet

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva
2. En la **fila 1** pon exactamente estos encabezados (una columna cada uno):

```
nombre | categoria | precio | rating | descripcion | imagen | badge | tallas | disponible
```

3. Desde la **fila 2** en adelante, agrega tus disfraces

### Referencia de columnas

| Columna | Ejemplo | Notas |
|---|---|---|
| nombre | Conde Vampiro | Nombre del disfraz |
| categoria | Terror | Terror, Fantasía, Héroes, Infantil, Aventura, etc. |
| precio | 49.90 | Solo número, sin símbolo |
| rating | 4.8 | Del 1 al 5 (opcional, dejar vacío si no aplica) |
| descripcion | Elegante capa roja... | Texto libre de descripción |
| imagen | https://... | URL pública de la foto del disfraz |
| badge | Bestseller | Opciones: Bestseller, Nuevo, Premium, Oferta (o dejar vacío) |
| tallas | S\|M\|L\|XL | Separadas con \| (pipe). Ej: S\|M\|L |
| disponible | si | Escribe "no" para ocultar del catálogo |

### Ejemplo de fila

```
Conde Vampiro | Terror | 49.90 | 4.8 | Elegante disfraz de vampiro con capa roja | https://url-de-la-foto.jpg | Bestseller | S|M|L|XL | si
```

---

## Paso 2 — Publicar la hoja en la web

1. En Google Sheets: **Archivo → Compartir → Publicar en la web**
2. Selecciona **"Hoja 1"** y formato **"Valores separados por comas (.csv)"**
3. Haz clic en **Publicar** y confirma
4. Cierra ese diálogo

---

## Paso 3 — Obtener el ID de la Sheet

La URL de tu hoja tiene este formato:
```
https://docs.google.com/spreadsheets/d/AQUI_ESTA_EL_ID/edit
```

Copia el ID (la parte entre `/d/` y `/edit`)

---

## Paso 4 — Configurar el sistema

Abre **`config.js`** (el único archivo que debes editar) y reemplaza:
```js
SHEET_ID: 'TU_SHEET_ID_AQUI',
```
por tu ID real:
```js
SHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
```

Guarda el archivo. No toques `app.js`.

---

## Paso 5 — Usar el sistema

- Abre `index.html` en el navegador (doble clic)
- Cada vez que agregues o edites un disfraz en la Sheet, **recarga la página** y el catálogo se actualiza automáticamente

---

## Imágenes para los disfraces

Puedes usar:
- **Google Drive**: sube la imagen, clic derecho → "Obtener enlace" → cambia la URL a: `https://drive.google.com/uc?id=ID_DEL_ARCHIVO`
- **Imgur**: sube la imagen gratis en imgur.com, copia la URL directa (termina en .jpg/.png)
- **Unsplash**: busca en unsplash.com, clic derecho en imagen → "Copiar dirección de imagen"

---

## Solución de problemas

**El catálogo no carga:** Verifica que la hoja esté publicada en la web (Paso 2) y que el ID esté correcto (Paso 3-4).

**El CORS bloquea la carga:** Abre el archivo en un servidor local con Live Server (VS Code) en lugar de doble clic.

**Las imágenes no aparecen:** Asegúrate de que las URLs de imagen sean públicas y directas (no requieran login).
