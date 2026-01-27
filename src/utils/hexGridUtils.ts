export interface Point {
    x: number
    y: number
}

export interface GridNode extends Point {
    id: string
    neighbors: string[] // IDs of connected nodes
}

export interface HexGridGraph {
    nodes: Map<string, GridNode>
}

// Visual Calibration based on CSS `background-size: 80px`
// The CSS background tiles a square 80x80px box.
// Inside is the SVG scaled from 60x60 to 80x80.
// Scale Factor = 80 / 60 = 1.333333

const TILE_SIZE = 80
const SVG_SIZE = 60
const SCALE = TILE_SIZE / SVG_SIZE

// Raw Vertex Offsets from Center (30,30) in 60x60 space
// In SVG space:
// Top: (30, 0) -> dy = -30
// Top Right: (55.98, 15) -> dx = 25.98, dy = -15
// Bottom Right: (55.98, 45) -> dx = 25.98, dy = 15
// Bottom: (30, 60) -> dy = 30
// Bottom Left: (4.02, 45) -> dx = -25.98, dy = 15
// Top Left: (4.02, 15) -> dx = -25.98, dy = -15

const RAW_OFFSETS = [
    { dx: 0, dy: -30 },      // Top
    { dx: 25.98, dy: -15 },  // Top Right
    { dx: 25.98, dy: 15 },   // Bottom Right
    { dx: 0, dy: 30 },       // Bottom
    { dx: -25.98, dy: 15 },  // Bottom Left
    { dx: -25.98, dy: -15 }  // Top Left
]

export function generateHexGraph(canvasWidth: number, canvasHeight: number): HexGridGraph {
    const nodes = new Map<string, GridNode>()

    // Rectangular Tiling
    const cols = Math.ceil(canvasWidth / TILE_SIZE) + 1
    const rows = Math.ceil(canvasHeight / TILE_SIZE) + 1

    const addNode = (x: number, y: number): string => {
        const qx = Math.floor(x) // Use integer for cleaner ID
        const qy = Math.floor(y)
        const id = `${qx},${qy}`
        if (!nodes.has(id)) {
            nodes.set(id, { x: qx, y: qy, id, neighbors: [] })
        }
        return id
    }

    const addEdge = (id1: string, id2: string) => {
        const n1 = nodes.get(id1)
        const n2 = nodes.get(id2)
        if (n1 && n2) {
            if (!n1.neighbors.includes(id2)) n1.neighbors.push(id2)
            if (!n2.neighbors.includes(id1)) n2.neighbors.push(id1)
        }
    }

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const cx = c * TILE_SIZE + TILE_SIZE / 2
            const cy = r * TILE_SIZE + TILE_SIZE / 2

            // Generate 6 vertices for this tile
            const vIds: string[] = []

            RAW_OFFSETS.forEach(offset => {
                const vx = cx + offset.dx * SCALE
                const vy = cy + offset.dy * SCALE
                vIds.push(addNode(vx, vy))
            })

            // Connect edges within this hex (0-1, 1-2, 2-3, 3-4, 4-5, 5-0)
            for (let i = 0; i < 6; i++) {
                addEdge(vIds[i], vIds[(i + 1) % 6])
            }

            // Note: Vertical connections happen automatically because:
            // This Hex Bottom (v3) is at cy + 30*S = cy + 40
            // Below Hex Top (v0) is at (cy + 80) - 30*S = cy + 40
            // Since coordinates verify equal (after floor), addNode returns same ID.
            // So they act as shared nodes (Junctions).
        }
    }

    return { nodes }
}
