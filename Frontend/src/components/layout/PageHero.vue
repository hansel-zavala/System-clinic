<template>
  <div class="page-head" role="region" :aria-label="ariaLabel ?? title">
    <div class="head-text">
      <span v-if="pill" class="pill">{{ pill }}</span>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-head-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  /** Etiqueta superior opcional (ej. «Agenda»). */
  pill?: string
  /** Texto accesible del bloque (por defecto el título). */
  ariaLabel?: string
}>()
</script>
