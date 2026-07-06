<template>
  <div>
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px">
      <button class="btn btn-secondary btn-sm" @click="$router.back()">← Kembali</button>
      <div>
        <h1 style="font-size:16px;font-weight:500;color:var(--color-text-primary)">Buat Inspeksi Baru</h1>
        <p style="font-size:12.5px;color:var(--color-text-tertiary);margin-top:2px">Pilih template dan isi informasi PO</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 360px;gap:16px;align-items:start">
      <!-- Left: Form -->
      <div class="card">
        <!-- Step indicator -->
        <div class="step-wrap">
          <div v-for="(s,i) in steps" :key="i" class="step-item" :class="{active: step===i, done: step>i}">
            <div class="step-circle">{{ step > i ? '✓' : i+1 }}</div>
            <span class="step-label">{{ s }}</span>
            <div v-if="i < steps.length-1" class="step-line" />
          </div>
        </div>

        <!-- Step 0: Pilih Template -->
        <div v-if="step === 0">
          <div class="section-title">Pilih Template Inspeksi</div>
          <div v-if="loadingTemplates" class="loading-ph">Memuat template...</div>
          <div v-else>
            <div class="field">
              <label>Tipe Inspeksi</label>
              <select v-model="filterType" @change="filterTemplates">
                <option value="">Semua tipe</option>
                <option v-for="t in types" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div class="template-grid">
              <div
                v-for="t in filteredTemplates"
                :key="t.id"
                class="template-card"
                :class="{ selected: form.template_id === t.id }"
                @click="selectTemplate(t)"
              >
                <div class="template-type">{{ t.inspection_type?.name }}</div>
                <div class="template-name">{{ t.name }}</div>
                <div class="template-meta">
                  v{{ t.version }} · {{ t.sampling_method === 'aql_2_5' ? 'AQL 2.5%' : t.sampling_method === 'check_all' ? '100% Check All' : 'Custom' }}
                  · Unit: {{ t.default_unit }}
                </div>
              </div>
            </div>
            <div v-if="!filteredTemplates.length" class="empty-ph">Tidak ada template published.</div>
          </div>
        </div>

        <!-- Step 1: Info PO -->
        <div v-if="step === 1">
          <div class="section-title">Informasi Purchase Order</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="field">
              <label>PO Number</label>
              <input v-model="form.po_number" type="text" placeholder="e.g. VERMALE-76397A"/>
            </div>
            <div class="field">
              <label>Tanggal Inspeksi</label>
              <input v-model="form.inspection_date" type="date"/>
            </div>
            <div class="field">
              <label>Customer</label>
              <input v-model="form.customer" type="text" placeholder="e.g. J&O"/>
            </div>
            <div class="field">
              <label>Manufacturer / Supplier</label>
              <input v-model="form.manufacturer" type="text" placeholder="e.g. PT. WII"/>
            </div>
            <div class="field" style="grid-column:1/-1">
              <label>Nama Produk</label>
              <input v-model="form.product_name" type="text" placeholder="e.g. 2P Shaker"/>
            </div>
            <div class="field" style="grid-column:1/-1">
              <label>Lokasi Inspeksi</label>
              <input v-model="form.location" type="text" placeholder="e.g. Gudang A, Bekasi"/>
            </div>
          </div>

          <div class="section-title" style="margin-top:20px">Assign Inspector</div>
          <div class="field">
            <label>Inspector</label>
            <select v-model="form.assigned_to">
              <option value="">Pilih inspector...</option>
              <option v-for="u in inspectors" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>

          <div class="section-title" style="margin-top:20px">Override Sampling (opsional)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="field">
              <label>Metode Sampling</label>
              <select v-model="form.sampling_method">
                <option value="">Ikuti template ({{ selectedTemplate?.sampling_method === 'aql_2_5' ? 'AQL 2.5%' : selectedTemplate?.sampling_method }})</option>
                <option value="aql_2_5">AQL 2.5%</option>
                <option value="check_all">100% Check All</option>
                <option value="custom">Custom %</option>
              </select>
            </div>
            <div class="field" v-if="form.sampling_method === 'custom'">
              <label>Persentase Sample (%)</label>
              <input v-model="form.custom_sample_pct" type="number" min="1" max="100" placeholder="e.g. 10"/>
            </div>
            <div class="field" v-if="form.sampling_method === 'aql_2_5' || (!form.sampling_method && selectedTemplate?.sampling_method === 'aql_2_5')">
              <label>AQL Level</label>
              <select v-model="form.inspection_level">
                <option value="">Level II (default)</option>
                <option value="I">Level I (lenient)</option>
                <option value="II">Level II (normal)</option>
                <option value="III">Level III (tightened)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 2: Order Items -->
        <div v-if="step === 2">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div class="section-title" style="margin-bottom:0">Order Detail (Produk)</div>
            <button class="btn btn-primary btn-sm" @click="addItem">+ Tambah Item</button>
          </div>

          <div v-if="!items.length" class="empty-ph">Belum ada item. Klik "Tambah Item" untuk menambahkan produk.</div>

          <div v-for="(item, idx) in items" :key="idx" class="item-card">
            <div class="item-header">
              <span class="item-no">Item {{ idx + 1 }}</span>
              <button class="btn btn-danger btn-sm" @click="removeItem(idx)" v-if="items.length > 1">Hapus</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
              <div class="field">
                <label>Nama Produk *</label>
                <input v-model="item.product_name" type="text" placeholder="e.g. VERMALE 2P SHAKER 36x96x1-3/8"/>
              </div>
              <div class="field">
                <label>Product Code</label>
                <input v-model="item.product_code" type="text" placeholder="e.g. JNO.SH2P.6246"/>
              </div>
              <div class="field">
                <label>Drawing Number</label>
                <input v-model="item.drawing_number" type="text" placeholder="e.g. DWG-001"/>
              </div>
              <div class="field">
                <label>Dimensi</label>
                <input v-model="item.dimensions" type="text" placeholder='e.g. 36" x 96" x 1-3/8"'/>
              </div>
              <div class="field" style="grid-column:1/-1">
                <label>Produced Quantity (pcs) *</label>
                <input v-model.number="item.produced_qty" type="number" min="1" placeholder="e.g. 95"
                  @input="previewAql(item)"/>
                <div v-if="item._aql" class="aql-preview">
                  📊 AQL → Sample: <strong>{{ item._aql.sample_size }} pcs</strong>
                  ({{ item._aql.pct }}%) · Ac: {{ item._aql.accept_no }} · Re: {{ item._aql.reject_no }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="nav-footer">
          <button class="btn btn-secondary" v-if="step > 0" @click="step--">← Sebelumnya</button>
          <div style="flex:1"/>
          <button
            v-if="step < steps.length - 1"
            class="btn btn-primary"
            :disabled="!canNext"
            @click="nextStep"
          >Selanjutnya →</button>
          <button
            v-if="step === steps.length - 1"
            class="btn btn-primary"
            :disabled="loading || !items.length"
            @click="submit"
          >
            <span v-if="loading" class="spinner-sm"/>
            {{ loading ? 'Menyimpan...' : 'Buat Inspeksi' }}
          </button>
        </div>
      </div>

      <!-- Right: Summary -->
      <div class="card">
        <div style="font-size:13px;font-weight:500;margin-bottom:12px">Ringkasan</div>
        <div class="summary-row"><span>Template</span><span>{{ selectedTemplate?.name ?? '—' }}</span></div>
        <div class="summary-row"><span>Tipe</span><span>{{ selectedTemplate?.inspection_type?.name ?? '—' }}</span></div>
        <div class="summary-row"><span>PO Number</span><span>{{ form.po_number || '—' }}</span></div>
        <div class="summary-row"><span>Customer</span><span>{{ form.customer || '—' }}</span></div>
        <div class="summary-row"><span>Produk</span><span>{{ form.product_name || '—' }}</span></div>
        <div class="summary-row"><span>Total Item</span><span>{{ items.length }} item</span></div>
        <div class="summary-row">
          <span>Sampling</span>
          <span>{{ form.sampling_method === 'aql_2_5' ? 'AQL 2.5%' : form.sampling_method === 'check_all' ? '100%' : form.sampling_method === 'custom' ? `Custom ${form.custom_sample_pct}%` : selectedTemplate?.sampling_method ?? '—' }}</span>
        </div>
        <div v-if="items.length" style="margin-top:12px;border-top:0.5px solid var(--color-border-tertiary);padding-top:10px">
          <div style="font-size:11.5px;font-weight:500;color:var(--color-text-secondary);margin-bottom:6px">Items</div>
          <div v-for="(item, i) in items" :key="i" style="font-size:12px;color:var(--color-text-tertiary);padding:3px 0">
            {{ i+1 }}. {{ item.product_name || '(belum diisi)' }}
            <span v-if="item.produced_qty"> — {{ item.produced_qty }} pcs</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { templateService, inspectionService, userService } from '@/services'
import { useToast } from '@/composables'
import { AqlTable } from '@/utils/aqlHelper'

const router = useRouter()
const { success, error: toastError } = useToast()

const steps = ['Pilih Template', 'Info PO', 'Item Produk']
const step  = ref(0)

const loadingTemplates = ref(false)
const loading          = ref(false)
const templates        = ref([])
const filteredTemplates = ref([])
const types            = ref([])
const inspectors       = ref([])
const filterType       = ref('')
const selectedTemplate = ref(null)

const form = ref({
  template_id: '',
  po_number: '', customer: '', manufacturer: '',
  product_name: '', inspection_date: '', location: '',
  assigned_to: '', sampling_method: '',
  inspection_level: '', custom_sample_pct: null,
})

const items = ref([])

const canNext = computed(() => {
  if (step.value === 0) return !!form.value.template_id
  if (step.value === 1) return !!form.value.assigned_to
  return true
})

function addItem() {
  items.value.push({
    product_name: '', product_code: '', drawing_number: '',
    dimensions: '', produced_qty: null, _aql: null,
  })
}

function removeItem(idx) {
  items.value.splice(idx, 1)
}

function selectTemplate(t) {
  form.value.template_id = t.id
  selectedTemplate.value = t
}

function filterTemplates() {
  filteredTemplates.value = filterType.value
    ? templates.value.filter(t => t.inspection_type?.id === filterType.value)
    : [...templates.value]
}

function previewAql(item) {
  if (!item.produced_qty || item.produced_qty < 2) { item._aql = null; return }
  const level = form.value.inspection_level || 'II'
  item._aql = AqlTable.calculate(item.produced_qty, level)
}

function nextStep() {
  if (step.value === 1 && !items.value.length) addItem()
  step.value++
}

async function submit() {
  const invalidItems = items.value.filter(i => !i.product_name || !i.produced_qty)
  if (invalidItems.length) {
    toastError('Nama produk dan produced qty wajib diisi untuk semua item.')
    return
  }

  loading.value = true
  try {
    // 1. Buat order
    const { data } = await inspectionService.create({
      ...form.value,
      sampling_method:   form.value.sampling_method   || undefined,
      inspection_level:  form.value.inspection_level  || undefined,
      custom_sample_pct: form.value.custom_sample_pct || undefined,
    })
    console.log(data, data.order.id);
    
    const orderId = data.order.id

    // 2. Tambah items satu per satu
    for (let i = 0; i < items.value.length; i++) {
      const item = items.value[i]
      await inspectionService.storeItem(orderId, {
        item_no: i + 1,
        product_name:   item.product_name,
        product_code:   item.product_code || undefined,
        drawing_number: item.drawing_number || undefined,
        dimensions:     item.dimensions || undefined,
        produced_qty:   item.produced_qty,
      })
    }

    success('Inspeksi berhasil dibuat!')
    router.push(`/inspections/${orderId}`)
  } catch (e) {
    toastError(e.response?.data?.message ?? 'Gagal membuat inspeksi.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  loadingTemplates.value = true
  try {
    const [tplRes, typeRes, userRes] = await Promise.allSettled([
      templateService.list({ per_page: 100, status: 'published' }),
      templateService.types(),
      userService.list({ role: 'inspector', per_page: 100 }),
    ])    

    if (tplRes.status === 'fulfilled') {
      // consr
      // templates.value = tplRes.value.data.data ?? []
      // console.log('Loaded templates:', templates.value);
      filteredTemplates.value = Array.isArray(tplRes.value) ? tplRes.value : (tplRes.value.data ?? [])
      console.log(filteredTemplates.value);
      
    }

    if (typeRes.status === 'fulfilled') {
      types.value = typeRes.value.data.types ?? []
    }

    if (userRes.status === 'fulfilled') {
      const resData = userRes.value.data
      inspectors.value = Array.isArray(resData) ? resData : (resData.data ?? [])
    }
    
  } catch (error) {
    console.error("Error fetching data:", error)
  } finally {
    loadingTemplates.value = false
  }
})
</script>

<style scoped>
.step-wrap { display:flex;align-items:center;margin-bottom:24px;gap:0 }
.step-item { display:flex;align-items:center;gap:8px;flex:1 }
.step-circle { width:26px;height:26px;border-radius:50%;background:var(--color-background-secondary);border:1.5px solid var(--color-border-primary);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--color-text-tertiary);flex-shrink:0 }
.step-item.active .step-circle { background:#534AB7;color:#fff;border-color:#534AB7 }
.step-item.done .step-circle { background:#0F6E56;color:#fff;border-color:#0F6E56 }
.step-label { font-size:12.5px;color:var(--color-text-tertiary);white-space:nowrap }
.step-item.active .step-label { color:#534AB7;font-weight:500 }
.step-item.done .step-label { color:#0F6E56 }
.step-line { flex:1;height:1.5px;background:var(--color-border-tertiary);margin:0 8px }
.section-title { font-size:12.5px;font-weight:500;color:var(--color-text-secondary);margin-bottom:14px;padding-bottom:6px;border-bottom:0.5px solid var(--color-border-tertiary) }
.template-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:8px }
.template-card { padding:12px 14px;border:1.5px solid var(--color-border-tertiary);border-radius:8px;cursor:pointer;transition:all .12s }
.template-card:hover { border-color:#534AB7;background:#faf9ff }
.template-card.selected { border-color:#534AB7;background:#EEEDFE }
.template-type { font-size:10.5px;color:#534AB7;font-weight:500;margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em }
.template-name { font-size:13px;font-weight:500;color:var(--color-text-primary) }
.template-meta { font-size:11px;color:var(--color-text-tertiary);margin-top:3px }
.item-card { border:0.5px solid var(--color-border-tertiary);border-radius:8px;padding:14px;margin-bottom:10px;background:var(--color-background-secondary) }
.item-header { display:flex;align-items:center;justify-content:space-between }
.item-no { font-size:12.5px;font-weight:500;color:#534AB7 }
.aql-preview { margin-top:6px;padding:7px 10px;background:#E1F5EE;border-radius:6px;font-size:12px;color:#085041;border:0.5px solid #A8DFC8 }
.nav-footer { display:flex;align-items:center;margin-top:24px;padding-top:16px;border-top:0.5px solid var(--color-border-tertiary);gap:10px }
.summary-row { display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:0.5px solid var(--color-border-tertiary) }
.summary-row span:first-child { color:var(--color-text-tertiary) }
.summary-row span:last-child { color:var(--color-text-primary);font-weight:500;text-align:right;max-width:60% }
.loading-ph, .empty-ph { text-align:center;padding:32px;color:var(--color-text-tertiary);font-size:13px }
.spinner-sm { width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block }
@keyframes spin { to { transform:rotate(360deg) } }
</style>