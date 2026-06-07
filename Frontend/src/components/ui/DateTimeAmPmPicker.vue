<template>
  <div class="dt-picker" role="group" :aria-labelledby="labelId">
    <div class="dt-row">
      <label class="dt-field">
        <span class="dt-sublabel">Fecha</span>
        <input
          :id="`${idBase}-date`"
          v-model="dateYmd"
          type="date"
          class="input"
          :min="minDateYmd"
          :aria-describedby="hintId"
        />
      </label>
      <div class="dt-time-group">
        <label class="dt-field dt-field--narrow">
          <span class="dt-sublabel">Hora</span>
          <select :id="`${idBase}-hour`" v-model.number="hour12" class="input">
            <option v-for="h in hours12" :key="h" :value="h">{{ h }}</option>
          </select>
        </label>
        <span class="dt-sep" aria-hidden="true">:</span>
        <label class="dt-field dt-field--narrow">
          <span class="dt-sublabel">Min</span>
          <select :id="`${idBase}-min`" v-model.number="minute" class="input">
            <option v-for="m in minuteOptions" :key="m" :value="m">
              {{ String(m).padStart(2, '0') }}
            </option>
          </select>
        </label>
        <label class="dt-field dt-field--ampm">
          <span class="dt-sublabel"> </span>
          <select :id="`${idBase}-ampm`" v-model="meridiem" class="input">
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </label>
      </div>
    </div>
    <p v-if="validationMessage" :id="hintId" class="dt-hint dt-hint--err" role="alert">
      {{ validationMessage }}
    </p>
    <p v-else-if="previewLine" :id="hintId" class="dt-hint">{{ previewLine }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { formatDateTimeSystem } from '../../domain/datetimeDisplay'
import {
  isoFromLocalParts,
  minDateYmdLocal,
  MINUTE_STEP_OPTIONS,
  parseIsoToParts,
  snapMinuteToStep,
  to24Hour,
  isDateTimeNotInPast,
} from '../../domain/datetimePicker'

const props = withDefaults(
  defineProps<{
    modelValue: string
    /** id del elemento que etiqueta el grupo (p. ej. el label externo «Fecha y hora»). */
    labelId?: string
  }>(),
  { labelId: undefined },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const idBase = `dt-${Math.random().toString(36).slice(2, 9)}`
const hintId = `${idBase}-hint`

const hours12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
const minuteOptions = MINUTE_STEP_OPTIONS

const minDateYmd = computed(() => minDateYmdLocal())

const dateYmd = ref('')
const hour12 = ref(12)
const minute = ref(0)
const meridiem = ref<'AM' | 'PM'>('AM')

function applyFromModel(iso: string) {
  if (!iso?.trim()) {
    dateYmd.value = ''
    hour12.value = 12
    minute.value = 0
    meridiem.value = 'AM'
    return
  }
  const parts = parseIsoToParts(iso)
  if (!parts) return
  dateYmd.value = parts.dateYmd
  hour12.value = parts.hour12
  minute.value = snapMinuteToStep(parts.minute)
  meridiem.value = parts.meridiem
}

const syncingFromParent = ref(false)
/** Evita re-aplicar el mismo ISO que acabamos de emitir (el padre actualiza v-model y re-dispara el watch). */
const lastEmittedIso = ref<string | null>(null)

watch(
  () => props.modelValue,
  async (v) => {
    if (v === lastEmittedIso.value && v !== '') {
      lastEmittedIso.value = null
      return
    }
    syncingFromParent.value = true
    applyFromModel(v)
    await nextTick()
    syncingFromParent.value = false
  },
  { immediate: true },
)

watch([dateYmd, hour12, minute, meridiem], () => {
  if (syncingFromParent.value) return
  syncToParent()
})

const validationMessage = computed(() => {
  if (!dateYmd.value) return ''
  const h24 = to24Hour(hour12.value, meridiem.value)
  if (!isDateTimeNotInPast(dateYmd.value, h24, minute.value)) {
    return 'Elige una fecha y hora futuras.'
  }
  return ''
})

const previewLine = computed(() => {
  if (!dateYmd.value) return ''
  const h24 = to24Hour(hour12.value, meridiem.value)
  const iso = isoFromLocalParts(dateYmd.value, h24, minute.value)
  return `Vista previa: ${formatDateTimeSystem(iso)}`
})

function syncToParent() {
  if (!dateYmd.value) {
    lastEmittedIso.value = ''
    emit('update:modelValue', '')
    return
  }
  const h24 = to24Hour(hour12.value, meridiem.value)
  if (!isDateTimeNotInPast(dateYmd.value, h24, minute.value)) {
    lastEmittedIso.value = ''
    emit('update:modelValue', '')
    return
  }
  const iso = isoFromLocalParts(dateYmd.value, h24, minute.value)
  lastEmittedIso.value = iso
  emit('update:modelValue', iso)
}
</script>

<style scoped>
.dt-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.dt-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
}

.dt-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.dt-field--narrow {
  flex: 0 0 auto;
}

.dt-field--ampm {
  flex: 0 0 4.5rem;
}

.dt-sublabel {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.dt-time-group {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 6px;
}

.dt-sep {
  font-weight: 700;
  padding-bottom: 8px;
  color: var(--text-muted);
}

.input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  font-size: 0.92rem;
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-main);
}

.input:focus {
  outline: 2px solid rgba(58, 143, 183, 0.45);
  outline-offset: 1px;
}

.dt-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.dt-hint--err {
  color: var(--danger);
  font-weight: 600;
}
</style>
