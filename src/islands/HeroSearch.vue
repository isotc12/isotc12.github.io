<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  items: { label: string; sublabel?: string; url: string }[]
}>()

const query = ref('')
const focused = ref(false)
const activeIndex = ref(0)

const results = computed(() => {
  if (!query.value.trim()) return []
  const q = query.value.toLowerCase()
  return props.items
    .filter(i => i.label.toLowerCase().includes(q) || (i.sublabel?.toLowerCase().includes(q)))
    .slice(0, 8)
})

function navigate(url: string) {
  window.location.href = url
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex.value = Math.max(activeIndex.value - 1, 0) }
  else if (e.key === 'Enter' && results.value[activeIndex.value]) { navigate(results.value[activeIndex.value].url) }
  else if (e.key === 'Escape') { focused.value = false }
}
</script>

<template>
  <div class="hero-search" @focusin="focused = true" @focusout="setTimeout(() => focused = false, 200)">
    <input
      v-model="query"
      type="search"
      placeholder="Search standards, members, resolutions…"
      class="hero-search__input"
      @keydown="onKeydown"
      aria-label="Search"
    />
    <ul v-if="query && focused && results.length" class="hero-search__results">
      <li v-for="(r, i) in results" :key="r.url" :class="{ active: i === activeIndex }" @click="navigate(r.url)" @mouseenter="activeIndex = i">
        <span class="hero-search__label">{{ r.label }}</span>
        <span v-if="r.sublabel" class="hero-search__sublabel">{{ r.sublabel }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.hero-search { position: relative; max-width: 36rem; }
.hero-search__input {
  width: 100%; padding: 0.75rem 1rem;
  font-size: 1rem; font-family: inherit;
  background: var(--bg); color: var(--ink);
  border: 1px solid var(--rule-strong); border-radius: 0.5rem;
  outline: none; transition: border-color 0.15s;
}
.hero-search__input:focus { border-color: var(--accent); }
.hero-search__results {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
  list-style: none; margin: 0.25rem 0 0; padding: 0.375rem;
  background: var(--bg); border: 1px solid var(--rule); border-radius: 0.5rem;
  box-shadow: 0 20px 40px -12px rgba(0,0,0,0.12);
}
.hero-search__results li {
  display: flex; flex-direction: column; gap: 0.125rem;
  padding: 0.5rem 0.75rem; border-radius: 0.375rem; cursor: pointer;
  transition: background 0.1s;
}
.hero-search__results li.active { background: var(--bg-elevated); }
.hero-search__label { font-size: 0.9375rem; color: var(--ink); font-weight: 500; }
.hero-search__sublabel { font-size: 0.75rem; color: var(--ink-muted); }
</style>
