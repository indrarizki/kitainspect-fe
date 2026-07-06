<template>
  <div>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn btn-secondary btn-sm" @click="$router.push('/templates')">← Kembali</button>
        <div>
          <h1 style="font-size:16px;font-weight:500">{{ template?.name ?? 'Template Builder' }}</h1>
          <p style="font-size:12px;color:var(--color-text-tertiary)">
            {{ template?.inspection_type?.name }} · v{{ template?.version }} ·
            <span :style="`color:${template?.is_published ? '#0F6E56':'#888'}`">
              {{ template?.is_published ? 'Published' : 'Draft' }}
            </span>
          </p>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" @click="showSettings=true">⚙ Settings</button>
        <button class="btn" :class="template?.is_published ? 'btn-danger':'btn-success'" @click="togglePublish">
          {{ template?.is_published ? 'Unpublish' : 'Publish' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-ph">Memuat template...</div>

    <div v-else style="display:grid;grid-template-columns:260px 1fr;gap:16px;align-items:start">
      <!-- Left: Sections sidebar -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:13px;font-weight:500">Sections</span>
          <button class="btn btn-primary btn-sm" @click="openSectionModal()">+ Section</button>
        </div>
        <div v-if="!sections.length" class="empty-ph" style="padding:20px">Belum ada section.</div>
        <div
          v-for="s in sections" :key="s.id"
          class="section-item"
          :class="{ active: activeSection?.id === s.id }"
          @click="activeSection = s"
        >
          <div style="display:flex;align-items:center;gap:8px">
            <span class="section-code">{{ s.code }}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ s.title }}</div>
              <div style="font-size:11px;color:var(--color-text-tertiary)">{{ s.section_type }} · {{ s.checkpoints?.length ?? 0 }} checkpoint</div>
            </div>
          </div>
          <div style="display:flex;gap:4px;margin-top:6px">
            <button class="btn btn-secondary btn-sm" @click.stop="openSectionModal(s)">Edit</button>
            <button class="btn btn-danger btn-sm" @click.stop="deleteSection(s.id)">Hapus</button>
          </div>
        </div>
      </div>

      <!-- Right: Checkpoints -->
      <div class="card">
        <div v-if="!activeSection" class="empty-ph" style="padding:48px">
          ← Pilih section untuk melihat checkpoints
        </div>
        <div v-else>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div>
              <span style="font-size:14px;font-weight:500">{{ activeSection.code }}. {{ activeSection.title }}</span>
              <span style="font-size:12px;color:var(--color-text-tertiary);margin-left:8px">{{ sectionTypeLabel(activeSection.section_type) }}</span>
            </div>
            <button class="btn btn-primary btn-sm" @click="openCpModal()">+ Checkpoint</button>
          </div>

          <div v-if="!activeSection.checkpoints?.length" class="empty-ph" style="padding:32px">
            Belum ada checkpoint di section ini.
          </div>

          <div v-for="cp in activeSection.checkpoints" :key="cp.id" class="cp-card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                  <span style="font-size:13px;font-weight:500">{{ cp.label }}</span>
                  <span v-if="cp.is_required" style="font-size:10px;background:#FCEBEB;color:#791F1F;padding:1px 6px;border-radius:4px">Required</span>
                  <span v-if="cp.severity" class="badge" :class="severityBadge(cp.severity)">{{ cp.severity }}</span>
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap">
                  <span class="cp-meta">Type: {{ cp.input_type }}</span>
                  <span class="cp-meta" v-if="cp.unit !== 'none'">Unit: {{ cp.unit }}</span>
                  <span class="cp-meta" v-if="cp.target_value">Target: {{ cp.target_value }}</span>
                  <span class="cp-meta" v-if="cp.min_value">Min: {{ cp.min_value }}</span>
                  <span class="cp-meta" v-if="cp.max_value">Max: {{ cp.max_value }}</span>
                  <span class="cp-meta" v-if="cp.allow_unit_conversion">🔄 Auto-convert</span>
                  <span class="cp-meta" v-if="cp.has_photo">📷 Wajib foto</span>
                </div>
                <div v-if="cp.description" style="font-size:11.5px;color:var(--color-text-tertiary);margin-top:4px">{{ cp.description }}</div>
              </div>
              <div style="display:flex;gap:5px;flex-shrink:0">
                <button class="btn btn-secondary btn-sm" @click="openCpModal(cp)">Edit</button>
                <button class="btn btn-danger btn-sm" @click="deleteCheckpoint(cp.id)">Hapus</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Modal -->
    <Teleport to="body">
      <div v-if="sectionModal.open" class="modal-overlay" @click.self="sectionModal.open=false">
        <div class="modal">
          <div class="modal-title">{{ sectionModal.id ? 'Edit Section' : 'Tambah Section' }}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
            <div class="field">
              <label>Kode *</label>
              <input v-model="sectionModal.code" type="text" placeholder="A, B, C..." maxlength="10" :disabled="!!sectionModal.id"/>
            </div>
            <div class="field">
              <label>Tipe Section *</label>
              <select v-model="sectionModal.section_type">
                <option v-for="t in sectionTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="field" style="grid-column:1/-1">
              <label>Judul *</label>
              <input v-model="sectionModal.title" type="text" placeholder="e.g. Order Detail, Measurement Check"/>
            </div>
            <div class="field">
              <label>Urutan</label>
              <input v-model.number="sectionModal.order_index" type="number" min="0"/>
            </div>
            <div class="field" style="display:flex;align-items:center;gap:8px;padding-top:20px">
              <input type="checkbox" v-model="sectionModal.is_required" id="sec-req"/>
              <label for="sec-req" style="font-size:13px;cursor:pointer">Wajib diisi</label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="sectionModal.open=false">Batal</button>
            <button class="btn btn-primary" :disabled="savingSection" @click="saveSection">
              {{ savingSection ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Checkpoint Modal -->
    <Teleport to="body">
      <div v-if="cpModal.open" class="modal-overlay" @click.self="cpModal.open=false">
        <div class="modal" style="width:580px">
          <div class="modal-title">{{ cpModal.id ? 'Edit Checkpoint' : 'Tambah Checkpoint' }}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;max-height:65vh;overflow-y:auto;padding-right:4px">
            <div class="field" style="grid-column:1/-1">
              <label>Label / Nama *</label>
              <input v-model="cpModal.label" type="text" placeholder="e.g. Thickness, Width, Bad Repair"/>
            </div>
            <div class="field">
              <label>Tipe Input *</label>
              <select v-model="cpModal.input_type">
                <option value="number">Number (pengukuran)</option>
                <option value="text">Text</option>
                <option value="select">Select / Dropdown</option>
                <option value="checkbox">Checkbox (OK/NG)</option>
                <option value="photo">Photo</option>
                <option value="signature">Signature</option>
                <option value="rating">Rating</option>
              </select>
            </div>
            <div class="field">
              <label>Unit</label>
              <select v-model="cpModal.unit">
                <option value="none">—</option>
                <option value="inches">Inches</option>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="degrees">Degrees (°)</option>
                <option value="pcs">pcs</option>
                <option value="percent">%</option>
              </select>
            </div>

            <!-- Number-specific fields -->
            <template v-if="cpModal.input_type === 'number'">
              <div class="field">
                <label>Target Value</label>
                <input v-model.number="cpModal.target_value" type="number" step="0.0001" placeholder="e.g. 1.375"/>
              </div>
              <div class="field">
                <label>Min Value (range bawah)</label>
                <input v-model.number="cpModal.min_value" type="number" step="0.0001" placeholder="e.g. 1.36"/>
              </div>
              <div class="field">
                <label>Max Value (range atas)</label>
                <input v-model.number="cpModal.max_value" type="number" step="0.0001" placeholder="e.g. 1.39"/>
              </div>
              <div class="field" style="display:flex;align-items:center;gap:8px;padding-top:20px">
                <input type="checkbox" v-model="cpModal.allow_unit_conversion" id="cp-conv"/>
                <label for="cp-conv" style="font-size:13px;cursor:pointer">Auto-convert unit (mm↔inches)</label>
              </div>
            </template>

            <!-- Visual-specific -->
            <div class="field" v-if="activeSection?.section_type === 'visual'">
              <label>Severity (untuk defect)</label>
              <select v-model="cpModal.severity">
                <option value="">—</option>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <!-- Select options -->
            <div class="field" style="grid-column:1/-1" v-if="['select','checkbox'].includes(cpModal.input_type)">
              <label>Pilihan (pisahkan dengan koma)</label>
              <input v-model="cpModal.optionsStr" type="text" placeholder="OK, NG, N/A"/>
            </div>

            <div class="field" style="grid-column:1/-1">
              <label>Deskripsi / Panduan Inspector</label>
              <textarea v-model="cpModal.description" rows="2" placeholder="Petunjuk pengisian..."/>
            </div>

            <div class="field" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" v-model="cpModal.is_required" id="cp-req"/>
              <label for="cp-req" style="font-size:13px;cursor:pointer">Wajib diisi</label>
            </div>
            <div class="field" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" v-model="cpModal.has_photo" id="cp-photo"/>
              <label for="cp-photo" style="font-size:13px;cursor:pointer">Wajib upload foto</label>
            </div>
            <div class="field">
              <label>Urutan</label>
              <input v-model.number="cpModal.order_index" type="number" min="0"/>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cpModal.open=false">Batal</button>
            <button class="btn btn-primary" :disabled="savingCp" @click="saveCheckpoint">
              {{ savingCp ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { templateService } from '@/services'
import { useToast } from '@/composables'

const route = useRoute()
const { success, error: toastError } = useToast()

const loading  = ref(true)
const template = ref(null)
const sections = ref([])
const activeSection = ref(null)
const savingSection = ref(false)
const savingCp      = ref(false)

const sectionTypes = [
  { value:'order_detail',  label:'Order Detail' },
  { value:'measurement',   label:'Measurement Check' },
  { value:'visual',        label:'Visual Inspection' },
  { value:'deformation',   label:'Deformation Check' },
  { value:'remarks',       label:'Inspector Remarks' },
  { value:'evidence',      label:'Evidence / Foto' },
  { value:'aql_summary',   label:'AQL Summary' },
  { value:'signature',     label:'Signature' },
  { value:'custom',        label:'Custom' },
]

function sectionTypeLabel(v) { return sectionTypes.find(t => t.value === v)?.label ?? v }
function severityBadge(s) { return { minor:'badge-submitted', major:'badge-rejected', critical:'badge-rejected' }[s] ?? '' }

// ── Section Modal ─────────────────────────────────────────────────────────────
const sectionModal = ref({ open:false, id:null, code:'', title:'', section_type:'custom', order_index:0, is_required:true })

function openSectionModal(s = null) {
  sectionModal.value = s
    ? { open:true, id:s.id, code:s.code, title:s.title, section_type:s.section_type, order_index:s.order_index, is_required:s.is_required }
    : { open:true, id:null, code:'', title:'', section_type:'custom', order_index:sections.value.length, is_required:true }
}

async function saveSection() {
  if (!sectionModal.value.code || !sectionModal.value.title) {
    toastError('Kode dan judul wajib diisi.'); return
  }
  savingSection.value = true
  try {
    const payload = {
      code:         sectionModal.value.code,
      title:        sectionModal.value.title,
      section_type: sectionModal.value.section_type,
      order_index:  sectionModal.value.order_index,
      is_required:  sectionModal.value.is_required,
    }
    if (sectionModal.value.id) {
      await templateService.updateSection(sectionModal.value.id, payload)
    } else {
      await templateService.addSection(route.params.id, payload)
    }
    success('Section berhasil disimpan.')
    sectionModal.value.open = false
    await fetchTemplate()
  } catch(e) { toastError(e.response?.data?.message ?? 'Gagal menyimpan.') }
  finally { savingSection.value = false }
}

async function deleteSection(id) {
  if (!confirm('Hapus section ini beserta semua checkpoints-nya?')) return
  try {
    await templateService.deleteSection(id)
    success('Section dihapus.')
    if (activeSection.value?.id === id) activeSection.value = null
    await fetchTemplate()
  } catch { toastError('Gagal menghapus.') }
}

// ── Checkpoint Modal ──────────────────────────────────────────────────────────
const cpModal = ref({
  open:false, id:null, label:'', input_type:'number',
  unit:'none', allow_unit_conversion:false,
  target_value:null, min_value:null, max_value:null,
  severity:null, is_required:false, has_photo:false,
  optionsStr:'', description:'', order_index:0,
})

function openCpModal(cp = null) {
  cpModal.value = cp ? {
    open:true, id:cp.id, label:cp.label, input_type:cp.input_type,
    unit:cp.unit, allow_unit_conversion:cp.allow_unit_conversion,
    target_value:cp.target_value, min_value:cp.min_value, max_value:cp.max_value,
    severity:cp.severity, is_required:cp.is_required, has_photo:cp.has_photo,
    optionsStr: Array.isArray(cp.options) ? cp.options.join(', ') : '',
    description:cp.description, order_index:cp.order_index,
  } : {
    open:true, id:null, label:'', input_type:'number',
    unit:'none', allow_unit_conversion:false,
    target_value:null, min_value:null, max_value:null,
    severity:null, is_required:false, has_photo:false,
    optionsStr:'', description:'',
    order_index: activeSection.value?.checkpoints?.length ?? 0,
  }
}

async function saveCheckpoint() {
  if (!cpModal.value.label) { toastError('Label wajib diisi.'); return }
  savingCp.value = true
  try {
    const payload = {
      label:                  cpModal.value.label,
      input_type:             cpModal.value.input_type,
      unit:                   cpModal.value.unit,
      allow_unit_conversion:  cpModal.value.allow_unit_conversion,
      target_value:           cpModal.value.target_value ?? undefined,
      min_value:              cpModal.value.min_value ?? undefined,
      max_value:              cpModal.value.max_value ?? undefined,
      severity:               cpModal.value.severity ?? undefined,
      is_required:            cpModal.value.is_required,
      has_photo:              cpModal.value.has_photo,
      description:            cpModal.value.description || undefined,
      order_index:            cpModal.value.order_index,
      options: cpModal.value.optionsStr
        ? cpModal.value.optionsStr.split(',').map(s => s.trim()).filter(Boolean)
        : undefined,
    }
    if (cpModal.value.id) {
      await templateService.updateItem(cpModal.value.id, payload)
    } else {
      await templateService.addItem(activeSection.value.id, payload)
    }
    success('Checkpoint berhasil disimpan.')
    cpModal.value.open = false
    await fetchTemplate()
  } catch(e) { toastError(e.response?.data?.message ?? 'Gagal.') }
  finally { savingCp.value = false }
}

async function deleteCheckpoint(id) {
  if (!confirm('Hapus checkpoint ini?')) return
  try {
    await templateService.deleteItem(id)
    success('Checkpoint dihapus.')
    await fetchTemplate()
  } catch { toastError('Gagal menghapus.') }
}

async function togglePublish() {
  try {
    await templateService.publish(route.params.id)
    success('Status template diubah.')
    await fetchTemplate()
  } catch(e) { toastError(e.response?.data?.message ?? 'Gagal.') }
}

async function fetchTemplate() {
  const { data } = await templateService.get(route.params.id)

  template.value = data.template
  sections.value = data.template.sections ?? []
  
  if (activeSection.value) {
    activeSection.value = sections.value.find(s => s.id === activeSection.value.id) ?? null
  }
}

onMounted(async () => {
  try { await fetchTemplate() }
  catch { toastError('Gagal memuat template.') }
  finally { loading.value = false }
})
</script>

<style scoped>
.section-item { padding:10px 12px;border-radius:8px;cursor:pointer;border:1px solid var(--color-border-tertiary);margin-bottom:8px;transition:all .12s }
.section-item:hover { border-color:#534AB7 }
.section-item.active { border-color:#534AB7;background:#EEEDFE }
.section-code { width:26px;height:26px;border-radius:6px;background:#534AB7;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.cp-card { padding:12px 14px;border:0.5px solid var(--color-border-tertiary);border-radius:8px;margin-bottom:8px }
.cp-meta { font-size:11.5px;color:var(--color-text-tertiary);background:var(--color-background-secondary);padding:2px 7px;border-radius:4px }
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100 }
.modal { background:#fff;border-radius:12px;padding:24px;width:480px;max-width:92%;box-shadow:0 8px 32px rgba(0,0,0,.15) }
.modal-title { font-size:15px;font-weight:500 }
.modal-footer { display:flex;gap:8px;justify-content:flex-end;margin-top:16px }
.loading-ph,.empty-ph { text-align:center;padding:32px;color:var(--color-text-tertiary);font-size:13px }
</style>