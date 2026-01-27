'use client'

import React, { useRef, useEffect } from 'react'
import { generateHexGraph, HexGridGraph, GridNode } from '@/utils/hexGridUtils'

interface Point {
    x: number
    y: number
}

interface Agent {
    currentNode: string
    targetNode: string
    lastNodeId: string | null
    progress: number
    speed: number
    baseSpeed: number
    isDashing: boolean
    color: string
    active: boolean
    visualTrail: Point[]
    stepsTaken: number
    maxSteps: number
}

const AGENT_COUNT = 6 // Even sparser (User: "分開一點")
const AGENT_SPEED_MIN = 0.15
const AGENT_SPEED_MAX = 0.25
const DASH_CHANCE = 0.4
const DASH_MULTIPLIER = 2.0
const TRAIL_FRAMES = 3 // Ultra short tail (User: "果斷弄短")
const EXCLUSION_RADIUS = 300

export default function CyberpunkGridCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const graphRef = useRef<HexGridGraph | null>(null)
    const agentsRef = useRef<Agent[]>([])
    const frameIdRef = useRef<number>(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const initGraph = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            graphRef.current = generateHexGraph(canvas.width, canvas.height)
            initAgents()
        }

        const isUnsafeNode = (node: GridNode, cx: number, cy: number) => {
            const dx = node.x - cx
            const dy = node.y - cy
            return Math.sqrt(dx * dx + dy * dy) < EXCLUSION_RADIUS
        }

        const getRandomSafeNodeId = () => {
            if (!graphRef.current) return null
            const nodes = Array.from(graphRef.current.nodes.values())
            const cx = canvas.width / 2
            const cy = canvas.height / 2

            let attempts = 0
            while (attempts < 100) {
                const node = nodes[Math.floor(Math.random() * nodes.length)]
                if (!isUnsafeNode(node, cx, cy)) return node.id
                attempts++
            }
            return null
        }

        const initAgents = () => {
            agentsRef.current = []
            for (let i = 0; i < AGENT_COUNT; i++) {
                spawnAgent()
            }
        }

        const spawnAgent = () => {
            const startNodeId = getRandomSafeNodeId()
            if (!startNodeId || !graphRef.current) return

            const startNode = graphRef.current.nodes.get(startNodeId)!
            const speed = AGENT_SPEED_MIN + Math.random() * (AGENT_SPEED_MAX - AGENT_SPEED_MIN)

            agentsRef.current.push({
                currentNode: startNodeId,
                targetNode: startNodeId,
                lastNodeId: null,
                progress: 1.0,
                speed: speed,
                baseSpeed: speed,
                isDashing: false,
                color: '#00f3ff',
                active: true,
                visualTrail: [],
                stepsTaken: 0,
                maxSteps: Math.floor(3 + Math.random() * 5)
            })
        }

        const update = () => {
            if (!graphRef.current) return
            const cx = canvas.width / 2
            const cy = canvas.height / 2

            agentsRef.current = agentsRef.current.filter(a => a.active)
            while (agentsRef.current.length < AGENT_COUNT) spawnAgent()

            agentsRef.current.forEach(agent => {
                agent.progress += agent.speed

                if (agent.progress >= 1) {
                    agent.lastNodeId = agent.currentNode
                    agent.currentNode = agent.targetNode
                    agent.progress = 0
                    agent.stepsTaken++

                    if (agent.stepsTaken >= agent.maxSteps) { agent.active = false; return }

                    const curr = graphRef.current!.nodes.get(agent.currentNode)!
                    if (isUnsafeNode(curr, cx, cy)) { agent.active = false; return }

                    const neighbors = curr.neighbors
                    let validNeighbors = neighbors.filter(id => id !== agent.lastNodeId)
                    const downNeighbors = validNeighbors.filter(id => {
                        const n = graphRef.current!.nodes.get(id)
                        return n && n.y >= curr.y - 0.1
                    })

                    let nextId: string | null = null
                    if (downNeighbors.length > 0) nextId = downNeighbors[Math.floor(Math.random() * downNeighbors.length)]
                    else if (validNeighbors.length > 0) nextId = validNeighbors[Math.floor(Math.random() * validNeighbors.length)]
                    else { agent.active = false; return }

                    if (!nextId) { agent.active = false; return }

                    // Sprint Logic
                    const shouldDash = Math.random() < DASH_CHANCE
                    agent.isDashing = shouldDash
                    agent.speed = shouldDash ? agent.baseSpeed * DASH_MULTIPLIER : agent.baseSpeed
                    agent.targetNode = nextId
                }

                // Update Visual Trail
                const n1 = graphRef.current!.nodes.get(agent.currentNode)!
                const n2 = graphRef.current!.nodes.get(agent.targetNode)!
                const currX = n1.x + (n2.x - n1.x) * agent.progress
                const currY = n1.y + (n2.y - n1.y) * agent.progress

                // Unshift new position
                agent.visualTrail.unshift({ x: currX, y: currY })

                // Limit trail length strictly
                // Shorter trail if not dashing? No, keep frames consistent for speed effect.
                // If dashing, speed is high, so distance is large.
                // If slow, distance is small.
                // This frame-based limit AUTOMATICALLY handles "longer streak when fast".
                if (agent.visualTrail.length > TRAIL_FRAMES) agent.visualTrail.pop()
            })
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            if (!graphRef.current) return

            agentsRef.current.forEach(agent => {
                if (agent.visualTrail.length < 2) return

                const head = agent.visualTrail[0]
                const tail = agent.visualTrail[agent.visualTrail.length - 1]

                // 1. Draw One Smooth Line for the Trail
                const grad = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y)
                grad.addColorStop(0, 'rgba(0, 243, 255, 0.8)') // Bright at head
                grad.addColorStop(1, 'rgba(0, 243, 255, 0)')   // Fade to nothing

                ctx.strokeStyle = grad
                ctx.lineWidth = agent.isDashing ? 3 : 2 // Thicker when fast
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'

                ctx.beginPath()
                ctx.moveTo(head.x, head.y)
                for (let i = 1; i < agent.visualTrail.length; i++) {
                    const p = agent.visualTrail[i]
                    // Optional: quadratic curve smoothing? No, straight segments better for tech look.
                    ctx.lineTo(p.x, p.y)
                }
                ctx.stroke()

                // 2. Draw Head Glow (Circle)
                // Separate from line to avoid "Dots" look in the body
                const headSize = agent.isDashing ? 3 : 2
                ctx.shadowBlur = agent.isDashing ? 20 : 10
                ctx.shadowColor = '#00f3ff'
                ctx.fillStyle = '#ffffff'

                ctx.beginPath()
                ctx.arc(head.x, head.y, headSize, 0, Math.PI * 2)
                ctx.fill()
                // Reset shadow
                ctx.shadowBlur = 0
            })
        }

        const loop = () => {
            update()
            draw()
            frameIdRef.current = requestAnimationFrame(loop)
        }

        window.addEventListener('resize', initGraph)
        initGraph()
        loop()

        return () => {
            window.removeEventListener('resize', initGraph)
            cancelAnimationFrame(frameIdRef.current)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
        />
    )
}
