<template>
  <div
    ref="container"
    class="pointer-events-none absolute inset-0 overflow-hidden"
    aria-hidden="true"
  >
    <canvas ref="canvas" class="absolute inset-0 block h-full w-full" />
  </div>
</template>

<script setup lang="ts">
/**
 * Three.js + GPGPU neural network background.
 *
 * Pipeline per frame:
 * 1. GPGPU updates particle positions along a flow field baked from the graph.
 * 2. Particles are splatted into a low-resolution density buffer.
 * 3. Nodes and edges sample that buffer to light up where traffic flows.
 * 4. Particles and soft trail ghosts are composited over the static graph.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useColorMode } from '#imports'
import * as THREE from 'three'
import {
  GPUComputationRenderer,
  type Variable
} from 'three/examples/jsm/misc/GPUComputationRenderer.js'

interface GraphNode {
  x: number
  y: number
  size: number
  alpha: number
  cluster: number
}

interface GraphEdge {
  a: number
  b: number
}

interface Palette {
  node: string
  accent: string
  interest: string
  data: string
  lineOpacity: number
}

const TAU = Math.PI * 2
const RADIAL_RINGS = [
  { radius: 0.14, count: 8 },
  { radius: 0.26, count: 16 },
  { radius: 0.38, count: 32 },
  { radius: 0.48, count: 64 }
]

const MOBILE_RADIAL_RINGS = [
  { radius: 0.18, count: 6 },
  { radius: 0.33, count: 12 },
  { radius: 0.48, count: 24 }
]

const FLOW_SIZE = 256
const PARTICLE_SIZE = 128
const PARTICLE_LIFE = 10

const container = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const colorMode = useColorMode()
const prefersReducedMotion = ref(false)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let densityScene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let gpuCompute: GPUComputationRenderer | null = null
let stateVariable: Variable | null = null

let flowTexture: THREE.CanvasTexture | null = null
let stateTexture: THREE.DataTexture | null = null
let initialTexture: THREE.DataTexture | null = null
let densityTarget: THREE.WebGLRenderTarget | null = null

let particleGeometry: THREE.BufferGeometry | null = null
let lineMesh: THREE.LineSegments | null = null
let nodePoints: THREE.Points | null = null
let particlePoints: THREE.Points | null = null
let ghostPoints: THREE.Points | null = null
let densityPoints: THREE.Points | null = null

let lineMaterial: THREE.ShaderMaterial | null = null
let nodeMaterial: THREE.ShaderMaterial | null = null
let particleMaterial: THREE.ShaderMaterial | null = null
let ghostMaterial: THREE.ShaderMaterial | null = null
let densityMaterial: THREE.ShaderMaterial | null = null

let nodes: GraphNode[] = []
let edges: GraphEdge[] = []
let nodeParent: number[] = []
let nodeDepth: number[] = []
let nodeChildren: number[][] = []
let leafNodes: number[] = []
let branchMembers = new Map<number, number[]>()
let branchRootByLeaf = new Map<number, number>()
let displayPositions: { x: number; y: number }[] = []
let activeBranch: number | null = null
let swayTarget = 0
let swayAmplitude = 0
let swayClock = 0
let lineGeometry: THREE.BufferGeometry | null = null
let nodeGeometry: THREE.BufferGeometry | null = null
let width = 0
let height = 0
let running = false
let visible = true
let rafId = 0
let lastFrame = 0
let resizeTimer: ReturnType<typeof setTimeout> | undefined
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined
let motionQuery: MediaQueryList | undefined

const shared = {
  uPixelRatio: { value: 1 },
  uHeight: { value: 1 },
  uHeightScale: { value: 1 },
  uAspect: { value: new THREE.Vector2(1, 1) },
  uDensity: { value: null as THREE.Texture | null },
  uState: { value: null as THREE.Texture | null },
  uFlow: { value: null as THREE.Texture | null },
  uColor: { value: new THREE.Color('#0f172a') },
  uAccent: { value: new THREE.Color('#059669') },
  uInterestColor: { value: new THREE.Color('#64748b') },
  uDataColor: { value: new THREE.Color('#059669') },
  uLineOpacity: { value: 0.16 }
}

const COMPUTE_SHADER = /* glsl */ `
  uniform sampler2D uFlow;
  uniform sampler2D uInitial;
  uniform float uDelta;
  uniform float uLife;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 state = texture2D(uState, uv);
    vec2 pos = state.xy;
    float age = state.z;
    float seed = state.w;

    vec2 flow = texture2D(uFlow, pos).xy * 2.0 - 1.0;
    float dataParticle = step(0.76, seed);
    float sign = dataParticle > 0.5 ? 1.0 : -1.0;
    float speed = mix(0.05, 0.13, fract(seed * 13.71)) * (1.0 + dataParticle * 0.55);

    pos += flow * sign * speed * uDelta;
    age += uDelta;

    if (age > uLife || pos.x < 0.0 || pos.x > 1.0 || pos.y < 0.0 || pos.y > 1.0) {
      vec4 initial = texture2D(uInitial, uv);
      pos = initial.xy;
      age = 0.0;
    }

    gl_FragColor = vec4(pos, age, seed);
  }
`

const LINE_VERTEX = /* glsl */ `
  uniform sampler2D uDensity;
  uniform vec2 uAspect;
  varying float vActivation;

  void main() {
    vec2 ndc = (position.xy - 0.5) * 2.0 * uAspect;
    vec2 uv = ndc * 0.5 + 0.5;
    vActivation = texture2D(uDensity, uv).r;
    gl_Position = vec4(ndc, 0.0, 1.0);
  }
`

const LINE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uLineOpacity;
  varying float vActivation;

  void main() {
    float activation = smoothstep(0.0, 0.65, vActivation);
    vec3 color = mix(uColor, uAccent, activation * 0.7);
    gl_FragColor = vec4(color, uLineOpacity + vActivation * 0.25);
  }
`

const NODE_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform sampler2D uDensity;
  uniform float uHeight;
  uniform float uPixelRatio;
  uniform vec2 uAspect;
  varying float vActivation;
  varying float vAlpha;

  void main() {
    vec2 ndc = (position.xy - 0.5) * 2.0 * uAspect;
    vec2 uv = ndc * 0.5 + 0.5;
    vActivation = texture2D(uDensity, uv).r;
    vAlpha = aAlpha;
    gl_PointSize = aSize * uHeight * (1.0 + vActivation * 2.0) * uPixelRatio;
    gl_Position = vec4(ndc, 0.0, 1.0);
  }
`

const NODE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  varying float vActivation;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);
    if (dist > 0.5) discard;

    float soft = smoothstep(0.5, 0.05, dist);
    float activation = smoothstep(0.0, 0.8, vActivation);
    vec3 color = mix(uColor, uAccent, activation * 0.65);
    float alpha = clamp(vAlpha + vActivation * 0.75, 0.0, 1.0) * soft;

    gl_FragColor = vec4(color, alpha);
  }
`

const PARTICLE_VERTEX = /* glsl */ `
  attribute vec2 aReference;
  uniform sampler2D uState;
  uniform float uPixelRatio;
  uniform float uHeightScale;
  uniform vec2 uAspect;
  varying float vSeed;

  void main() {
    vec4 state = texture2D(uState, aReference);
    vSeed = state.w;

    float dataParticle = step(0.76, vSeed);
    float size = mix(1.0, 2.0, dataParticle) * uHeightScale;
    gl_PointSize = max(1.0, size * uPixelRatio);
    gl_Position = vec4((state.xy - 0.5) * 2.0 * uAspect, 0.0, 1.0);
  }
`

const PARTICLE_FRAGMENT = /* glsl */ `
  uniform vec3 uInterestColor;
  uniform vec3 uDataColor;
  varying float vSeed;

  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);
    if (dist > 0.5) discard;

    float dataParticle = step(0.76, vSeed);
    vec3 color = mix(uInterestColor, uDataColor, dataParticle);
    float soft = smoothstep(0.5, 0.0, dist);
    float core = smoothstep(0.22, 0.0, dist);
    float alpha = soft * mix(0.12, 0.55, dataParticle) + core * mix(0.08, 0.4, dataParticle);

    gl_FragColor = vec4(color, alpha);
  }
`

const GHOST_VERTEX = /* glsl */ `
  attribute vec2 aReference;
  uniform sampler2D uState;
  uniform sampler2D uFlow;
  uniform float uPixelRatio;
  uniform float uHeightScale;
  uniform vec2 uAspect;
  varying float vSeed;

  void main() {
    vec4 state = texture2D(uState, aReference);
    vec2 flow = texture2D(uFlow, state.xy).xy * 2.0 - 1.0;
    float dataParticle = step(0.76, state.w);
    float sign = dataParticle > 0.5 ? 1.0 : -1.0;
    vec2 pos = state.xy - flow * sign * 0.016;

    vSeed = state.w;
    gl_PointSize = max(1.0, mix(2.5, 4.5, dataParticle) * uHeightScale * uPixelRatio);
    gl_Position = vec4((pos - 0.5) * 2.0 * uAspect, 0.0, 1.0);
  }
`

const GHOST_FRAGMENT = /* glsl */ `
  uniform vec3 uInterestColor;
  uniform vec3 uDataColor;
  varying float vSeed;

  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);
    if (dist > 0.5) discard;

    float dataParticle = step(0.76, vSeed);
    float soft = smoothstep(0.5, 0.0, dist);
    gl_FragColor = vec4(
      mix(uInterestColor, uDataColor, dataParticle),
      soft * mix(0.03, 0.08, dataParticle)
    );
  }
`

const DENSITY_VERTEX = /* glsl */ `
  attribute vec2 aReference;
  uniform sampler2D uState;
  uniform float uPixelRatio;
  uniform float uHeightScale;
  uniform vec2 uAspect;
  varying float vSeed;

  void main() {
    vec4 state = texture2D(uState, aReference);
    vSeed = state.w;
    gl_PointSize = 10.0 * uHeightScale * uPixelRatio;
    gl_Position = vec4((state.xy - 0.5) * 2.0 * uAspect, 0.0, 1.0);
  }
`

const DENSITY_FRAGMENT = /* glsl */ `
  varying float vSeed;

  void main() {
    if (vSeed < 0.76) discard;

    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);
    if (dist > 0.5) discard;

    float soft = smoothstep(0.5, 0.0, dist);
    gl_FragColor = vec4(1.0, 1.0, 1.0, soft * 0.045);
  }
`

const random = (min: number, max: number) => min + Math.random() * (max - min)
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

function createGraph() {
  nodes = []
  edges = []
  nodeParent = []
  nodeDepth = []
  nodeChildren = []
  leafNodes = []
  branchMembers.clear()
  branchRootByLeaf.clear()
  displayPositions = []
  activeBranch = null
  swayTarget = 0
  swayAmplitude = 0

  const mobile = width < 640
  const rings = mobile ? MOBILE_RADIAL_RINGS : RADIAL_RINGS
  const edgeKeys = new Set<string>()

  const addEdge = (a: number, b: number) => {
    if (a === b) return
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    if (edgeKeys.has(key)) return
    edgeKeys.add(key)
    edges.push({ a, b })
  }

  nodes.push({
    x: 0.5,
    y: 0.5,
    size: 0.009,
    alpha: 0.95,
    cluster: 0
  })
  nodeParent.push(-1)
  nodeDepth.push(0)
  nodeChildren.push([])

  const ringStarts: number[] = []

  rings.forEach((ring, ringIndex) => {
    ringStarts.push(nodes.length)

    for (let index = 0; index < ring.count; index++) {
      const angle = (index / ring.count) * TAU
      const radius = ring.radius

      nodes.push({
        x: clamp01(0.5 + Math.cos(angle) * radius),
        y: clamp01(0.5 + Math.sin(angle) * radius),
        size: 0.0052 - ringIndex * 0.00055,
        alpha: 0.62 - ringIndex * 0.07,
        cluster: ringIndex + 1
      })
      nodeParent.push(-1)
      nodeDepth.push(ringIndex + 1)
      nodeChildren.push([])
    }
  })

  for (let ringIndex = 0; ringIndex < rings.length; ringIndex++) {
    const currentStart = ringStarts[ringIndex]
    const currentCount = rings[ringIndex].count
    const previousStart = ringIndex === 0 ? 0 : ringStarts[ringIndex - 1]
    const previousCount = ringIndex === 0 ? 1 : rings[ringIndex - 1].count

    for (let index = 0; index < currentCount; index++) {
      const parent =
        ringIndex === 0
          ? 0
          : previousStart +
            Math.floor((index * previousCount) / currentCount)
      const nodeIndex = currentStart + index

      nodeParent[nodeIndex] = parent
      nodeChildren[parent].push(nodeIndex)
      addEdge(parent, nodeIndex)
    }
  }

  const outerStart = ringStarts[rings.length - 1]
  const outerCount = rings[rings.length - 1].count
  leafNodes = Array.from({ length: outerCount }, (_, index) => outerStart + index)

  const branchDepth = Math.min(2, rings.length - 1)

  for (const leaf of leafNodes) {
    let branchRoot = leaf
    for (let depth = nodeDepth[leaf]; depth > branchDepth; depth--) {
      branchRoot = nodeParent[branchRoot]
    }

    branchRootByLeaf.set(leaf, branchRoot)

    if (!branchMembers.has(branchRoot)) {
      const members: number[] = []
      const stack = [branchRoot]

      while (stack.length) {
        const current = stack.pop()!
        members.push(current)
        for (const child of nodeChildren[current]) {
          stack.push(child)
        }
      }

      branchMembers.set(branchRoot, members)
    }
  }

  displayPositions = nodes.map(node => ({ x: node.x, y: node.y }))
}

function createFlowTexture() {
  const canvasEl = document.createElement('canvas')
  canvasEl.width = FLOW_SIZE
  canvasEl.height = FLOW_SIZE

  const context = canvasEl.getContext('2d')
  if (!context) return null

  const image = context.createImageData(FLOW_SIZE, FLOW_SIZE)
  const data = image.data

  for (let py = 0; py < FLOW_SIZE; py++) {
    const y = 1 - (py + 0.5) / FLOW_SIZE

    for (let px = 0; px < FLOW_SIZE; px++) {
      const x = (px + 0.5) / FLOW_SIZE
      let bestDistance = Infinity
      let bestX = x
      let bestY = y
      let tangentX = 0
      let tangentY = 0

      for (const edge of edges) {
        const a = nodes[edge.a]
        const b = nodes[edge.b]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const lengthSq = dx * dx + dy * dy
        if (lengthSq === 0) continue

        const t = clamp01(((x - a.x) * dx + (y - a.y) * dy) / lengthSq)
        const nearestX = a.x + dx * t
        const nearestY = a.y + dy * t
        const distance = Math.hypot(x - nearestX, y - nearestY)

        if (distance < bestDistance) {
          bestDistance = distance
          bestX = nearestX
          bestY = nearestY
          const length = Math.sqrt(lengthSq)
          tangentX = dx / length
          tangentY = dy / length
        }
      }

      let dirX = 0
      let dirY = 0

      if (Number.isFinite(bestDistance)) {
        const invDistance = bestDistance > 1e-6 ? 1 / bestDistance : 0
        const inwardX = (bestX - x) * invDistance
        const inwardY = (bestY - y) * invDistance
        const inwardWeight = Math.min(0.88, bestDistance * 22)
        const tangentWeight = 1 - inwardWeight

        dirX = tangentX * tangentWeight + inwardX * inwardWeight
        dirY = tangentY * tangentWeight + inwardY * inwardWeight

        const length = Math.hypot(dirX, dirY) || 1
        dirX /= length
        dirY /= length
      }

      const offset = (py * FLOW_SIZE + px) * 4
      data[offset] = Math.round((dirX * 0.5 + 0.5) * 255)
      data[offset + 1] = Math.round((dirY * 0.5 + 0.5) * 255)
      data[offset + 2] = 128
      data[offset + 3] = 255
    }
  }

  context.putImageData(image, 0, 0)

  const texture = new THREE.CanvasTexture(canvasEl)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = false
  texture.colorSpace = THREE.NoColorSpace
  texture.flipY = true
  texture.needsUpdate = true

  return texture
}

function createParticleTextures() {
  const count = PARTICLE_SIZE * PARTICLE_SIZE
  const stateData = new Float32Array(count * 4)
  const initialData = new Float32Array(count * 4)

  for (let index = 0; index < count; index++) {
    const edge = edges[Math.floor(Math.random() * edges.length)]
    const a = nodes[edge.a]
    const b = nodes[edge.b]
    const t = Math.random()
    const jitter = 0.0035
    const x = clamp01(a.x + (b.x - a.x) * t + (Math.random() - 0.5) * jitter)
    const y = clamp01(a.y + (b.y - a.y) * t + (Math.random() - 0.5) * jitter)
    const seed = Math.random()
    const offset = index * 4

    stateData[offset] = x
    stateData[offset + 1] = y
    stateData[offset + 2] = Math.random() * PARTICLE_LIFE
    stateData[offset + 3] = seed

    initialData[offset] = x
    initialData[offset + 1] = y
    initialData[offset + 2] = 0
    initialData[offset + 3] = seed
  }

  const state = new THREE.DataTexture(
    stateData,
    PARTICLE_SIZE,
    PARTICLE_SIZE,
    THREE.RGBAFormat,
    THREE.FloatType
  )
  state.minFilter = THREE.NearestFilter
  state.magFilter = THREE.NearestFilter
  state.needsUpdate = true

  const initial = new THREE.DataTexture(
    initialData,
    PARTICLE_SIZE,
    PARTICLE_SIZE,
    THREE.RGBAFormat,
    THREE.FloatType
  )
  initial.minFilter = THREE.NearestFilter
  initial.magFilter = THREE.NearestFilter
  initial.needsUpdate = true

  return { state, initial }
}

function buildStaticNetwork() {
  if (!scene) return

  const linePositions = new Float32Array(edges.length * 6)
  edges.forEach((edge, index) => {
    const a = nodes[edge.a]
    const b = nodes[edge.b]
    linePositions[index * 6] = a.x
    linePositions[index * 6 + 1] = a.y
    linePositions[index * 6 + 2] = 0
    linePositions[index * 6 + 3] = b.x
    linePositions[index * 6 + 4] = b.y
    linePositions[index * 6 + 5] = 0
  })

  lineGeometry = new THREE.BufferGeometry()
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))

  lineMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uDensity: shared.uDensity,
      uColor: shared.uColor,
      uAccent: shared.uAccent,
      uLineOpacity: shared.uLineOpacity,
      uAspect: shared.uAspect
    },
    vertexShader: LINE_VERTEX,
    fragmentShader: LINE_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false
  })

  lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
  lineMesh.frustumCulled = false
  lineMesh.renderOrder = 0
  scene.add(lineMesh)

  const positions = new Float32Array(nodes.length * 3)
  const sizes = new Float32Array(nodes.length)
  const alphas = new Float32Array(nodes.length)

  nodes.forEach((node, index) => {
    positions[index * 3] = node.x
    positions[index * 3 + 1] = node.y
    positions[index * 3 + 2] = 0
    sizes[index] = node.size
    alphas[index] = node.alpha
  })

  nodeGeometry = new THREE.BufferGeometry()
  nodeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  nodeGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  nodeGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))

  nodeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uDensity: shared.uDensity,
      uColor: shared.uColor,
      uAccent: shared.uAccent,
      uHeight: shared.uHeight,
      uPixelRatio: shared.uPixelRatio,
      uAspect: shared.uAspect
    },
    vertexShader: NODE_VERTEX,
    fragmentShader: NODE_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false
  })

  nodePoints = new THREE.Points(nodeGeometry, nodeMaterial)
  nodePoints.frustumCulled = false
  nodePoints.renderOrder = 1
  scene.add(nodePoints)
}

function buildGpuParticles() {
  if (!scene || !densityScene || !renderer) return

  flowTexture = createFlowTexture()
  if (!flowTexture) return
  shared.uFlow.value = flowTexture

  const textures = createParticleTextures()
  stateTexture = textures.state
  initialTexture = textures.initial

  gpuCompute = new GPUComputationRenderer(PARTICLE_SIZE, PARTICLE_SIZE, renderer)
  const variable = gpuCompute.addVariable('uState', COMPUTE_SHADER, stateTexture)
  stateVariable = variable
  gpuCompute.setVariableDependencies(variable, [variable])

  variable.material.uniforms.uFlow = { value: flowTexture }
  variable.material.uniforms.uInitial = { value: initialTexture }
  variable.material.uniforms.uDelta = { value: 0 }
  variable.material.uniforms.uLife = { value: PARTICLE_LIFE }
  variable.wrapS = THREE.ClampToEdgeWrapping
  variable.wrapT = THREE.ClampToEdgeWrapping

  const error = gpuCompute.init()
  if (error) {
    console.error('[NeuralBackgroundGpu]', error)
    return
  }

  const initialRenderTarget = gpuCompute.getCurrentRenderTarget(variable)
  shared.uState.value = initialRenderTarget.texture

  const count = PARTICLE_SIZE * PARTICLE_SIZE
  const references = new Float32Array(count * 2)
  const placeholderPositions = new Float32Array(count * 3)

  for (let index = 0; index < count; index++) {
    references[index * 2] = ((index % PARTICLE_SIZE) + 0.5) / PARTICLE_SIZE
    references[index * 2 + 1] =
      (Math.floor(index / PARTICLE_SIZE) + 0.5) / PARTICLE_SIZE
  }

  particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(placeholderPositions, 3)
  )
  particleGeometry.setAttribute(
    'aReference',
    new THREE.BufferAttribute(references, 2)
  )

  particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uState: shared.uState,
      uPixelRatio: shared.uPixelRatio,
      uHeightScale: shared.uHeightScale,
      uAspect: shared.uAspect,
      uInterestColor: shared.uInterestColor,
      uDataColor: shared.uDataColor
    },
    vertexShader: PARTICLE_VERTEX,
    fragmentShader: PARTICLE_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false
  })

  particlePoints = new THREE.Points(particleGeometry, particleMaterial)
  particlePoints.frustumCulled = false
  particlePoints.renderOrder = 3
  scene.add(particlePoints)

  ghostMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uState: shared.uState,
      uFlow: shared.uFlow,
      uPixelRatio: shared.uPixelRatio,
      uHeightScale: shared.uHeightScale,
      uAspect: shared.uAspect,
      uInterestColor: shared.uInterestColor,
      uDataColor: shared.uDataColor
    },
    vertexShader: GHOST_VERTEX,
    fragmentShader: GHOST_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false
  })

  ghostPoints = new THREE.Points(particleGeometry, ghostMaterial)
  ghostPoints.frustumCulled = false
  ghostPoints.renderOrder = 2
  scene.add(ghostPoints)

  densityMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uState: shared.uState,
      uPixelRatio: shared.uPixelRatio,
      uHeightScale: shared.uHeightScale,
      uAspect: shared.uAspect
    },
    vertexShader: DENSITY_VERTEX,
    fragmentShader: DENSITY_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  densityPoints = new THREE.Points(particleGeometry, densityMaterial)
  densityPoints.frustumCulled = false
  densityScene.add(densityPoints)
}

function buildDensityTarget() {
  densityTarget = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    depthBuffer: false,
    stencilBuffer: false
  })
  densityTarget.texture.generateMipmaps = false
  densityTarget.texture.colorSpace = THREE.NoColorSpace
  shared.uDensity.value = densityTarget.texture
}

function getPalette(): Palette {
  return colorMode.value === 'dark'
    ? {
        node: '#e2e8f0',
        accent: '#34d399',
        interest: '#94a3b8',
        data: '#34d399',
        lineOpacity: 0.22
      }
    : {
        node: '#0f172a',
        accent: '#059669',
        interest: '#64748b',
        data: '#047857',
        lineOpacity: 0.2
      }
}

function applyTheme() {
  const palette = getPalette()
  shared.uColor.value.set(palette.node)
  shared.uAccent.value.set(palette.accent)
  shared.uInterestColor.value.set(palette.interest)
  shared.uDataColor.value.set(palette.data)
  shared.uLineOpacity.value = palette.lineOpacity
}

function resizeRenderer() {
  if (!renderer || !container.value || !densityTarget) return

  const rect = container.value.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return

  width = rect.width
  height = rect.height

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(width, height, false)

  densityTarget.setSize(
    Math.max(1, Math.round((width * pixelRatio) / 2)),
    Math.max(1, Math.round((height * pixelRatio) / 2))
  )

  shared.uPixelRatio.value = pixelRatio
  shared.uHeight.value = height
  shared.uHeightScale.value = height / 900
  const minDimension = Math.min(width, height)
  shared.uAspect.value.set(minDimension / width, minDimension / height)
  shared.uDensity.value = densityTarget.texture
}

function applyTreeGeometry() {
  if (!nodeGeometry || !lineGeometry) return

  const nodeAttribute = nodeGeometry.getAttribute('position') as
    | THREE.BufferAttribute
    | undefined
  const lineAttribute = lineGeometry.getAttribute('position') as
    | THREE.BufferAttribute
    | undefined
  if (!nodeAttribute || !lineAttribute) return

  const nodeArray = nodeAttribute.array as Float32Array
  const lineArray = lineAttribute.array as Float32Array

  for (let index = 0; index < nodes.length; index++) {
    nodeArray[index * 3] = displayPositions[index].x
    nodeArray[index * 3 + 1] = displayPositions[index].y
    nodeArray[index * 3 + 2] = 0
  }

  for (let index = 0; index < edges.length; index++) {
    const a = displayPositions[edges[index].a]
    const b = displayPositions[edges[index].b]
    const offset = index * 6
    lineArray[offset] = a.x
    lineArray[offset + 1] = a.y
    lineArray[offset + 2] = 0
    lineArray[offset + 3] = b.x
    lineArray[offset + 4] = b.y
    lineArray[offset + 5] = 0
  }

  nodeAttribute.needsUpdate = true
  lineAttribute.needsUpdate = true
}

function resetTreeGeometry() {
  if (!nodeGeometry || !lineGeometry) return

  for (let index = 0; index < nodes.length; index++) {
    displayPositions[index].x = nodes[index].x
    displayPositions[index].y = nodes[index].y
  }

  applyTreeGeometry()
}

function updateTreeSway(delta: number) {
  if (!nodeGeometry || !lineGeometry) return
  if (swayTarget === 0 && activeBranch === null) return

  swayClock += delta
  swayAmplitude +=
    (swayTarget - swayAmplitude) * Math.min(1, delta * 8)

  if (activeBranch === null) return

  const members = branchMembers.get(activeBranch)
  const pivotIndex = nodeParent[activeBranch]
  if (!members || pivotIndex < 0) return

  const pivot = nodes[pivotIndex]
  const angle =
    (Math.sin(swayClock * 2.1) * 0.11 +
      Math.sin(swayClock * 3.7 + 0.6) * 0.025) *
    swayAmplitude

  for (let index = 0; index < nodes.length; index++) {
    displayPositions[index].x = nodes[index].x
    displayPositions[index].y = nodes[index].y
  }

  if (Math.abs(angle) > 1e-5) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    for (const index of members) {
      const dx = nodes[index].x - pivot.x
      const dy = nodes[index].y - pivot.y
      displayPositions[index].x = pivot.x + dx * cos - dy * sin
      displayPositions[index].y = pivot.y + dx * sin + dy * cos
    }
  }

  applyTreeGeometry()

  if (swayTarget === 0 && swayAmplitude < 0.002) {
    swayAmplitude = 0
    activeBranch = null
  }
}

function findLeafAt(clientX: number, clientY: number) {
  const element = container.value
  if (!element || !leafNodes.length) return null

  const rect = element.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null

  const aspect = shared.uAspect.value
  const hitRadiusSquared = 18 * 18
  let closest: number | null = null
  let closestDistance = hitRadiusSquared

  for (const leaf of leafNodes) {
    const node = nodes[leaf]
    const ndcX = (node.x - 0.5) * 2 * aspect.x
    const ndcY = (node.y - 0.5) * 2 * aspect.y
    const screenX = ((ndcX + 1) * 0.5) * rect.width
    const screenY = ((1 - ndcY) * 0.5) * rect.height
    const dx = screenX - x
    const dy = screenY - y
    const distance = dx * dx + dy * dy

    if (distance < closestDistance) {
      closestDistance = distance
      closest = leaf
    }
  }

  return closest
}

function setHoveredLeaf(leaf: number | null) {
  if (prefersReducedMotion.value) return

  const branchRoot = leaf === null ? null : branchRootByLeaf.get(leaf) ?? null

  if (branchRoot === null) {
    swayTarget = 0
    return
  }

  if (branchRoot !== activeBranch) {
    activeBranch = branchRoot
    swayAmplitude = 0
    swayClock = 0
  }

  swayTarget = 1
  start()
}

function handlePointerMove(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  setHoveredLeaf(findLeafAt(event.clientX, event.clientY))
}

function handlePointerLeave() {
  swayTarget = 0
}

function renderFrame(delta: number) {
  if (
    !renderer ||
    !scene ||
    !densityScene ||
    !camera ||
    !gpuCompute ||
    !stateVariable ||
    !densityTarget
  ) {
    return
  }

  updateTreeSway(delta)

  stateVariable.material.uniforms.uDelta.value = delta
  gpuCompute.compute()

  const currentState = gpuCompute.getCurrentRenderTarget(stateVariable).texture
  shared.uState.value = currentState

  renderer.setRenderTarget(densityTarget)
  renderer.setClearColor(0x000000, 0)
  renderer.clear()
  renderer.render(densityScene, camera)

  renderer.setRenderTarget(null)
  renderer.setClearColor(0xffffff, 0)
  renderer.clear()
  renderer.render(scene, camera)
}

function tick(now: number) {
  if (!running) return
  rafId = requestAnimationFrame(tick)

  const delta = Math.min((now - lastFrame) / 1000, 0.05)
  lastFrame = now
  renderFrame(delta)
}

function start() {
  if (running || prefersReducedMotion.value || !visible || document.hidden) return
  running = true
  lastFrame = performance.now()
  rafId = requestAnimationFrame(tick)
}

function stop() {
  running = false
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

function handleResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    resizeRenderer()
    if (!running) renderFrame(0)
  }, 140)
}

function handleVisibility() {
  if (document.hidden) {
    stop()
  } else if (visible) {
    start()
  }
}

function handleMotionChange() {
  prefersReducedMotion.value = motionQuery?.matches ?? false
  if (prefersReducedMotion.value) {
    activeBranch = null
    swayTarget = 0
    swayAmplitude = 0
    stop()
    resetTreeGeometry()
    renderFrame(0)
  } else if (visible) {
    start()
  }
}

async function setup() {
  const containerElement = container.value
  const canvasElement = canvas.value
  if (!containerElement || !canvasElement) return

  renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0xffffff, 0)

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  scene = new THREE.Scene()
  densityScene = new THREE.Scene()

  width = containerElement.getBoundingClientRect().width
  height = containerElement.getBoundingClientRect().height
  if (width < 1 || height < 1) return

  createGraph()
  buildDensityTarget()
  buildStaticNetwork()
  buildGpuParticles()

  if (!gpuCompute || !stateVariable) return

  resizeRenderer()
  applyTheme()
  renderFrame(0)

  if (!prefersReducedMotion.value) {
    start()
  }
}

onMounted(async () => {
  await nextTick()
  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)
  document.addEventListener('visibilitychange', handleVisibility)

  await setup()

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('blur', handlePointerLeave)
  document.addEventListener('pointerleave', handlePointerLeave)

  if (container.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container.value)

    intersectionObserver = new IntersectionObserver(
      entries => {
        visible = entries[0]?.isIntersecting ?? true
        if (visible) {
          start()
        } else {
          stop()
        }
      },
      { threshold: 0 }
    )
    intersectionObserver.observe(container.value)
  }
})

watch(
  () => colorMode.value,
  () => {
    applyTheme()
    if (!running) renderFrame(0)
  }
)

onBeforeUnmount(() => {
  stop()
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
  document.removeEventListener('visibilitychange', handleVisibility)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('blur', handlePointerLeave)
  document.removeEventListener('pointerleave', handlePointerLeave)
  if (resizeTimer) clearTimeout(resizeTimer)

  gpuCompute?.dispose()
  densityTarget?.dispose()
  flowTexture?.dispose()
  stateTexture?.dispose()
  initialTexture?.dispose()
  particleGeometry?.dispose()
  lineMesh?.geometry.dispose()
  nodePoints?.geometry.dispose()
  lineMaterial?.dispose()
  nodeMaterial?.dispose()
  particleMaterial?.dispose()
  ghostMaterial?.dispose()
  densityMaterial?.dispose()
  renderer?.dispose()
})
</script>
