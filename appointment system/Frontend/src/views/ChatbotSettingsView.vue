<template>
  <section class="chatbot-settings">
    <PageHero
      pill="Sistema"
      title="Configuración del Chatbot"
      subtitle="Personaliza los mensajes y preguntas del asistente virtual, y gestiona los motivos de consulta."
    >
      <template #actions>
        <RouterLink to="/app/dashboard" class="back-link">
          <ArrowLeft :size="16" aria-hidden="true" />
          Volver al Panel
        </RouterLink>
      </template>
    </PageHero>

    <div v-if="store.currentRole !== 'admin'" class="surface-card locked-card">
      <p class="locked-msg">Solo administrador.</p>
      <RouterLink to="/app/dashboard" class="cta-ghost">Volver</RouterLink>
    </div>

    <div v-else class="cfg-shell surface-card">
      <div v-if="loading" class="loading-state">
        <p>Cargando configuración...</p>
      </div>

      <div v-else class="cfg-content">
        <!-- Pestañas internas para organizar mejor -->
        <nav class="inner-tabs">
          <button 
            type="button" 
            :class="{ active: activeTab === 'messages' }" 
            @click="activeTab = 'messages'"
          >
            <MessageSquare :size="16" /> Mensajes del Chat
          </button>
          <button 
            type="button" 
            :class="{ active: activeTab === 'motivos' }" 
            @click="activeTab = 'motivos'"
          >
            <ListChecks :size="16" /> Motivos de Consulta
          </button>
        </nav>

        <div v-if="activeTab === 'messages'" class="cfg-grid animate-fade">
          <!-- Modo de Operación del Chatbot -->
          <section class="cfg-tile col-span-2">
            <header class="cfg-head">
              <h2><Brain :size="16" stroke-width="2.2" aria-hidden="true" /> Modo de Operación del Chatbot</h2>
            </header>
            <div class="mode-toggles">
              <div class="toggle-card" :class="{ active: settings.usarIa }" @click="settings.usarIa = true">
                <div class="toggle-info">
                  <h3>Chatbot con IA</h3>
                  <p>Usa Gemini (inteligencia artificial) para conversar fluidamente y extraer los datos necesarios.</p>
                </div>
                <label class="switch-control" @click.stop>
                  <input type="checkbox" :checked="settings.usarIa" @change="settings.usarIa = true" />
                  <span class="switch-slider"></span>
                </label>
              </div>

              <div class="toggle-card" :class="{ active: !settings.usarIa }" @click="settings.usarIa = false">
                <div class="toggle-info">
                  <h3>Chatbot sin IA</h3>
                  <p>Flujo tradicional paso a paso guiado por las preguntas estáticas configuradas abajo.</p>
                </div>
                <label class="switch-control" @click.stop>
                  <input type="checkbox" :checked="!settings.usarIa" @change="settings.usarIa = false" />
                  <span class="switch-slider"></span>
                </label>
              </div>
            </div>
          </section>

          <section class="cfg-tile">
            <header class="cfg-head">
              <h2><MessageSquare :size="16" stroke-width="2.2" aria-hidden="true" /> Mensaje de Bienvenida</h2>
            </header>
            <div class="field">
              <textarea v-model="settings.welcomeMessage" class="cell-in txt-area" placeholder="¡Hola! Soy el asistente..."></textarea>
              <p class="hint">Este es el primer mensaje que el usuario verá al abrir el chat.</p>
            </div>
          </section>

          <section class="cfg-tile">
            <header class="cfg-head">
              <h2><User :size="16" stroke-width="2.2" aria-hidden="true" /> Preguntar Nombre</h2>
            </header>
            <div class="field">
              <input v-model="settings.askName" class="cell-in" />
              <p class="hint">Pregunta inicial para identificar al paciente.</p>
            </div>
          </section>

          <section class="cfg-tile">
            <header class="cfg-head">
              <h2><Phone :size="16" stroke-width="2.2" aria-hidden="true" /> Preguntar Teléfono</h2>
            </header>
            <div class="field">
              <input v-model="settings.askPhone" class="cell-in" />
              <p class="hint">Usa <code v-pre>{{name}}</code> para incluir el nombre del paciente en la pregunta.</p>
            </div>
          </section>

          <section class="cfg-tile">
            <header class="cfg-head">
              <h2><ListChecks :size="16" stroke-width="2.2" aria-hidden="true" /> Preguntar Motivo</h2>
            </header>
            <div class="field">
              <input v-model="settings.askReason" class="cell-in" />
              <p class="hint">Mensaje previo a mostrar las opciones de consulta.</p>
            </div>
          </section>

          <section class="cfg-tile">
            <header class="cfg-head">
              <h2><Stethoscope :size="16" stroke-width="2.2" aria-hidden="true" /> Preguntar Síntomas</h2>
            </header>
            <div class="field">
              <input v-model="settings.askSymptoms" class="cell-in" />
              <p class="hint">Pregunta final para obtener detalles adicionales.</p>
            </div>
          </section>
        </div>

        <div v-else-if="activeTab === 'motivos'" class="motivos-editor animate-fade">
          <section class="cfg-tile border-none">
            <header class="cfg-head">
              <h2><ListChecks :size="16" stroke-width="2.2" aria-hidden="true" /> Gestionar Motivos</h2>
              <button type="button" class="btn-add-local" @click="addMotivo">
                <Plus :size="14" aria-hidden="true" />
                Añadir Motivo
              </button>
            </header>
            
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="th-code">Código</th>
                    <th>Nombre Largo (Web)</th>
                    <th>Nombre Corto (Agenda)</th>
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
            <p class="hint mt-3">Los motivos marcados como "Act." aparecerán como opciones seleccionables en el chatbot de la web.</p>
          </section>
        </div>

        <footer class="cfg-save-bar">
          <button type="button" class="btn-save-all" :disabled="saving" @click="saveAll">
            {{ saving ? 'Guardando…' : 'Guardar todos los cambios' }}
          </button>
          <p v-if="feedback" class="feedback" :class="{ ok: feedbackOk }" role="status">{{ feedback }}</p>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowLeft, MessageSquare, User, Phone, ListChecks, Stethoscope, Plus, Trash2, Brain } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import PageHero from '../components/layout/PageHero.vue'
import { useClinicUiStore } from '../stores/ui'
import { fetchChatbotSettings, updateChatbotSettings, persistClinicTables } from '../data/repositories/clinicRepository'
import type { ChatbotSettings, MotivoConsultaItem } from '../domain/types'

const store = useClinicUiStore()
const loading = ref(true)
const saving = ref(false)
const feedback = ref('')
const feedbackOk = ref(false)
const activeTab = ref('messages') // 'messages' | 'motivos'

const settings = ref<ChatbotSettings>({
  id: '',
  welcomeMessage: '',
  askName: '',
  askPhone: '',
  askReason: '',
  askSymptoms: '',
  usarIa: true,
  updatedAt: ''
})

onMounted(async () => {
  try {
    const data = await fetchChatbotSettings()
    if (data.settings) {
      settings.value = data.settings
    }
  } catch (e) {
    feedback.value = 'Error al cargar configuración.'
    feedbackOk.value = false
  } finally {
    loading.value = false
  }
})

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

const saveAll = async () => {
  // Validaciones de motivos
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

  const activMot = store.motivosConsulta.filter((m) => m.activo)
  if (!activMot.length) {
    feedbackOk.value = false
    feedback.value = 'Debe haber al menos un motivo activo.'
    return
  }

  saving.value = true
  feedback.value = ''
  feedbackOk.value = false

  try {
    // 1. Guardar settings del chatbot
    await updateChatbotSettings(settings.value)
    
    // 2. Guardar tablas de la clínica (solo motivos en este caso)
    await persistClinicTables({
      motivosConsulta: [...store.motivosConsulta]
    })

    feedbackOk.value = true
    feedback.value = 'Cambios guardados correctamente.'
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
.chatbot-settings {
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

.inner-tabs {
  display: flex;
  background: rgba(58, 143, 183, 0.05);
  border-bottom: 1px solid var(--border);
}
.inner-tabs button {
  flex: 1;
  padding: 12px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
  color: #5a7584;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}
.inner-tabs button.active {
  background: #fff;
  color: var(--primary);
  box-shadow: inset 0 -2px 0 var(--primary);
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

.loading-state {
  padding: 40px;
  text-align: center;
  color: var(--primary-dark);
  font-weight: 600;
}

.cfg-grid {
  display: grid;
  gap: 0;
  grid-template-columns: 1fr;
}

@media (min-width: 880px) {
  .cfg-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.cfg-tile {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  min-width: 0;
}
.border-none { border: none; }

@media (min-width: 880px) {
  .cfg-tile:nth-child(odd):not(.border-none) {
    border-right: 1px solid var(--border);
  }
}

.cfg-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.cfg-head h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
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
  background: #fff;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.72rem;
  color: var(--primary-dark);
}
.btn-add-local:hover {
  background: rgba(58, 143, 183, 0.1);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-in {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font: inherit;
  font-size: 0.82rem;
  background: #fff;
}
.cell-in.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
}

.txt-area {
  min-height: 80px;
  resize: vertical;
}

.hint {
  margin: 0;
  font-size: 0.72rem;
  color: #5a7584;
  font-style: italic;
}
.mt-3 { margin-top: 12px; }

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
.data-table th,
.data-table td {
  border-bottom: 1px solid var(--border);
  padding: 8px;
  text-align: left;
  vertical-align: middle;
}
.data-table th {
  background: rgba(58, 143, 183, 0.03);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5a7584;
  font-weight: 800;
}
.th-narrow { width: 44px; text-align: center; }
.th-code { width: 120px; }
.th-action { width: 40px; }
.td-check, .td-action { text-align: center; }
.td-check input { accent-color: var(--primary); width: 16px; height: 16px; }

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  color: #5a7584;
}
.btn-icon.danger:hover {
  color: #b83232;
  background: rgba(184, 50, 50, 0.08);
}

.cfg-save-bar {
  padding: 16px 18px;
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
  padding: 12px 16px;
  border-radius: 10px;
  border: 0;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.9rem;
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
  font-size: 0.8rem;
  font-weight: 600;
  color: #c45c26;
  text-align: center;
}
.feedback.ok {
  color: #1f7a4a;
}

.animate-fade {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Estilos premium para los switches de modo */
.col-span-2 {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, rgba(58, 143, 183, 0.03) 0%, rgba(46, 125, 150, 0.03) 100%);
  border-bottom: 1px solid var(--border);
}
.mode-toggles {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 10px;
}
@media (min-width: 640px) {
  .mode-toggles {
    grid-template-columns: 1fr 1fr;
  }
}
.toggle-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
}
.toggle-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(58, 143, 183, 0.08);
}
.toggle-card.active {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(58, 143, 183, 0.05) 0%, rgba(46, 125, 150, 0.01) 100%);
  box-shadow: 0 4px 12px rgba(58, 143, 183, 0.05);
}
.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 12px;
}
.toggle-info h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--primary-dark);
}
.toggle-info p {
  margin: 0;
  font-size: 0.76rem;
  color: #5a7584;
  line-height: 1.4;
}

/* Switch Slider */
.switch-control {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
  flex-shrink: 0;
}
.switch-control input {
  opacity: 0;
  width: 0;
  height: 0;
}
.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: .3s;
  border-radius: 24px;
}
.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.switch-control input:checked + .switch-slider {
  background: linear-gradient(135deg, #3a8fb7, #2e7d96);
}
.switch-control input:checked + .switch-slider:before {
  transform: translateX(22px);
}
</style>
