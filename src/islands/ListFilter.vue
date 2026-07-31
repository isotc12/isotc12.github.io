<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  items: any[]
  fields: string[]
  placeholder?: string
  pageSize?: number
}>(), {
  placeholder: 'Search…',
  pageSize: 50,
})

const query = ref('')
const visibleCount = ref(props.pageSize)

const filtered = computed(() => {
  if (!query.value.trim()) return props.items
  const q = query.value.toLowerCase()
  return props.items.filter(item =>
    props.fields.some(f => {
      const val = item[f]
      return val && String(val).toLowerCase().includes(q)
    })
  )
})

const visible = computed(() => filtered.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < filtered.value.length)

function showMore() {
  visibleCount.value += props.pageSize
}
</script>

<template>
  <div class="list-filter">
    <input
      v-model="query"
      type="search"
      :placeholder="placeholder"
      class="list-filter__input"
      aria-label="Filter"
    />
    <p class="list-filter__count">{{ filtered.length }} result{{ filtered.length !== 1 ? 's' : '' }}</p>
    <slot name="default" :items="visible" />
    <button v-if="hasMore" @click="showMore" class="list-filter__more">
      Show {{ Math.min(pageSize, filtered.length - visibleCount.value) }} more →
    </button>
  </div>
</template>

<style scoped>
.list-filter { margin-bottom: 1.5rem; }
.list-filter__input {
  width: 100%;
  padding: 0.625rem 1rem;
  font-size: 0.9375rem;
  font-family: inherit;
  background: var(--bg);
  color: var(--ink);
  border: 1px solid var(--rule);
  border-radius: 0.375rem;
  outline: none;
  transition: border-color 0.15s;
}
.list-filter__input:focus { border-color: var(--accent); }
.list-filter__count {
  margin: 0.5rem 0 1rem;
  font-size: 0.75rem;
  color: var(--ink-muted);
  font-family: var(--font-mono);
}
.list-filter__more {
  display: block;
  width: 100%;
  padding: 0.625rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s;
}
.list-filter__more:hover { border-color: var(--accent); background: var(--bg-elevated); }
</style>
