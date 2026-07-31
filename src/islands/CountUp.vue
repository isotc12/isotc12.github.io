<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  target: number
  duration?: number
}>(), {
  duration: 1500,
})

const display = ref(0)
const el = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let animationFrame: number | null = null
let started = false

onMounted(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) {
    display.value = props.target
    return
  }
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !started) {
      started = true
      const start = performance.now()
      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / props.duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        display.value = Math.round(eased * props.target)
        if (progress < 1) animationFrame = requestAnimationFrame(tick)
      }
      animationFrame = requestAnimationFrame(tick)
    }
  })
  if (el.value) observer.observe(el.value)
})

onUnmounted(() => {
  observer?.disconnect()
  if (animationFrame) cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <span ref="el">{{ display.toLocaleString() }}</span>
</template>
