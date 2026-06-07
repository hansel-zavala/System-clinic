<template>
  <section class="settings-page">
    <PageHero
      pill="Sistema"
      title="Configuración"
      subtitle="Alta y baja de consultorios, motivos y duraciones. Si una cita usa un valor, el servidor impedirá borrarlo."
    >
      <template #actions>
        <RouterLink to="/app/dashboard" class="back-link">
          <ArrowLeft :size="16" aria-hidden="true" />
          Panel
        </RouterLink>
      </template>
    </PageHero>

    <div v-if="store.currentRole !== 'admin'" class="surface-card locked-card">
      <p class="locked-msg">Solo administrador.</p>
      <RouterLink to="/app/dashboard" class="cta-ghost">Volver</RouterLink>
    </div>

    <div v-else class="cfg-shell surface-card">
      <div class="cfg-grid">
        <section class="cfg-tile cfg-tile--consultorios">
          <header class="cfg-head">
            <h2><Building2 :size="16" stroke-width="2.2" aria-hidden="true" /> Consultorios</h2>
            <button type="button" class="btn-add-local" aria-label="Añadir consultorio" @click="addConsultorio">
              <Plus :size="14" aria-hidden="true" />
              Añadir
            </button>
          </header>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th class="th-narrow">Act.</th>
                  <th class="th-action" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in store.consultorios" :key="row.id">
                  <td><input v-model="row.codigo" class="cell-in" /></td>
                  <td><input v-model="row.nombre" class="cell-in" placeholder="—" /></td>
                  <td class="td-check">
                    <input v-model="row.activo" type="checkbox" />
                  </td>
                  <td class="td-action">
                    <button type="button" class="btn-icon danger" title="Eliminar fila" @click="removeConsultorio(idx)">
                      <Trash2 :size="15" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="cfg-tile cfg-tile--motivos">
          <header class="cfg-head">
            <h2><ListChecks :size="16" stroke-width="2.2" aria-hidden="true" /> Motivos</h2>
            <button type="button" class="btn-add-local" @click="addMotivo">
              <Plus :size="14" aria-hidden="true" />
              Añadir
            </button>
          </header>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="th-code">Código</th>
                  <th>Largo</th>
                  <th>Corto</th>
                  <th class="th-narrow">Act.</th>
                  <th class="th-action" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in store.motivosConsulta" :key="row.id">
                  <td><input v-model="row.codigo" class="cell-in mono" /></td>
                  <td><input v-model="row.nombreLargo" class="cell-in" /></td>
                  <td><input v-model="row.nombreCorto" class="cell-in" /></td>
                  <td class="td-check"><input v-model="row.activo" type="checkbox" /></td>
                  <td class="td-action">
                    <button type="button" class="btn-icon danger" title="Eliminar motivo" @click="removeMotivo(idx)">
                      <Trash2 :size="15" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="cfg-tile cfg-tile--duraciones">
          <header class="cfg-head">
            <h2><Timer :size="16" stroke-width="2.2" aria-hidden="true" /> Duraciones (min)</h2>
            <button type="button" class="btn-add-local" @click="addDuracion">
              <Plus :size="14" aria-hidden="true" />
              Añadir
            </button>
          </header>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Minutos</th>
                  <th class="th-narrow">Act.</th>
                  <th class="th-action" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in store.duracionesOpcion" :key="row.id">
                  <td>
                    <input v-model.number="row.minutos" type="number" min="5" max="480" step="5" class="cell-in" />
                  </td>
                  <td class="td-check"><input v-model="row.activo" type="checkbox" /></td>
                  <td class="td-action">
                    <button type="button" class="btn-icon danger" title="Eliminar duración" @click="removeDuracion(idx)">
                      <Trash2 :size="15" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer class="cfg-save-bar">
        <button type="button" class="btn-save-all" :disabled="saving" @click="saveAll">
          {{ saving ? 'Guardando…' : 'Guardar configuración' }}
        </button>
        <p v-if="feedback" class="feedback" :class="{ ok: feedbackOk }" role="status">{{ feedback }}</p>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowLeft, Building2, ListChecks, Plus, Timer, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHero from '../components/layout/PageHero.vue'
import type { Consultorio, DuracionOpcion, MotivoConsultaItem } from '../domain/types'
import { persistClinicTables } from '../data/repositories/clinicRepository'
import { useClinicUiStore } from '../stores/ui'

const store = useClinicUiStore()

const saving = ref(false)
const feedback = ref('')
const feedbackOk = ref(false)

const addConsultorio = () => {
  const next: Consultorio = {
    id: `cons-${crypto.randomUUID()}`,
    codigo: `Sala ${store.consultorios.length + 1}`,
    nombre: '',
    activo: true,
  }
  store.consultorios.push(next)
}

const removeConsultorio = (idx: number) => {
  if (!confirm('¿Eliminar este consultorio? Si hay citas asociadas, al guardar fallará.')) return
  store.consultorios.splice(idx, 1)
}

const addMotivo = () => {
  const row: MotivoConsultaItem = {
    id: `mot-${crypto.randomUUID()}`,
    codigo: `motivo_${Date.now()}`,
    nombreLargo: 'Nuevo motivo',
    nombreCorto: 'Nuevo',
    activo: true,
  }
  store.motivosConsulta.push(row)
}

const removeMotivo = (idx: number) => {
  if (!confirm('¿Eliminar este motivo? Si hay citas con este código, al guardar fallará.')) return
  store.motivosConsulta.splice(idx, 1)
}

const addDuracion = () => {
  const used = new Set(store.duracionesOpcion.map((d) => d.minutos))
  let min = 15
  while (used.has(min) && min < 240) min += 5
  const row: DuracionOpcion = {
    id: `dur-${crypto.randomUUID()}`,
    minutos: min,
    activo: true,
  }
  store.duracionesOpcion.push(row)
}

const removeDuracion = (idx: number) => {
  if (!confirm('¿Eliminar esta duración? Si hay citas con estos minutos, al guardar fallará.')) return
  store.duracionesOpcion.splice(idx, 1)
}

const saveAll = async () => {
  const codigos = new Set<string>()
  for (const m of store.motivosConsulta) {
    const c = m.codigo.trim()
    if (!c) {
      feedbackOk.value = false
      feedback.value = 'Todos los motivos deben tener código.'
      return
    }
    if (codigos.has(c)) {
      feedbackOk.value = false
      feedback.value = 'Los códigos de motivo deben ser únicos.'
      return
    }
    codigos.add(c)
  }

  const mins = new Set<number>()
  for (const d of store.duracionesOpcion) {
    const n = Number(d.minutos)
    if (!Number.isFinite(n) || n < 5) {
      feedbackOk.value = false
      feedback.value = 'Cada duración debe ser al menos 5 minutos.'
      return
    }
    if (mins.has(n)) {
      feedbackOk.value = false
      feedback.value = 'Las duraciones (minutos) deben ser únicas.'
      return
    }
    mins.add(n)
  }

  const activDur = store.duracionesOpcion.filter((d) => d.activo)
  const activMot = store.motivosConsulta.filter((m) => m.activo)
  if (!activDur.length) {
    feedbackOk.value = false
    feedback.value = 'Debe haber al menos una duración activa.'
    return
  }
  if (!activMot.length) {
    feedbackOk.value = false
    feedback.value = 'Debe haber al menos un motivo activo.'
    return
  }

  saving.value = true
  feedback.value = ''
  feedbackOk.value = false

  try {
    await persistClinicTables({
      consultorios: [...store.consultorios],
      motivosConsulta: [...store.motivosConsulta],
      duracionesOpcion: [...store.duracionesOpcion],
    })
    feedbackOk.value = true
    feedback.value = 'Configuración guardada correctamente.'
    window.setTimeout(() => {
      feedback.value = ''
    }, 3200)
  } catch (e) {
    feedbackOk.value = false
    const raw = e instanceof Error ? e.message : String(e)
    feedback.value =
      raw.includes('violates foreign key') || raw.includes('foreign key')
        ? 'No se puede eliminar: hay citas u otros registros que aún usan ese dato.'
        : raw
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  gap: 10px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--primary-dark);
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}

.locked-card {
  padding: 14px 16px;
  text-align: center;
}
.locked-msg {
  margin: 0 0 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--primary-dark);
}
.cta-ghost {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--primary-dark);
  text-decoration: none;
}

.cfg-shell {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cfg-grid {
  display: grid;
  gap: 0;
  grid-template-columns: 1fr;
  grid-template-areas:
    'consultorios'
    'motivos'
    'duraciones';
}

@media (min-width: 880px) {
  .cfg-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'consultorios consultorios'
      'motivos duraciones';
    align-items: stretch;
  }
}

.cfg-tile {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  min-width: 0;
}
.cfg-tile--consultorios {
  grid-area: consultorios;
}
.cfg-tile--motivos {
  grid-area: motivos;
}
.cfg-tile--duraciones {
  grid-area: duraciones;
  border-bottom: none;
}

@media (min-width: 880px) {
  .cfg-tile--motivos {
    border-right: 1px solid var(--border);
    border-bottom: none;
  }
}

.cfg-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.cfg-head h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--primary-dark);
}

.btn-add-local {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  font-weight: 800;
  font-size: 0.72rem;
  color: var(--primary-dark);
}
.btn-add-local:hover {
  background: rgba(58, 143, 183, 0.1);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  color: #5a7584;
}
.btn-icon.danger:hover {
  color: #b83232;
  background: rgba(184, 50, 50, 0.08);
}

.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
.data-table th,
.data-table td {
  border-bottom: 1px solid var(--border);
  padding: 5px 6px;
  text-align: left;
  vertical-align: middle;
}
.data-table th {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5a7584;
  font-weight: 800;
}
.th-narrow {
  width: 44px;
  text-align: center;
}
.th-code {
  width: 100px;
}
.th-action {
  width: 40px;
}
.td-check {
  text-align: center;
}
.td-check input {
  accent-color: #2e7d96;
  width: 15px;
  height: 15px;
}
.td-action {
  text-align: center;
}

.cell-in {
  width: 100%;
  box-sizing: border-box;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font: inherit;
  font-size: 0.78rem;
}
.cell-in.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.74rem;
}

.cfg-save-bar {
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(58, 143, 183, 0.06), transparent);
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
}

.btn-save-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 0;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.88rem;
  background: linear-gradient(135deg, #3a8fb7, #2e7d96);
  color: #fff;
}
.btn-save-all:hover:not(:disabled) {
  filter: brightness(1.05);
}
.btn-save-all:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.feedback {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: #c45c26;
}
.feedback.ok {
  color: #1f7a4a;
}
</style>
