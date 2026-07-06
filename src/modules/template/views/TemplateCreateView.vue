<template>
  <div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px">
      <button class="btn btn-secondary btn-sm" @click="$router.push('/templates')">← Kembali</button>
      <div>
        <h1 style="font-size:16px;font-weight:500">Buat Template Baru</h1>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">
          Setelah dibuat, tambahkan sections dan checkpoints di Template Builder
        </p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start">
      <!-- Form -->
      <div class="card">
        <!-- Inspection Type -->
        <div class="section-title">Tipe Inspeksi *</div>
        <div v-if="loadingTypes" class="loading-ph" style="padding:20px">Memuat tipe...</div>
        <div v-else class="type-grid">
          <div
            v-for="t in types" :key="t.id"
            class="type-card"
            :class="{ selected: form.inspection_type_id === t.id }"
            @click="form.inspection_type_id = t.id"
          >
            <div class="type-icon">{{ typeIcon(t.slug) }}</div>
            <div class="type-name">{{ t.name }}</div>
            <div class="type-desc">{{ t.description }}</div>
          </div>
        </div>
        <span v-if="errors.inspection_type_id" class="field-error">{{ errors.inspection_type_id }}</span>

        <!-- Basic info -->
        <div class="section-title" style="margin-top:22px">Informasi Template</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="field" style="grid-column:1/-1">
            <label>Nama Template *</label>
            <input v-model="form.name" type="text"
              placeholder="e.g. Final Inspection — 2P Shaker Door"
              :class="{ 'field-error-input': errors.name }"/>
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Deskripsi</label>
            <textarea v-model="form.description" rows="3"
              placeholder="Jelaskan tujuan dan scope template ini..."/>
          </div>
          <div class="field">
            <label>Versi</label>
            <input v-model="form.version" type="text" placeholder="e.g. 1.0"/>
          </div>
          <div class="field">
            <label>Unit Default *</label>
            <select v-model="form.default_unit">
              <option value="inches">Inches</option>
              <option value="mm">Millimeter (mm)</option>
              <option value="cm">Centimeter (cm)</option>
            </select>
            <span v-if="errors.default_unit" class="field-error">{{ errors.default_unit }}</span>
          </div>
        </div>

        <!-- Sampling -->
        <div class="section-title" style="margin-top:22px">Metode Sampling *</div>
        <div class="sampling-grid">
          <div
            v-for="s in samplingOptions" :key="s.value"
            class="sampling-card"
            :class="{ selected: form.sampling_method === s.value }"
            @click="form.sampling_method = s.value"
          >
            <div class="sampling-icon">{{ s.icon }}</div>
            <div class="sampling-name">{{ s.label }}</div>
            <div class="sampling-desc">{{ s.desc }}</div>
          </div>
        </div>
        <span v-if="errors.sampling_method" class="field-error">{{ errors.sampling_method }}</span>

        <!-- AQL Level (jika AQL) -->
        <div v-if="form.sampling_method === 'aql_2_5'" style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="field">
            <label>AQL Inspection Level</label>
            <select v-model="form.inspection_level">
              <option value="I">Level I — Lenient (sampel lebih kecil)</option>
              <option value="II">Level II — Normal (default)</option>
              <option value="III">Level III — Tightened (sampel lebih besar)</option>
            </select>
          </div>
          <!-- AQL preview -->
          <div style="padding:12px;background:#E1F5EE;border-radius:8px;border:0.5px solid #A8DFC8;align-self:flex-end">
            <div style="font-size:11.5px;font-weight:500;color:#085041;margin-bottom:4px">Contoh AQL Level {{ form.inspection_level }}</div>
            <div v-for="ex in aqlExamples" :key="ex.qty" style="font-size:11.5px;color:#085041">
              {{ ex.qty }} pcs → sample {{ ex.sample }} pcs (Ac:{{ ex.ac }}, Re:{{ ex.re }})
            </div>
          </div>
        </div>

        <!-- Custom % -->
        <div v-if="form.sampling_method === 'custom'" style="margin-top:14px">
          <div class="field" style="max-width:240px">
            <label>Persentase Sample (%) *</label>
            <input v-model.number="form.custom_sample_pct" type="number" min="1" max="100"
              placeholder="e.g. 10"/>
            <div style="font-size:11px;color:var(--color-text-tertiary);margin-top:3px">
              Contoh: 10% dari 95 pcs = 10 pcs sample
            </div>
            <span v-if="errors.custom_sample_pct" class="field-error">{{ errors.custom_sample_pct }}</span>
          </div>
        </div>

        <!-- Submit -->
        <div style="margin-top:24px;padding-top:16px;border-top:0.5px solid var(--color-border-tertiary);display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-secondary" @click="$router.push('/templates')">Batal</button>
          <button class="btn btn-primary" :disabled="loading" @click="submit">
            <span v-if="loading" class="spinner-sm"/>
            {{ loading ? 'Membuat...' : 'Buat Template & Lanjut ke Builder →' }}
          </button>
        </div>
      </div>

      <!-- Preview sidebar -->
      <div class="card">
        <div style="font-size:13px;font-weight:500;margin-bottom:14px">Preview Template</div>

        <div class="preview-row">
          <span>Tipe</span>
          <span>{{ selectedType?.name ?? '—' }}</span>
        </div>
        <div class="preview-row">
          <span>Nama</span>
          <span>{{ form.name || '—' }}</span>
        </div>
        <div class="preview-row">
          <span>Versi</span>
          <span>v{{ form.version || '1.0' }}</span>
        </div>
        <div class="preview-row">
          <span>Unit</span>
          <span style="text-transform:uppercase">{{ form.default_unit }}</span>
        </div>
        <div class="preview-row">
          <span>Sampling</span>
          <span>{{ samplingOptions.find(s=>s.value===form.sampling_method)?.label ?? '—' }}</span>
        </div>
        <div class="preview-row" v-if="form.sampling_method === 'aql_2_5'">
          <span>AQL Level</span>
          <span>Level {{ form.inspection_level }}</span>
        </div>
        <div class="preview-row" v-if="form.sampling_method === 'custom'">
          <span>Sample %</span>
          <span>{{ form.custom_sample_pct }}%</span>
        </div>

        <div style="margin-top:16px;padding:12px;background:var(--color-background-secondary);border-radius:8px">
          <div style="font-size:12px;font-weight:500;color:var(--color-text-secondary);margin-bottom:6px">Langkah selanjutnya:</div>
          <div style="font-size:12px;color:var(--color-text-tertiary);line-height:1.8">
            1. Buat template (form ini)<br>
            2. Tambah sections (A, B, C...)<br>
            3. Tambah checkpoints per section<br>
            4. Set target & range per checkpoint<br>
            5. Publish template
          </div>
        </div>

        <!-- Section types reference -->
        <div style="margin-top:14px">
          <div style="font-size:12px;font-weight:500;color:var(--color-text-secondary);margin-bottom:6px">Tipe Section Tersedia:</div>
          <div v-for="st in sectionTypeRef" :key="st.type" style="font-size:11.5px;padding:4px 0;color:var(--color-text-tertiary);border-bottom:0.5px solid var(--color-border-tertiary)">
            <span style="font-weight:500;color:var(--color-text-secondary)">{{ st.label }}</span> — {{ st.desc }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { templateService } from '@/services'
import { useToast } from '@/composables'
import { AqlTable } from '@/utils/aqlHelper'

const router = useRouter()
const { success, error: toastError } = useToast()

const loadingTypes = ref(false)
const loading      = ref(false)
const types        = ref([])
const errors       = ref({})

const form = ref({
  inspection_type_id: '',
  name:               '',
  description:        '',
  version:            '1.0',
  default_unit:       'inches',
  sampling_method:    'aql_2_5',
  inspection_level:   'II',
  custom_sample_pct:  null,
})

const selectedType = computed(() =>
  types.value.find(t => t.id === form.value.inspection_type_id) ?? null
)

const samplingOptions = [
  { value: 'aql_2_5',   icon: '📊', label: 'AQL 2.5%',        desc: 'Sample size otomatis berdasarkan ISO 2859-1' },
  { value: 'check_all', icon: '🔍', label: '100% Check All',   desc: 'Semua unit diperiksa tanpa sampling' },
  { value: 'custom',    icon: '⚙️', label: 'Custom %',         desc: 'Tentukan sendiri persentase sample' },
]

const sectionTypeRef = [
  { type: 'order_detail',  label: 'Order Detail',        desc: 'Info PO, produk, qty' },
  { type: 'measurement',   label: 'Measurement Check',   desc: 'Pengukuran dengan target & toleransi' },
  { type: 'visual',        label: 'Visual Inspection',   desc: 'Defect, foto, severity' },
  { type: 'deformation',   label: 'Deformation Check',   desc: 'Crook, bow, cup, twist' },
  { type: 'evidence',      label: 'Evidence',            desc: 'Upload foto bukti' },
  { type: 'signature',     label: 'Signature',           desc: 'Tanda tangan inspector & manager' },
]

const aqlExamples = computed(() => {
  const level = form.value.inspection_level
  return [50, 95, 195].map(qty => {
    const r = AqlTable.lookup(qty, level)
    return { qty, sample: r?.sample ?? qty, ac: r?.ac ?? 0, re: r?.re ?? 1 }
  })
})

function typeIcon(slug) {
  return { final: '🏁', inline: '🔄', sample: '📋', pre_shipment: '🚢' }[slug] ?? '📄'
}

function validate() {
  const e = {}
  if (!form.value.inspection_type_id) e.inspection_type_id = 'Pilih tipe inspeksi.'
  if (!form.value.name.trim())         e.name               = 'Nama template wajib diisi.'
  if (!form.value.sampling_method)     e.sampling_method    = 'Pilih metode sampling.'
  if (form.value.sampling_method === 'custom' && !form.value.custom_sample_pct)
    e.custom_sample_pct = 'Persentase wajib diisi.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function submit() {
  if (!validate()) return
  loading.value = true
  try {
    const payload = {
      inspection_type_id: form.value.inspection_type_id,
      name:               form.value.name,
      description:        form.value.description || undefined,
      version:            form.value.version || '1.0',
      default_unit:       form.value.default_unit,
      sampling_method:    form.value.sampling_method,
      inspection_level:   form.value.inspection_level,
      custom_sample_pct:  form.value.custom_sample_pct || undefined,
    }
    const { data } = await templateService.create(payload)
    success('Template berhasil dibuat! Lanjut ke Builder.')
    router.push(`/templates/${data.template.id}/builder`)
  } catch(e) {
    toastError(e.response?.data?.message ?? 'Gagal membuat template.')
  } finally { loading.value = false }
}

onMounted(async () => {
  loadingTypes.value = true
  try {
    const { data } = await templateService.types()
    types.value = data.types ?? []
  } catch { toastError('Gagal memuat tipe inspeksi.') }
  finally { loadingTypes.value = false }
})
</script>

<style scoped>
.section-title { font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-secondary);margin-bottom:12px;padding-bottom:6px;border-bottom:1.5px solid var(--color-border-tertiary) }
.type-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:6px }
.type-card { padding:14px 12px;border:1.5px solid var(--color-border-tertiary);border-radius:9px;cursor:pointer;text-align:center;transition:all .12s }
.type-card:hover { border-color:#534AB7;background:#faf9ff }
.type-card.selected { border-color:#534AB7;background:#EEEDFE }
.type-icon { font-size:24px;margin-bottom:6px }
.type-name { font-size:12.5px;font-weight:500;color:var(--color-text-primary) }
.type-desc { font-size:11px;color:var(--color-text-tertiary);margin-top:3px;line-height:1.4 }
.sampling-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:6px }
.sampling-card { padding:14px 12px;border:1.5px solid var(--color-border-tertiary);border-radius:9px;cursor:pointer;text-align:center;transition:all .12s }
.sampling-card:hover { border-color:#534AB7;background:#faf9ff }
.sampling-card.selected { border-color:#534AB7;background:#EEEDFE }
.sampling-icon { font-size:24px;margin-bottom:6px }
.sampling-name { font-size:12.5px;font-weight:500;color:var(--color-text-primary) }
.sampling-desc { font-size:11px;color:var(--color-text-tertiary);margin-top:3px;line-height:1.4 }
.preview-row { display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:0.5px solid var(--color-border-tertiary) }
.preview-row span:first-child { color:var(--color-text-tertiary) }
.preview-row span:last-child { color:var(--color-text-primary);font-weight:500;text-align:right;max-width:60%;word-break:break-word }
.field-error { font-size:11.5px;color:#A32D2D;margin-top:4px;display:block }
.field-error-input { border-color:#E24B4A !important }
.loading-ph { text-align:center;color:var(--color-text-tertiary);font-size:13px }
.spinner-sm { width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block }
@keyframes spin { to { transform:rotate(360deg) } }
</style>