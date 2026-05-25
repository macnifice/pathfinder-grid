import { type Dispatch, type SetStateAction, useMemo, useState } from 'react'
import './App.css'

type Point = {
  x: number
  y: number
}

type Path = Point[]

type CellRole = 'empty' | 'blocked' | 'start' | 'end' | 'path'

const MIN_SIZE = 2
const MAX_SIZE = 10
const MAX_PATHS = 2000

const directions: Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

const pointKey = ({ x, y }: Point) => `${x},${y}`

const samePoint = (first: Point, second: Point) =>
  first.x === second.x && first.y === second.y

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const randomize = <T,>(items: T[]) => {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = nextItems[index]
    nextItems[index] = nextItems[swapIndex]
    nextItems[swapIndex] = current
  }

  return nextItems
}

const buildProtectedRoute = (start: Point, end: Point): Path => {
  const route: Path = [{ ...start }]
  const cursor = { ...start }

  while (cursor.x !== end.x) {
    cursor.x += cursor.x < end.x ? 1 : -1
    route.push({ ...cursor })
  }

  while (cursor.y !== end.y) {
    cursor.y += cursor.y < end.y ? 1 : -1
    route.push({ ...cursor })
  }

  return route
}

const isInsideGrid = (point: Point, rows: number, columns: number) =>
  point.x >= 0 && point.x < columns && point.y >= 0 && point.y < rows

const findPaths = (
  rows: number,
  columns: number,
  blockedCells: Set<string>,
  start: Point,
  end: Point,
) => {
  const paths: Path[] = []
  const visited = new Set<string>()
  let stoppedByLimit = false

  const walk = (current: Point, currentPath: Path) => {
    if (paths.length >= MAX_PATHS) {
      stoppedByLimit = true
      return
    }

    if (samePoint(current, end)) {
      paths.push([...currentPath])
      return
    }

    for (const direction of directions) {
      const next = {
        x: current.x + direction.x,
        y: current.y + direction.y,
      }
      const nextKey = pointKey(next)

      if (
        !isInsideGrid(next, rows, columns) ||
        blockedCells.has(nextKey) ||
        visited.has(nextKey)
      ) {
        continue
      }

      visited.add(nextKey)
      currentPath.push(next)
      walk(next, currentPath)
      currentPath.pop()
      visited.delete(nextKey)

      if (paths.length >= MAX_PATHS) {
        stoppedByLimit = true
        return
      }
    }
  }

  visited.add(pointKey(start))
  walk(start, [start])

  return {
    paths: paths.sort((first, second) => first.length - second.length),
    stoppedByLimit,
  }
}

function App() {
  const [rows, setRows] = useState(5)
  const [columns, setColumns] = useState(5)
  const [obstacleCount, setObstacleCount] = useState(6)
  const [start, setStart] = useState<Point>({ x: 0, y: 0 })
  const [end, setEnd] = useState<Point>({ x: 4, y: 4 })
  const [blockedKeys, setBlockedKeys] = useState<Set<string>>(() => new Set())
  const [paths, setPaths] = useState<Path[]>([])
  const [selectedPathIndex, setSelectedPathIndex] = useState(0)
  const [message, setMessage] = useState(
    'Configura la grid y genera los obstaculos.',
  )
  const [limitReached, setLimitReached] = useState(false)

  const normalizedEnd = useMemo(
    () => ({
      x: clampNumber(end.x, 0, columns - 1),
      y: clampNumber(end.y, 0, rows - 1),
    }),
    [columns, end.x, end.y, rows],
  )

  const protectedRoute = useMemo(
    () => buildProtectedRoute(start, normalizedEnd),
    [normalizedEnd, start],
  )

  const maxObstacles = rows * columns - protectedRoute.length
  const selectedPath = useMemo(
    () => paths[selectedPathIndex] ?? [],
    [paths, selectedPathIndex],
  )
  const selectedPathKeys = useMemo(
    () => new Set(selectedPath.map(pointKey)),
    [selectedPath],
  )

  const updateRows = (value: number) => {
    const nextRows = clampNumber(value, MIN_SIZE, MAX_SIZE)
    setRows(nextRows)
    setStart((current) => ({
      x: clampNumber(current.x, 0, columns - 1),
      y: clampNumber(current.y, 0, nextRows - 1),
    }))
    setEnd((current) => ({
      x: clampNumber(current.x, 0, columns - 1),
      y: clampNumber(current.y, 0, nextRows - 1),
    }))
  }

  const updateColumns = (value: number) => {
    const nextColumns = clampNumber(value, MIN_SIZE, MAX_SIZE)
    setColumns(nextColumns)
    setStart((current) => ({
      x: clampNumber(current.x, 0, nextColumns - 1),
      y: clampNumber(current.y, 0, rows - 1),
    }))
    setEnd((current) => ({
      x: clampNumber(current.x, 0, nextColumns - 1),
      y: clampNumber(current.y, 0, rows - 1),
    }))
  }

  const updatePoint = (
    point: Point,
    setter: Dispatch<SetStateAction<Point>>,
    axis: keyof Point,
    value: number,
  ) => {
    setter({
      ...point,
      [axis]: clampNumber(value, 0, axis === 'x' ? columns - 1 : rows - 1),
    })
  }

  const generateGrid = () => {
    const safeEnd = {
      x: clampNumber(end.x, 0, columns - 1),
      y: clampNumber(end.y, 0, rows - 1),
    }
    const safeStart = {
      x: clampNumber(start.x, 0, columns - 1),
      y: clampNumber(start.y, 0, rows - 1),
    }

    if (samePoint(safeStart, safeEnd)) {
      setMessage('El origen y el destino deben ser coordenadas diferentes.')
      setPaths([])
      setBlockedKeys(new Set())
      return
    }

    const reservedKeys = new Set(
      buildProtectedRoute(safeStart, safeEnd).map(pointKey),
    )
    const allowedCells: Point[] = []

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const cell = { x, y }

        if (!reservedKeys.has(pointKey(cell))) {
          allowedCells.push(cell)
        }
      }
    }

    const safeObstacleCount = clampNumber(obstacleCount, 0, allowedCells.length)
    const nextBlockedKeys = new Set(
      randomize(allowedCells).slice(0, safeObstacleCount).map(pointKey),
    )
    const searchResult = findPaths(
      rows,
      columns,
      nextBlockedKeys,
      safeStart,
      safeEnd,
    )
    const nextPaths = searchResult.paths

    setStart(safeStart)
    setEnd(safeEnd)
    setObstacleCount(safeObstacleCount)
    setBlockedKeys(nextBlockedKeys)
    setPaths(nextPaths)
    setSelectedPathIndex(0)
    setLimitReached(searchResult.stoppedByLimit)
    setMessage(
      nextPaths.length > 0
        ? `Se encontraron ${nextPaths.length} caminos.`
        : 'No se encontro camino. Ajusta los datos e intenta de nuevo.',
    )
  }

  const getCellRole = (cell: Point): CellRole => {
    const key = pointKey(cell)

    if (samePoint(cell, start)) {
      return 'start'
    }

    if (samePoint(cell, end)) {
      return 'end'
    }

    if (blockedKeys.has(key)) {
      return 'blocked'
    }

    if (selectedPathKeys.has(key)) {
      return 'path'
    }

    return 'empty'
  }

  const gridCells = []

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const cell = { x, y }
      const role = getCellRole(cell)
      const label =
        role === 'start'
          ? 'O'
          : role === 'end'
            ? 'D'
            : role === 'blocked'
              ? 'X'
              : selectedPathKeys.has(pointKey(cell))
                ? String(selectedPath.findIndex((point) => samePoint(point, cell)))
                : ''

      gridCells.push(
        <div
          className={`grid-cell grid-cell--${role}`}
          key={pointKey(cell)}
          title={`x: ${x}, y: ${y}`}
        >
          <span>{label}</span>
        </div>,
      )
    }
  }

  return (
    <main className="app-shell">
      <section className="app-header">
        <div>
          <p className="eyebrow">Algoritmo de caminos</p>
          <h1>Buscador de rutas en una grid</h1>
        </div>
        <div className="status-panel">
          <strong>{paths.length}</strong>
          <span>caminos encontrados</span>
        </div>
      </section>

      <section className="workspace">
        <form
          className="controls"
          onSubmit={(event) => {
            event.preventDefault()
            generateGrid()
          }}
        >
          <fieldset>
            <legend>Tamano</legend>
            <label>
              Filas Y
              <input
                max={MAX_SIZE}
                min={MIN_SIZE}
                onChange={(event) => updateRows(Number(event.target.value))}
                type="number"
                value={rows}
              />
            </label>
            <label>
              Columnas X
              <input
                max={MAX_SIZE}
                min={MIN_SIZE}
                onChange={(event) => updateColumns(Number(event.target.value))}
                type="number"
                value={columns}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Coordenadas</legend>
            <div className="coordinate-group">
              <span>Origen</span>
              <label>
                X
                <input
                  max={columns - 1}
                  min={0}
                  onChange={(event) =>
                    updatePoint(start, setStart, 'x', Number(event.target.value))
                  }
                  type="number"
                  value={start.x}
                />
              </label>
              <label>
                Y
                <input
                  max={rows - 1}
                  min={0}
                  onChange={(event) =>
                    updatePoint(start, setStart, 'y', Number(event.target.value))
                  }
                  type="number"
                  value={start.y}
                />
              </label>
            </div>
            <div className="coordinate-group">
              <span>Destino</span>
              <label>
                X
                <input
                  max={columns - 1}
                  min={0}
                  onChange={(event) =>
                    updatePoint(end, setEnd, 'x', Number(event.target.value))
                  }
                  type="number"
                  value={end.x}
                />
              </label>
              <label>
                Y
                <input
                  max={rows - 1}
                  min={0}
                  onChange={(event) =>
                    updatePoint(end, setEnd, 'y', Number(event.target.value))
                  }
                  type="number"
                  value={end.y}
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Obstaculos</legend>
            <label>
              Cantidad
              <input
                max={maxObstacles}
                min={0}
                onChange={(event) =>
                  setObstacleCount(
                    clampNumber(Number(event.target.value), 0, maxObstacles),
                  )
                }
                type="number"
                value={Math.min(obstacleCount, maxObstacles)}
              />
            </label>
            <p className="hint">Maximo permitido: {maxObstacles}</p>
          </fieldset>

          <button className="primary-action" type="submit">
            Generar caminos
          </button>
          <p className="message">{message}</p>
          {limitReached && (
            <p className="warning">
              Se alcanzo el limite de {MAX_PATHS} caminos para proteger el
              navegador.
            </p>
          )}
        </form>

        <section className="grid-panel" aria-label="Grid de caminos">
          <div
            className="grid-board"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {gridCells}
          </div>
          <div className="legend">
            <span>
              <i className="legend-dot legend-dot--start" /> Origen
            </span>
            <span>
              <i className="legend-dot legend-dot--end" /> Destino
            </span>
            <span>
              <i className="legend-dot legend-dot--blocked" /> Obstaculo
            </span>
            <span>
              <i className="legend-dot legend-dot--path" /> Camino
            </span>
          </div>
        </section>

        <aside className="paths-panel">
          <div className="paths-header">
            <h2>Caminos</h2>
            <span>Ordenados por longitud</span>
          </div>
          <div className="paths-list">
            {paths.length === 0 ? (
              <p className="empty-state">Genera una grid para ver resultados.</p>
            ) : (
              paths.map((path, index) => (
                <button
                  className={
                    index === selectedPathIndex
                      ? 'path-item path-item--active'
                      : 'path-item'
                  }
                  key={path.map(pointKey).join('|')}
                  onClick={() => setSelectedPathIndex(index)}
                  type="button"
                >
                  <strong>Camino {index + 1}</strong>
                  <span>
                    {path.length - 1} pasos | {path.length} celdas
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
