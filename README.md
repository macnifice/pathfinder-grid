# pathfinder-grid

Aplicacion web hecha con React, TypeScript y Vite para generar una grid con obstaculos aleatorios y encontrar caminos entre una coordenada de origen y una de destino.

## Requisitos

- Node.js 20 o superior
- pnpm 9 o superior
- Git

Para verificar las versiones instaladas:

```bash
node --version
pnpm --version
git --version
```

Si no tienes `pnpm`, puedes instalarlo con:

```bash
npm install -g pnpm
```

## Descargar el proyecto

Clona el repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
cd pathfinder-grid
```

Si ya tienes el proyecto descargado, entra a la carpeta:

```bash
cd pathfinder-grid
```

## Instalar dependencias

```bash
pnpm install
```

## Ejecutar en desarrollo

```bash
pnpm dev
```

Vite mostrara una URL local similar a:

```text
http://localhost:5173/
```

Abre esa URL en el navegador.

## Compilar el proyecto

```bash
pnpm build
```

La version compilada se genera en la carpeta `dist/`.

## Previsualizar la version compilada

Despues de compilar:

```bash
pnpm preview
```

## Revisar errores de estilo y codigo

```bash
pnpm lint
```

## Uso de la aplicacion

1. Ingresa la cantidad de filas `Y` y columnas `X`.
2. Ingresa las coordenadas de origen y destino.
3. Ingresa la cantidad de obstaculos.
4. Presiona `Generar caminos`.
5. La app dibuja la grid, coloca obstaculos aleatorios y lista los caminos encontrados de menor a mayor.

Reglas principales:

- Las coordenadas empiezan en `0`.
- `x` representa columnas.
- `y` representa filas.
- Solo se permite movimiento en 4 direcciones: arriba, abajo, izquierda y derecha.
- Los caminos no repiten celdas.
- La grid maxima es de `10 x 10`.
- La busqueda se detiene al llegar a `2,000` caminos para evitar bloquear el navegador.
- La app limita la cantidad de obstaculos para conservar al menos un camino posible entre origen y destino.
