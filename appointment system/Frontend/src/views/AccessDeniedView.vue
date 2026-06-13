<template>
  <section class="access-denied surface-card">
    <span class="icon" aria-hidden="true"><ShieldOff :size="44" /></span>
    <p class="text">{{ ACCESO_NO_AUTORIZADO }}</p>
    <div class="actions">
      <RouterLink to="/app/dashboard" class="btn primary">Ir al inicio</RouterLink>
      <RouterLink to="/login" class="btn ghost">Iniciar sesión</RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ShieldOff } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { ACCESO_NO_AUTORIZADO } from '../domain/messages'
</script>

<style scoped>
.access-denied {
  max-width: 520px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
}
.icon {
  display: inline-flex;
  color: var(--color-muted-foreground, #64748b);
  margin-bottom: 1rem;
}
.text {
  line-height: 1.55;
  margin: 0 0 1.5rem;
  color: var(--color-muted-foreground, #475569);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1.1rem;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
}
.btn.primary {
  background: var(--color-primary, #0f766e);
  color: #fff;
}
.btn.ghost {
  border: 1px solid var(--color-border, #e2e8f0);
  color: inherit;
}
</style>
