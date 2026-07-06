<template>
  <div v-if="loading" class="loading-ph">Memuat inspeksi...</div>
  <div v-else-if="!order" class="empty-ph">Inspeksi tidak ditemukan.</div>
  <div v-else>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn btn-secondary btn-sm" @click="$router.push('/inspections')">← Kembali</button>
          <h1 class="page-title">{{ order.po_number || 'Inspeksi' }}</h1>
          <span class="badge" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
        </div>
        <div class="page-meta">
          {{ order.customer }} · {{ order.manufacturer }} · {{ order.inspection_date }}
          · Inspector: {{ order.assigned_to?.name }}
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button v-if="canEdit && order.status !== 'draft'" class="btn btn-secondary btn-sm"
          @click="exportPdf">📄 Export PDF</button>
        <button v-if="canSubmit" class="btn btn-primary" :disabled="submitting" @click="submitOrder">
          <span v-if="submitting" class="spinner-sm"/>
          {{ submitting ? 'Memproses...' : '📤 Submit Inspeksi' }}
        </button>
      </div>
    </div>

    <!-- Info cards -->
    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">Template</div>
        <div class="info-val">{{ order.template?.name }}</div>
        <div class="info-sub">{{ order.template?.inspection_type?.name }}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Sampling</div>
        <div class="info-val">{{ samplingLabel(order.sampling_method) }}</div>
        <div class="info-sub">Level {{ order.inspection_level }}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Total Item</div>
        <div class="info-val">{{ order.items?.length ?? 0 }} produk</div>
      </div>
      <div class="info-card">
        <div class="info-label">Hasil</div>
        <div class="info-val" :style="`color:${overallResultColor}`">{{ overallResultLabel }}</div>
      </div>
    </div>

    <!-- Items tabs -->
    <div class="card" style="margin-top:14px">
      <div style="display:flex;gap:0;border-bottom:0.5px solid var(--color-border-tertiary);margin-bottom:16px;overflow-x:auto">
        <button
          v-for="item in order.items" :key="item.id"
          class="tab-btn"
          :class="{ active: activeItem?.id === item.id }"
          @click="activeItem = item"
        >
          <span class="tab-no">{{ item.item_no }}</span>
          <span class="tab-name">{{ truncate(item.product_name, 20) }}</span>
          <span class="tab-result" :class="`result-${item.result}`">{{ resultIcon(item.result) }}</span>
        </button>
      </div>

      <!-- Active item detail -->
      <div v-if="activeItem">
        <!-- Item info -->
        <div class="item-info-row">
          <div><span class="il">Produk</span><span class="iv">{{ activeItem.product_name }}</span></div>
          <div><span class="il">Dimensi</span><span class="iv">{{ activeItem.dimensions || '—' }}</span></div>
          <div><span class="il">Produced</span><span class="iv">{{ activeItem.produced_qty }} pcs</span></div>
          <div><span class="il">Sample</span><span class="iv">{{ activeItem.inspected_qty }} pcs ({{ activeItem.inspected_pct }}%)</span></div>
          <div><span class="il">AQL Ac/Re</span><span class="iv">{{ activeItem.aql_accept_no ?? '—' }} / {{ activeItem.aql_reject_no ?? '—' }}</span></div>
          <div>
            <span class="il">Result</span>
            <span class="iv" :class="`result-${activeItem.result}`">{{ activeItem.result?.toUpperCase() }}</span>
          </div>
        </div>

        <!-- Sample tabs -->
        <div style="display:flex;gap:8px;margin:14px 0 10px;flex-wrap:wrap">
          <button
            v-for="n in sampleCount" :key="n"
            class="sample-btn"
            :class="{ active: activeSample === n }"
            @click="activeSample = n"
          >Sample {{ n }}</button>
          <button v-if="canEdit" class="sample-btn add" @click="addSample">+ Sample</button>
        </div>

        <!-- Sections & Checkpoints -->
        <div v-for="section in templateSections" :key="section.id" class="cp-section">
          <div class="cp-section-title">{{ section.code }}. {{ section.title }}</div>

          <!-- Visual / Defect section -->
          <div v-if="section.section_type === 'visual'">
            <div class="defect-header">
              <span style="font-size:12.5px;font-weight:500">Defect Records</span>
              <button v-if="canEdit" class="btn btn-primary btn-sm" @click="openDefectModal(activeItem)">+ Tambah Defect</button>
            </div>
            <div v-if="!itemDefects.length" class="empty-ph" style="padding:16px">Tidak ada defect.</div>
            <table v-else style="width:100%;font-size:12.5px;border-collapse:collapse">
              <thead>
                <tr style="border-bottom:1px solid var(--color-border-tertiary)">
                  <th style="padding:6px 10px;text-align:left;color:var(--color-text-tertiary)">Defect</th>
                  <th style="padding:6px 10px;text-align:center">Severity</th>
                  <th style="padding:6px 10px;text-align:center">Qty</th>
                  <th style="padding:6px 10px;text-align:center">Action</th>
                  <th v-if="canEdit" style="padding:6px 10px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in itemDefects" :key="d.id" style="border-bottom:0.5px solid var(--color-border-tertiary)">
                  <td style="padding:7px 10px">{{ d.defect_type }}</td>
                  <td style="padding:7px 10px;text-align:center">
                    <span class="badge" :class="severityClass(d.severity)">{{ d.severity }}</span>
                  </td>
                  <td style="padding:7px 10px;text-align:center;font-weight:500">{{ d.qty }}</td>
                  <td style="padding:7px 10px;text-align:center;color:var(--color-text-secondary)">{{ d.action ?? '—' }}</td>
                  <td v-if="canEdit" style="padding:7px 10px">
                    <button class="btn btn-danger btn-sm" @click="deleteDefect(d.id)">Hapus</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="itemDefects.length" class="defect-summary">
              Minor: <strong>{{ activeItem.total_minor_defects }}</strong> ·
              Major: <strong style="color:#A32D2D">{{ activeItem.total_major_defects }}</strong> ·
              Critical: <strong style="color:#7C1D1D">{{ activeItem.total_critical_defects }}</strong>
            </div>
          </div>

          <!-- Measurement / other sections -->
          <div v-else class="cp-grid">
            <div v-for="cp in section.checkpoints" :key="cp.id" class="cp-item">
              <div class="cp-label">
                {{ cp.label }}
                <span v-if="cp.is_required" style="color:#A32D2D">*</span>
                <span v-if="cp.unit !== 'none'" class="cp-unit">{{ unitLabel(cp.unit) }}</span>
              </div>

              <!-- Target / range info -->
              <div v-if="cp.target_value" class="cp-target">
                Target: {{ cp.target_value }}
                <span v-if="cp.min_value && cp.max_value">· Range: {{ cp.min_value }}–{{ cp.max_value }}</span>
              </div>

              <!-- Input -->
              <div class="cp-input-wrap">
                <input
                  v-if="cp.input_type === 'number'"
                  type="number" step="0.001"
                  :disabled="!canEdit"
                  :value="getResponse(activeItem.id, cp.id, activeSample)?.value_number"
                  @change="saveResponse(activeItem.id, cp.id, activeSample, 'number', $event.target.value, cp.unit)"
                  :class="{ 'out-of-range': getResponse(activeItem.id, cp.id, activeSample)?.is_out_of_range }"
                  class="cp-input"
                  :placeholder="cp.target_value ?? ''"
                />
                <input
                  v-else-if="cp.input_type === 'text'"
                  type="text"
                  :disabled="!canEdit"
                  :value="getResponse(activeItem.id, cp.id, activeSample)?.value_text"
                  @change="saveResponse(activeItem.id, cp.id, activeSample, 'text', $event.target.value)"
                  class="cp-input"
                />
                <select
                  v-else-if="cp.input_type === 'select' || cp.input_type === 'checkbox'"
                  :disabled="!canEdit"
                  :value="getResponse(activeItem.id, cp.id, activeSample)?.value_text"
                  @change="saveResponse(activeItem.id, cp.id, activeSample, 'text', $event.target.value)"
                  class="cp-input"
                >
                  <option value="">Pilih...</option>
                  <option v-for="opt in (cp.options ?? ['OK', 'NG'])" :key="opt" :value="opt">{{ opt }}</option>
                </select>
                <div v-else-if="cp.input_type === 'photo'">
                  <input type="file" accept="image/*" :disabled="!canEdit"
                    @change="uploadEvidence(activeItem.id, cp.id, $event)"/>
                </div>

                <!-- Out of range warning -->
                <div v-if="getResponse(activeItem.id, cp.id, activeSample)?.is_out_of_range" class="oor-badge">
                  ⚠ Out of range
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Save responses button -->
        <div v-if="canEdit && pendingResponses.size > 0" style="margin-top:16px;text-align:right">
          <button class="btn btn-primary" :disabled="saving" @click="flushResponses">
            <span v-if="saving" class="spinner-sm"/>
            {{ saving ? 'Menyimpan...' : `💾 Simpan (${pendingResponses.size} perubahan)` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Approval History -->
    <div v-if="order.approvals?.length" class="card" style="margin-top:14px">
      <div class="card-head"><span class="card-title">Riwayat Approval</span></div>
      <div v-for="a in order.approvals" :key="a.id" class="approval-row" :class="a.status">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="ap-step">Step {{ a.step_order }}</div>
          <div>
            <div style="font-size:13px;font-weight:500">{{ a.approver?.name }}</div>
            <div style="font-size:11.5px;color:var(--color-text-tertiary)">{{ a.acted_at ? formatDate(a.acted_at) : 'Belum diproses' }}</div>
          </div>
        </div>
        <div style="text-align:right">
          <span class="badge" :class="statusClass(a.status)">{{ a.status }}</span>
          <div v-if="a.remarks" style="font-size:11.5px;color:var(--color-text-secondary);margin-top:4px">{{ a.remarks }}</div>
        </div>
      </div>
    </div>

    <!-- Defect Modal -->
    <Teleport to="body">
      <div v-if="defectModal.open" class="modal-overlay" @click.self="defectModal.open=false">
        <div class="modal">
          <div class="modal-title">Tambah Defect</div>
          <div class="field" style="margin-top:14px">
            <label>Tipe Defect *</label>
            <input v-model="defectModal.defect_type" type="text" placeholder="e.g. Bad Repair, Missing Paint"/>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field">
              <label>Severity *</label>
              <select v-model="defectModal.severity">
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="field">
              <label>Qty (pcs) *</label>
              <input v-model.number="defectModal.qty" type="number" min="1"/>
            </div>
            <div class="field">
              <label>Action</label>
              <select v-model="defectModal.action">
                <option value="">—</option>
                <option value="repair">Repair</option>
                <option value="reject">Reject</option>
                <option value="accept">Accept</option>
              </select>
            </div>
            <div class="field">
              <label>Sample No</label>
              <input v-model.number="defectModal.sample_no" type="number" min="1"/>
            </div>
          </div>
          <div class="field">
            <label>Remarks</label>
            <textarea v-model="defectModal.remarks" rows="2"/>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="defectModal.open=false">Batal</button>
            <button class="btn btn-primary" @click="saveDefect">Simpan</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { inspectionService, reportService } from '@/services'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useToast } from '@/composables'
import { useDownload } from '@/composables'
import { statusLabel, statusClass } from '@/utils/statusHelper'
import { UnitConverter } from '@/utils/aqlHelper'

const route   = useRoute()
const auth    = useAuthStore()
const { success, error: toastError } = useToast()
const { download } = useDownload()

const loading    = ref(true)
const submitting = ref(false)
const saving     = ref(false)
const order      = ref(null)
const activeItem = ref(null)
const activeSample = ref(1)

// Local response cache: key = `${itemId}_${checkpointId}_${sampleNo}`
const responseCache  = ref({})
const pendingResponses = ref(new Map())

const defectModal = ref({
  open: false, item: null,
  defect_type: '', severity: 'minor', qty: 1,
  action: '', remarks: '', sample_no: 1,
})

// ── Computed ────────────────────────────────────────────────────────────────

const canEdit = computed(() =>
  auth.can('inspection.update-own') && order.value?.canBeEdited?.()
  || auth.can('inspection.view-all')
)
const canSubmit = computed(() =>
  auth.can('inspection.submit') && ['draft','in_progress'].includes(order.value?.status)
  && order.value?.assigned_to?.id === auth.user?.id
)

const templateSections = computed(() =>
  order.value?.template?.sections ?? []
)

const sampleCount = computed(() => {
  if (!activeItem.value) return 1
  return activeItem.value.inspected_qty ?? 1
})

const itemDefects = computed(() =>
  activeItem.value?.defects ?? []
)

const overallResult = computed(() => {
  if (!order.value?.items?.length) return 'pending'
  if (order.value.items.some(i => i.result === 'fail')) return 'fail'
  if (order.value.items.every(i => i.result === 'pass')) return 'pass'
  return 'pending'
})
const overallResultLabel = computed(() =>
  ({ pass: 'PASS ✅', fail: 'FAIL ❌', pending: 'Pending ⏳', conditional: 'Conditional ⚠️' })[overallResult.value]
)
const overallResultColor = computed(() =>
  ({ pass: '#0F6E56', fail: '#A32D2D', pending: '#888', conditional: '#854F0B' })[overallResult.value]
)

// ── Methods ─────────────────────────────────────────────────────────────────

function samplingLabel(m) {
  return { aql_2_5: 'AQL 2.5%', check_all: '100% Check All', custom: 'Custom' }[m] ?? m
}

function unitLabel(u) { return UnitConverter.label(u) }

function truncate(str, n) { return str?.length > n ? str.slice(0, n) + '…' : str }

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'
}

function resultIcon(r) {
  return { pass:'✅', fail:'❌', pending:'⏳', conditional:'⚠️' }[r] ?? '—'
}

function severityClass(s) {
  return { minor: 'badge-submitted', major: 'badge-rejected', critical: 'badge-rejected' }[s] ?? ''
}

function getResponse(itemId, checkpointId, sampleNo) {
  const key = `${itemId}_${checkpointId}_${sampleNo}`
  return responseCache.value[key] ?? null
}

function saveResponse(itemId, cpId, sampleNo, type, value, unit) {
  const key = `${itemId}_${cpId}_${sampleNo}`
  const existing = responseCache.value[key] ?? {}

  const updated = {
    ...existing,
    checkpoint_id: cpId,
    sample_no: sampleNo,
    ...(type === 'number'
      ? { value_number: parseFloat(value), value_unit: unit }
      : { value_text: value }),
  }

  responseCache.value[key] = updated
  pendingResponses.value.set(key, { itemId, ...updated })
}

async function flushResponses() {
  if (!pendingResponses.value.size) return
  saving.value = true

  // Group by itemId
  const byItem = new Map()
  for (const [, resp] of pendingResponses.value) {
    if (!byItem.has(resp.itemId)) byItem.set(resp.itemId, [])
    byItem.get(resp.itemId).push(resp)
  }

  try {
    for (const [itemId, responses] of byItem) {
      await inspectionService.saveResponses(order.value.id, itemId, { responses })
    }
    pendingResponses.value.clear()
    success('Jawaban berhasil disimpan.')
    await fetchOrder()
  } catch {
    toastError('Gagal menyimpan jawaban.')
  } finally {
    saving.value = false
  }
}

function addSample() {
  if (activeSample.value < sampleCount.value) {
    activeSample.value = sampleCount.value
  }
}

function openDefectModal(item) {
  defectModal.value = {
    open: true, item,
    defect_type: '', severity: 'minor', qty: 1,
    action: '', remarks: '', sample_no: activeSample.value,
  }
}

async function saveDefect() {
  if (!defectModal.value.defect_type || !defectModal.value.qty) {
    toastError('Tipe defect dan qty wajib diisi.')
    return
  }
  try {
    await inspectionService.storeDefect(
      order.value.id,
      defectModal.value.item.id,
      {
        defect_type: defectModal.value.defect_type,
        severity:    defectModal.value.severity,
        qty:         defectModal.value.qty,
        action:      defectModal.value.action || undefined,
        remarks:     defectModal.value.remarks || undefined,
        sample_no:   defectModal.value.sample_no,
      }
    )
    defectModal.value.open = false
    success('Defect berhasil dicatat.')
    await fetchOrder()
  } catch {
    toastError('Gagal menyimpan defect.')
  }
}

async function deleteDefect(defectId) {
  if (!confirm('Hapus defect ini?')) return
  try {
    await inspectionService.destroyDefect(defectId)
    success('Defect dihapus.')
    await fetchOrder()
  } catch {
    toastError('Gagal menghapus defect.')
  }
}

async function uploadEvidence(itemId, cpId, event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('checkpoint_id', cpId)
    formData.append('caption', `Evidence - CP ${cpId}`)
    await inspectionService.uploadEvidence(order.value.id, itemId, formData)
    success('Foto berhasil diupload.')
  } catch {
    toastError('Gagal upload foto.')
  }
}

async function submitOrder() {
  if (!confirm('Submit inspeksi? Pastikan semua data sudah diisi.')) return
  submitting.value = true
  try {
    // Flush pending responses first
    if (pendingResponses.value.size > 0) await flushResponses()
    await inspectionService.submit(order.value.id)
    success('Inspeksi berhasil disubmit!')
    await fetchOrder()
  } catch (e) {
    toastError(e.response?.data?.message ?? 'Gagal submit inspeksi.')
  } finally {
    submitting.value = false
  }
}

async function exportPdf() {
  try {
    const { data } = await reportService.exportPdf({ inspection_id: order.value.id })
    download(data, `inspeksi-${order.value.po_number ?? order.value.id}.pdf`)
  } catch {
    toastError('Gagal export PDF.')
  }
}

// Hydrate response cache from loaded data
function hydrateCache() {
  if (!order.value?.items) return
  for (const item of order.value.items) {
    if (!item.responses) continue
    for (const [, sampleGroup] of Object.entries(item.responses)) {
      for (const resp of Object.values(sampleGroup)) {
        const key = `${item.id}_${resp.checkpoint_id}_${resp.sample_no}`
        responseCache.value[key] = resp
      }
    }
  }
}

async function fetchOrder() {
  const { data } = await inspectionService.get(route.params.id)
  
  order.value = data.order
  if (!activeItem.value && order.value.items?.length) {
    activeItem.value = order.value.items[0]
  } else if (activeItem.value) {
    activeItem.value = order.value.items?.find(i => i.id === activeItem.value.id) ?? order.value.items?.[0]
  }
  hydrateCache()
}

onMounted(async () => {
  try {
    await fetchOrder()
  } catch {
    toastError('Gagal memuat inspeksi.')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;gap:12px }
.page-title { font-size:17px;font-weight:500;color:var(--color-text-primary) }
.page-meta { font-size:12px;color:var(--color-text-tertiary);margin-top:3px }
.info-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:0 }
.info-card { background:#fff;border:0.5px solid var(--color-border-tertiary);border-radius:9px;padding:12px 14px }
.info-label { font-size:11.5px;color:var(--color-text-tertiary);margin-bottom:4px }
.info-val { font-size:16px;font-weight:500;color:var(--color-text-primary) }
.info-sub { font-size:11px;color:var(--color-text-tertiary);margin-top:2px }
.tab-btn { display:flex;align-items:center;gap:6px;padding:8px 14px;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;font-size:12.5px;color:var(--color-text-secondary);white-space:nowrap;flex-shrink:0 }
.tab-btn.active { border-bottom-color:#534AB7;color:#534AB7;font-weight:500 }
.tab-no { width:20px;height:20px;border-radius:50%;background:var(--color-background-secondary);font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center }
.tab-btn.active .tab-no { background:#534AB7;color:#fff }
.tab-name { max-width:120px;overflow:hidden;text-overflow:ellipsis }
.tab-result { font-size:14px }
.item-info-row { display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:var(--color-background-secondary);border-radius:8px;padding:12px 14px;margin-bottom:14px }
.item-info-row > div { display:flex;flex-direction:column;gap:2px }
.il { font-size:11px;color:var(--color-text-tertiary) }
.iv { font-size:13px;font-weight:500;color:var(--color-text-primary) }
.result-pass { color:#0F6E56 }
.result-fail { color:#A32D2D }
.result-pending { color:#888 }
.result-conditional { color:#854F0B }
.sample-btn { padding:5px 14px;border:1px solid var(--color-border-tertiary);border-radius:20px;font-size:12px;background:#fff;cursor:pointer;color:var(--color-text-secondary) }
.sample-btn.active { background:#534AB7;color:#fff;border-color:#534AB7 }
.sample-btn.add { border-style:dashed;color:#534AB7 }
.cp-section { margin-bottom:20px }
.cp-section-title { font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#534AB7;padding:6px 0;border-bottom:1.5px solid #534AB7;margin-bottom:12px }
.cp-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:12px }
.cp-item { display:flex;flex-direction:column;gap:4px }
.cp-label { font-size:12px;font-weight:500;color:var(--color-text-secondary) }
.cp-unit { font-size:10.5px;color:var(--color-text-tertiary);margin-left:4px }
.cp-target { font-size:11px;color:var(--color-text-tertiary) }
.cp-input-wrap { position:relative }
.cp-input { width:100%;padding:7px 10px;border:1px solid var(--color-border-primary);border-radius:6px;font-size:13px;outline:none;transition:border-color .15s }
.cp-input:focus { border-color:#534AB7 }
.cp-input.out-of-range { border-color:#E24B4A;background:#FFF5F5 }
.oor-badge { font-size:11px;color:#A32D2D;margin-top:3px;font-weight:500 }
.defect-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:10px }
.defect-summary { margin-top:10px;font-size:12.5px;color:var(--color-text-secondary);padding:8px;background:var(--color-background-secondary);border-radius:6px }
.approval-row { display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:8px;margin-bottom:8px;border:0.5px solid var(--color-border-tertiary) }
.approval-row.approved { background:#E1F5EE;border-color:#A8DFC8 }
.approval-row.rejected { background:#FCEBEB;border-color:#F5BABA }
.approval-row.revised { background:#FAEEDA;border-color:#F0CC8C }
.approval-row.pending { background:var(--color-background-secondary) }
.ap-step { width:28px;height:28px;border-radius:50%;background:#534AB7;color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100 }
.modal { background:#fff;border-radius:12px;padding:24px;width:480px;max-width:90%;box-shadow:0 8px 32px rgba(0,0,0,.15) }
.modal-title { font-size:16px;font-weight:500 }
.modal-footer { display:flex;gap:8px;justify-content:flex-end;margin-top:16px }
.spinner-sm { width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block }
@keyframes spin { to { transform:rotate(360deg) } }
.loading-ph, .empty-ph { text-align:center;padding:48px;color:var(--color-text-tertiary);font-size:13px }
</style>