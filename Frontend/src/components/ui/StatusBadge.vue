<template>
  <span class="status" :class="variantClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AppointmentStatus, UserRole } from '../../domain/types'

const props = defineProps<{
  value: AppointmentStatus | UserRole
}>()

const label = computed(() => props.value)

const variantClass = computed(() => {
  const map: Record<string, string> = {
    pendiente: 'warning',
    confirmada: 'success',
    cancelada: 'danger',
    admin: 'primary',
    medico: 'secondary',
    paciente: 'neutral',
  }
  return map[props.value] ?? 'neutral'
})
</script>

<style scoped>
.status {
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 5px 10px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.primary {
  color: var(--primary-dark);
  background: #d8ecf5;
}
.secondary {
  color: #117169;
  background: #d9f3f0;
}
.neutral {
  color: #3f5d6f;
  background: #e8f0f4;
}
.success {
  color: #116947;
  background: #d8efe5;
}
.warning {
  color: #8d6118;
  background: #f9ecd2;
}
.danger {
  color: #9e3232;
  background: #f8dddd;
}
</style>
