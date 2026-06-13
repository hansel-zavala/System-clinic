<template>
  <article class="surface-card card">
    <span class="icon-wrap">
      <slot name="icon" />
    </span>
    <p class="label">{{ label }}</p>
    <p class="value">{{ value }}</p>
    <p class="caption">{{ caption }}</p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  caption: string
}>()
</script>

<style scoped>
.card {
  padding: 18px;
  position: relative;
  overflow: hidden;
}
.card::after {
  content: '';
  position: absolute;
  inset: auto -45px -45px auto;
  width: 130px;
  height: 130px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(58, 143, 183, 0.22), transparent 68%);
}
.label {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--primary-dark);
  background: linear-gradient(145deg, rgba(122, 181, 210, 0.22), rgba(111, 208, 185, 0.22));
  margin-bottom: 8px;
}
.value {
  margin: 10px 0;
  font-size: 2.1rem;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  color: var(--primary-dark);
}
.caption {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>
