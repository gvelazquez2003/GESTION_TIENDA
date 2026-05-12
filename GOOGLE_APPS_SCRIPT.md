# Google Apps Script

Este proyecto usa un Web App de Google Apps Script para guardar registros en Google Sheets y exponer catalogos.

## Requisitos

- Spreadsheet ID: `1AT5XYZieouHEW3JCJZgq4tLkS8xLUVEqqyInzpPFQlc`
- Hojas:
  - `INVENTARIO INICIAL`
  - `RECIBIDO`
  - `SALIDAS`
  - `INVENTARIO CIERRE`
  - `PRODUCTOS`
  - `MOTIVOS SALIDA`

## Flujo

- `GET ?action=getCatalogs` retorna productos y motivos.
- `POST` con `{ action: 'guardarRegistro', payload: {...} }` guarda un registro.
- En `INVENTARIO INICIAL` e `INVENTARIO CIERRE`, Apps Script mantiene la columna `FECHA DE ELABORACION` despues de `CANTIDAD` y la guarda con formato `DD/MM/AA`.
