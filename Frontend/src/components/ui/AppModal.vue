<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="app-modal-backdrop"
      @click.self="emit('close')"
    >
      <article
        class="app-modal surface-card"
        :class="size === 'lg' ? 'app-modal--lg' : 'app-modal--md'"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <header class="app-modal-head">
          <div class="app-modal-head-main">
            <slot name="header" />
          </div>
          <button type="button" class="app-modal-close" aria-label="Cerrar" @click="emit('close')">
            <X :size="22" />
          </button>
        </header>
        <div class="app-modal-body" :class="{ 'app-modal-body--stack': stackBody }">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="app-modal-foot">
          <slot name="footer" />
        </footer>
      </article>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    open: boolean
    /** id del elemento que etiqueta el título (atributo aria-labelledby). */
    titleId: string
    /** Ancho máximo del panel. */
    size?: 'md' | 'lg'
    /** Cuerpo en grid apilado (formularios largos). */
    stackBody?: boolean
  }>(),
  { size: 'md', stackBody: false },
)

const emit = defineEmits<{
  close: []
}>()
</script>

<style scoped>
.app-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(13, 30, 42, 0.45);
  display: grid;
  place-items: center;
  padding: 16px;
  backdrop-filter: blur(4px);
}

.app-modal {
  width: 100%;
  max-height: min(92vh, 720px);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  animation: app-modal-enter 0.22s ease;
}

.app-modal--md {
  max-width: min(520px, 100%);
}

.app-modal--lg {
  max-width: min(560px, 100%);
}

@keyframes app-modal-enter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.app-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 18px 14px;
  background: linear-gradient(140deg, rgba(223, 240, 248, 0.7), rgba(255, 255, 255, 0.95));
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.app-modal-head-main {
  min-width: 0;
}

.app-modal-close {
  border: 0;
  padding: 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.85);
  color: var(--primary-dark);
  cursor: pointer;
  line-height: 0;
  flex-shrink: 0;
}
.app-modal-close:hover {
  background: #fff;
}

.app-modal-body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.app-modal-body--stack {
  display: grid;
  gap: 12px;
}

.app-modal-foot {
  padding: 14px 18px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.app-modal-foot :deep(.btn-secondary) {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 16px;
  font: inherit;
  font-weight: 700;
  color: var(--primary-dark);
  background: rgba(239, 246, 250, 0.95);
  cursor: pointer;
}

.app-modal-foot :deep(.btn-primary) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 10px;
  padding: 10px 18px;
  font: inherit;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(125deg, var(--primary), #2d7a9e);
  box-shadow: 0 4px 14px rgba(58, 143, 183, 0.28);
}
</style>
