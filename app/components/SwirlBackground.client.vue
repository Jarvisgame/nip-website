<template>
  <div
    ref="container"
    class="pointer-events-none absolute inset-0 overflow-hidden"
    aria-hidden="true"
  >
    <canvas ref="canvas" class="absolute inset-0 block h-full w-full" />
    <div class="swirl-veil absolute inset-0" />
  </div>
</template>

<style scoped>
.swirl-veil {
  background: linear-gradient(
    90deg,
    var(--ui-bg) 0%,
    color-mix(in oklab, var(--ui-bg) 92%, transparent) 20%,
    color-mix(in oklab, var(--ui-bg) 62%, transparent) 40%,
    transparent 60%
  );
}

@media (max-width: 1023px) {
  .swirl-veil {
    background: linear-gradient(
      180deg,
      var(--ui-bg) 0%,
      color-mix(in oklab, var(--ui-bg) 82%, transparent) 42%,
      transparent 82%
    );
  }
}
</style>

<script setup lang="ts">
/**
 * Ambient "Swirl" background, adapted from Codrops Ambient Canvas Backgrounds.
 *
 * A simplex-noise flow field drives hundreds of short particle trails. The
 * trails are drawn to an offscreen canvas, then composited with a blurred
 * glow layer. Light mode uses colored ink on white; dark mode uses additive
 * glow on the dark hero.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useColorMode } from '#imports'
import { createNoise3D } from 'simplex-noise'

const TAU = Math.PI * 2
const PARTICLE_PROPS = 9
const BASE_TTL = 50
const RANGE_TTL = 150
const BASE_SPEED = 0.1
const RANGE_SPEED = 2
const BASE_RADIUS = 1
const RANGE_RADIUS = 4
const BASE_HUE = 158
const RANGE_HUE = 72
const NOISE_STEPS = 8
const X_OFF = 0.00125
const Y_OFF = 0.00125
const Z_OFF = 0.0005
const RANGE_Y = 100

const container = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const colorMode = useColorMode()
const prefersReducedMotion = ref(false)
const noise3D = createNoise3D()

let visibleCtx: CanvasRenderingContext2D | null = null
let sourceCanvas: HTMLCanvasElement | null = null
let sourceCtx: CanvasRenderingContext2D | null = null
let particleProps = new Float32Array(0)
let particleCount = 0
let width = 0
let height = 0
let centerY = 0
let time = 0
let running = false
let visible = true
let frameId = 0
let resizeTimer: ReturnType<typeof setTimeout> | undefined
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined
let motionQuery: MediaQueryList | undefined

const random = (max: number) => max * Math.random()
const randRange = (n: number) => n - random(2 * n)
const lerp = (from: number, to: number, amount: number) =>
  (1 - amount) * from + amount * to
const fadeInOut = (life: number, ttl: number) => {
  const half = 0.5 * ttl
  return Math.abs(((life + half) % ttl) - half) / half
}

function getTheme() {
  return colorMode.value === 'dark'
    ? { saturation: 84, lightness: 62, alpha: 1, dark: true }
    : { saturation: 78, lightness: 38, alpha: 0.9, dark: false }
}

function initParticle(index: number) {
  const x = random(width)
  const y = centerY + randRange(RANGE_Y)
  const ttl = BASE_TTL + random(RANGE_TTL)
  const scale = Math.max(0.72, Math.min(1.2, height / 900))
  const radius = (BASE_RADIUS + random(RANGE_RADIUS)) * scale
  const speed = (BASE_SPEED + random(RANGE_SPEED)) * scale
  const hue = BASE_HUE + random(RANGE_HUE)

  particleProps[index] = x
  particleProps[index + 1] = y
  particleProps[index + 2] = 0
  particleProps[index + 3] = 0
  particleProps[index + 4] = 0
  particleProps[index + 5] = ttl
  particleProps[index + 6] = speed
  particleProps[index + 7] = radius
  particleProps[index + 8] = hue
}

function initParticles() {
  particleCount = width < 640 ? 560 : 1300
  particleProps = new Float32Array(particleCount * PARTICLE_PROPS)
  time = 0

  for (let index = 0; index < particleProps.length; index += PARTICLE_PROPS) {
    initParticle(index)
  }
}

function drawParticle(
  x: number,
  y: number,
  nextX: number,
  nextY: number,
  life: number,
  ttl: number,
  radius: number,
  hue: number
) {
  if (!sourceCtx) return

  const theme = getTheme()
  const alpha = fadeInOut(life, ttl) * theme.alpha

  sourceCtx.save()
  sourceCtx.lineCap = 'round'
  sourceCtx.lineWidth = radius
  sourceCtx.strokeStyle = `hsla(${hue}, ${theme.saturation}%, ${theme.lightness}%, ${alpha})`
  sourceCtx.beginPath()
  sourceCtx.moveTo(x, y)
  sourceCtx.lineTo(nextX, nextY)
  sourceCtx.stroke()
  sourceCtx.restore()
}

function updateParticle(index: number) {
  const x = particleProps[index]
  const y = particleProps[index + 1]
  const angle =
    noise3D(x * X_OFF, y * Y_OFF, time * Z_OFF) * NOISE_STEPS * TAU
  const vx = lerp(particleProps[index + 2], Math.cos(angle), 0.5)
  const vy = lerp(particleProps[index + 3], Math.sin(angle), 0.5)
  const life = particleProps[index + 4]
  const ttl = particleProps[index + 5]
  const speed = particleProps[index + 6]
  const radius = particleProps[index + 7]
  const hue = particleProps[index + 8]
  const nextX = x + vx * speed
  const nextY = y + vy * speed

  drawParticle(x, y, nextX, nextY, life, ttl, radius, hue)

  particleProps[index] = nextX
  particleProps[index + 1] = nextY
  particleProps[index + 2] = vx
  particleProps[index + 3] = vy
  particleProps[index + 4] = life + 1

  if (
    nextX < 0 ||
    nextX > width ||
    nextY < 0 ||
    nextY > height ||
    life > ttl
  ) {
    initParticle(index)
  }
}

function drawParticles() {
  for (let index = 0; index < particleProps.length; index += PARTICLE_PROPS) {
    updateParticle(index)
  }
}

function render() {
  if (!visibleCtx || !sourceCanvas) return

  const theme = getTheme()
  visibleCtx.clearRect(0, 0, width, height)
  visibleCtx.save()

  if (theme.dark) {
    visibleCtx.globalCompositeOperation = 'lighter'
    visibleCtx.filter = 'blur(8px) brightness(180%)'
    visibleCtx.drawImage(sourceCanvas, 0, 0, width, height)
    visibleCtx.filter = 'blur(4px) brightness(180%)'
    visibleCtx.drawImage(sourceCanvas, 0, 0, width, height)
    visibleCtx.filter = 'none'
    visibleCtx.drawImage(sourceCanvas, 0, 0, width, height)
  } else {
    visibleCtx.globalCompositeOperation = 'source-over'
    visibleCtx.globalAlpha = 0.25
    visibleCtx.filter = 'blur(7px)'
    visibleCtx.drawImage(sourceCanvas, 0, 0, width, height)
    visibleCtx.filter = 'none'
    visibleCtx.globalAlpha = 0.78
    visibleCtx.drawImage(sourceCanvas, 0, 0, width, height)
  }

  visibleCtx.restore()
}

function step() {
  if (!sourceCtx) return

  const theme = getTheme()
  time++

  if (theme.dark) {
    sourceCtx.clearRect(0, 0, width, height)
  } else {
    sourceCtx.globalCompositeOperation = 'destination-out'
    sourceCtx.fillStyle = 'rgba(0, 0, 0, 0.075)'
    sourceCtx.fillRect(0, 0, width, height)
    sourceCtx.globalCompositeOperation = 'source-over'
  }

  drawParticles()
  render()
}

function warmup(frames: number) {
  for (let index = 0; index < frames; index++) {
    step()
  }
}

function tick() {
  if (!running) return
  frameId = requestAnimationFrame(tick)
  step()
}

function start() {
  if (running || prefersReducedMotion.value || !visible || document.hidden) return
  running = true
  frameId = requestAnimationFrame(tick)
}

function stop() {
  running = false
  if (frameId) {
    cancelAnimationFrame(frameId)
    frameId = 0
  }
}

function resize() {
  const element = container.value
  const target = canvas.value
  if (!element || !target || !sourceCanvas || !sourceCtx) return

  const rect = element.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return
  if (Math.abs(rect.width - width) < 1 && Math.abs(rect.height - height) < 1) {
    return
  }

  width = rect.width
  height = rect.height
  centerY = height * 0.5

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)

  target.width = Math.round(width * pixelRatio)
  target.height = Math.round(height * pixelRatio)
  visibleCtx = target.getContext('2d')
  if (!visibleCtx) return
  visibleCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  sourceCanvas.width = target.width
  sourceCanvas.height = target.height
  sourceCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  initParticles()
  warmup(40)
}

function handleResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    resize()
    if (!running) render()
  }, 160)
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
    stop()
    render()
  } else if (visible) {
    start()
  }
}

onMounted(async () => {
  await nextTick()
  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  sourceCanvas = document.createElement('canvas')
  sourceCtx = sourceCanvas.getContext('2d')
  if (!sourceCtx || !canvas.value) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)
  document.addEventListener('visibilitychange', handleVisibility)

  resize()
  render()

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

  if (!prefersReducedMotion.value) {
    start()
  }
})

watch(
  () => colorMode.value,
  () => {
    sourceCtx?.clearRect(0, 0, width, height)
    if (!running) {
      warmup(40)
    }
    render()
  }
)

onBeforeUnmount(() => {
  stop()
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
  document.removeEventListener('visibilitychange', handleVisibility)
  if (resizeTimer) clearTimeout(resizeTimer)
  visibleCtx = null
  sourceCtx = null
  sourceCanvas = null
})
</script>
