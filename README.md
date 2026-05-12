# Gestion de Tienda

Formulario web para registrar INVENTARIO INICIAL, RECIBIDO, SALIDAS e INVENTARIO CIERRE conectado a Google Sheets mediante Google Apps Script.

## Estructura

- `index.html`: interfaz principal
- `styles.css`: estilos visuales
- `script.js`: logica frontend y envio de datos
- `Code.gs`: backend de Google Apps Script
- `api/apps-script.js`: proxy serverless de Vercel para evitar problemas de CORS con Apps Script
- `vercel.json`: configuracion de despliegue en Vercel

## Spreadsheet objetivo

- URL: `https://docs.google.com/spreadsheets/d/1AT5XYZieouHEW3JCJZgq4tLkS8xLUVEqqyInzpPFQlc/edit`
- ID: `1AT5XYZieouHEW3JCJZgq4tLkS8xLUVEqqyInzpPFQlc`

## Hojas esperadas

- `INVENTARIO INICIAL`
- `RECIBIDO`
- `SALIDAS`
- `INVENTARIO CIERRE`
- `PRODUCTOS`
- `MOTIVOS SALIDA`

## Columnas esperadas

### Hojas de registro
- `FECHA`
- `CODIGO`
- `PRODUCTO`
- `CANTIDAD`
- `SEDE`
- `RESPONSABLE`
- `OBSERVACIONES`

### Hojas `INVENTARIO INICIAL` e `INVENTARIO CIERRE`
- `FECHA`
- `CODIGO`
- `PRODUCTO`
- `CANTIDAD`
- `FECHA DE ELABORACION`
- `SEDE`
- `RESPONSABLE`
- `OBSERVACIONES`

### Hoja `SALIDAS`
- `FECHA`
- `CODIGO`
- `PRODUCTO`
- `CANTIDAD`
- `SEDE`
- `RESPONSABLE`
- `OBSERVACIONES`
- `MOTIVO SALIDA`

### Hoja `PRODUCTOS`
- `CODIGO`
- `PRODUCTO`
- `UND PRIMARIA`
- `FAMILIA`

### Hoja `MOTIVOS SALIDA`
- `MOTIVOS SALIDA`

## Como desplegar

1. Crear un proyecto en Google Apps Script.
2. Copiar el contenido de `Code.gs` en el archivo `Code.gs` del proyecto.
3. Desplegar como Web App:
   - Execute as: `Me`
   - Who has access: `Anyone` o `Anyone with the link`
4. Copiar la URL `/exec` del deploy.
5. Pegar esa URL en `config.js` en la constante `window.APPS_SCRIPT_URL`.
6. Importar esta carpeta en Vercel y publicar.
7. El frontend ya llama al proxy `/api/apps-script`, no al Web App directamente.

## Notas

- El formulario toma productos desde `PRODUCTOS` y motivos desde `MOTIVOS SALIDA`.
- El modulo `Salidas` exige motivo de salida.
- El frontend usa catalogos remotos; no hay listas embebidas en HTML.
