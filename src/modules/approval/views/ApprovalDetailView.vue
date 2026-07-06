<template>
  <div v-if="loading" class="loading-ph">Memuat data approval...</div>
  <div v-else-if="!approval" class="empty-ph">Data tidak ditemukan.</div>
  <div v-else>
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn btn-secondary btn-sm" @click="$router.push('/approvals')">← Kembali</button>
        <div>
          <div style="display:flex;align-items:center;gap:8px">
            <h1 style="font-size:16px;font-weight:500">Review Inspeksi</h1>
            <span class="badge badge-review">Step {{ approval.step_order }} — {{ approval.step_label }}</span>
          </div>
          <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">
            PO: {{ order.po_number }} · {{ order.customer }} · {{ order.manufacturer }}
          </p>
        </div>
      </div>
      <!-- Action buttons -->
      <div style="display:flex;gap:8px" v-if="approval.status === 'pending'">
        <button class="btn btn-secondary" @click="openAction('revise')">✏️ Minta Revisi</button>
        <button class="btn btn-danger" @click="openAction('reject')">❌ Tolak</button>
        <button class="btn btn-success" @click="openAction('approve')">✅ Setujui</button>
      </div>
      <div v-else>
        <span class="badge" :class="statusClass(approval.status)" style="font-size:13px;padding:5px 14px">
          {{ approval.status.toUpperCase() }}
        </span>
      </div>
    </div>

    <!-- Info cards row -->
    <div class="info-grid" style="margin-bottom:14px">
      <div class="info-card">
        <div class="info-label">Tipe Inspeksi</div>
        <div class="info-val">{{ order.template?.inspection_type?.name }}</div>
        <div class="info-sub">{{ order.template?.name }}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Inspector</div>
        <div class="info-val">{{ order.assigned_to?.name }}</div>
        <div class="info-sub">{{ order.inspection_date }}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Sampling</div>
        <div class="info-val">{{ samplingLabel(order.sampling_method) }}</div>
        <div class="info-sub">Level {{ order.inspection_level }}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Hasil Keseluruhan</div>
        <div class="info-val" :style="`color:${overallColor}`">{{ overallLabel }}</div>
        <div class="info-sub">{{ order.items?.length }} item produk</div>
      </div>
    </div>

    <!-- Items overview table -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-head"><span class="card-title">Ringkasan Item & AQL</span></div>
      <table style="width:100%;border-collapse:collapse;font-size:12.5px">
        <thead>
          <tr style="border-bottom:1px solid var(--color-border-tertiary)">
            <th style="padding:8px 12px;text-align:left;color:var(--color-text-tertiary)">No</th>
            <th style="padding:8px 12px;text-align:left;color:var(--color-text-tertiary)">Produk</th>
            <th style="padding:8px 12px;text-align:center;color:var(--color-text-tertiary)">Produced</th>
            <th style="padding:8px 12px;text-align:center;color:var(--color-text-tertiary)">Sample</th>
            <th style="padding:8px 12px;text-align:center;color:var(--color-text-tertiary)">Ac/Re</th>
            <th style="padding:8px 12px;text-align:center;color:var(--color-text-tertiary)">Minor</th>
            <th style="padding:8px 12px;text-align:center;color:var(--color-text-tertiary)">Major</th>
            <th style="padding:8px 12px;text-align:center;color:var(--color-text-tertiary)">Critical</th>
            <th style="padding:8px 12px;text-align:center;color:var(--color-text-tertiary)">Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in order.items" :key="item.id"
            style="border-bottom:0.5px solid var(--color-border-tertiary);cursor:pointer"
            :class="{ 'row-active': activeItem?.id === item.id }"
            @click="activeItem = item">
            <td style="padding:9px 12px;color:var(--color-text-tertiary)">{{ item.item_no }}</td>
            <td style="padding:9px 12px">
              <div style="font-weight:500">{{ item.product_name }}</div>
              <div style="font-size:11px;color:var(--color-text-tertiary)">{{ item.dimensions }}</div>
            </td>
            <td style="padding:9px 12px;text-align:center">{{ item.produced_qty }}</td>
            <td style="padding:9px 12px;text-align:center">{{ item.inspected_qty }} ({{ item.inspected_pct }}%)</td>
            <td style="padding:9px 12px;text-align:center;font-size:12px">
              {{ item.aql_accept_no ?? '—' }} / {{ item.aql_reject_no ?? '—' }}
            </td>
            <td style="padding:9px 12px;text-align:center">{{ item.total_minor_defects }}</td>
            <td style="padding:9px 12px;text-align:center;color:#A32D2D;font-weight:500">{{ item.total_major_defects }}</td>
            <td style="padding:9px 12px;text-align:center;color:#7C1D1D;font-weight:700">{{ item.total_critical_defects }}</td>
            <td style="padding:9px 12px;text-align:center">
              <span :class="`result-${item.result}`" style="font-weight:600;font-size:12px">
                {{ { pass:'✅ PASS', fail:'❌ FAIL', pending:'⏳', conditional:'⚠️ COND' }[item.result] }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail item terpilih -->
    <div v-if="activeItem" class="card" style="margin-bottom:14px">
      <div class="card-head">
        <span class="card-title">Detail: Item {{ activeItem.item_no }} — {{ activeItem.product_name }}</span>
        <span style="font-size:12px;color:var(--color-text-tertiary)">{{ activeItem.dimensions }}</span>
      </div>

      <!-- Tabs: sections -->
      <div style="display:flex;gap:0;border-bottom:0.5px solid var(--color-border-tertiary);margin-bottom:14px;overflow-x:auto">
        <button v-for="s in order.template?.sections" :key="s.id"
          class="tab-btn" :class="{ active: activeSectionId === s.id }"
          @click="activeSectionId = s.id">
          {{ s.code }}. {{ s.title }}
        </button>
      </div>

      <div v-for="s in order.template?.sections" :key="s.id" v-show="activeSectionId === s.id">
        <!-- Visual section: show defects -->
        <div v-if="s.section_type === 'visual'">
          <div v-if="!activeItem.defects?.length" class="empty-ph" style="padding:20px">Tidak ada defect.</div>
          <table v-else style="width:100%;border-collapse:collapse;font-size:12.5px">
            <thead>
              <tr style="border-bottom:1px solid var(--color-border-tertiary)">
                <th style="padding:7px 10px;text-align:left;color:var(--color-text-tertiary)">Defect Type</th>
                <th style="padding:7px 10px;text-align:center;color:var(--color-text-tertiary)">Sample</th>
                <th style="padding:7px 10px;text-align:center;color:var(--color-text-tertiary)">Severity</th>
                <th style="padding:7px 10px;text-align:center;color:var(--color-text-tertiary)">Qty</th>
                <th style="padding:7px 10px;text-align:center;color:var(--color-text-tertiary)">Action</th>
                <th style="padding:7px 10px;color:var(--color-text-tertiary)">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in activeItem.defects" :key="d.id" style="border-bottom:0.5px solid var(--color-border-tertiary)">
                <td style="padding:7px 10px;font-weight:500">{{ d.defect_type }}</td>
                <td style="padding:7px 10px;text-align:center">{{ d.sample_no }}</td>
                <td style="padding:7px 10px;text-align:center">
                  <span class="badge" :class="{ 'badge-submitted': d.severity==='minor', 'badge-rejected': d.severity!=='minor' }">
                    {{ d.severity }}
                  </span>
                </td>
                <td style="padding:7px 10px;text-align:center;font-weight:500">{{ d.qty }}</td>
                <td style="padding:7px 10px;text-align:center;color:var(--color-text-secondary)">{{ d.action || '—' }}</td>
                <td style="padding:7px 10px;color:var(--color-text-secondary);font-size:12px">{{ d.remarks || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Measurement sections -->
        <div v-else-if="s.section_type === 'measurement' || s.section_type === 'deformation'">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
            <div v-for="cp in s.checkpoints" :key="cp.id" class="cp-review-card">
              <div class="cp-review-label">{{ cp.label }}
                <span v-if="cp.unit !== 'none'" style="color:var(--color-text-tertiary)">({{ cp.unit }})</span>
              </div>
              <div v-if="cp.target_value" class="cp-review-target">
                Target: {{ cp.target_value }}
                <span v-if="cp.min_value">· {{ cp.min_value }}–{{ cp.max_value }}</span>
              </div>
              <!-- Show all sample responses for this checkpoint -->
              <div v-for="n in activeItem.inspected_qty" :key="n" class="cp-sample-val">
                <span style="font-size:10px;color:var(--color-text-tertiary)">S{{ n }}:</span>
                <span :class="getResponseClass(activeItem.id, cp.id, n)">
                  {{ getResponseVal(activeItem.id, cp.id, n) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Evidence section -->
        <div v-else-if="s.section_type === 'evidence'">
          <div v-if="!activeItem.evidences?.length" class="empty-ph" style="padding:20px">Tidak ada foto bukti.</div>
          <div v-else style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
            <div v-for="e in activeItem.evidences" :key="e.id" class="evidence-card">
              <img :src="e.file_url" :alt="e.caption" style="width:100%;height:120px;object-fit:cover;border-radius:6px"/>
              <div style="font-size:11.5px;color:var(--color-text-secondary);margin-top:4px;text-align:center">{{ e.caption }}</div>
            </div>
          </div>
        </div>

        <!-- Other sections: show text responses -->
        <div v-else>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
            <div v-for="cp in s.checkpoints" :key="cp.id" class="cp-review-card">
              <div class="cp-review-label">{{ cp.label }}</div>
              <div class="cp-sample-val">
                {{ getResponseVal(activeItem.id, cp.id, 1) || '—' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Previous approvals -->
    <div class="card" v-if="order.approvals?.length">
      <div class="card-head"><span class="card-title">Riwayat Approval</span></div>
      <div v-for="a in order.approvals" :key="a.id"
        class="approval-hist-row" :class="a.status">
        <div>
          <span class="ap-step-badge">Step {{ a.step_order }}</span>
          <strong style="margin-left:8px">{{ a.approver?.name }}</strong>
          <span style="font-size:12px;color:var(--color-text-tertiary);margin-left:6px">{{ a.acted_at ? formatDate(a.acted_at) : 'Menunggu' }}</span>
        </div>
        <div style="text-align:right">
          <span class="badge" :class="statusClass(a.status)">{{ a.status }}</span>
          <div v-if="a.remarks" style="font-size:12px;color:var(--color-text-secondary);margin-top:3px">{{ a.remarks }}</div>
        </div>
      </div>
    </div>

    <!-- Action Modal -->
    <Teleport to="body">
      <div v-if="actionModal.open" class="modal-overlay" @click.self="actionModal.open=false">
        <div class="modal">
          <div class="modal-title">
            {{ actionModal.action === 'approve' ? '✅ Setujui' : actionModal.action === 'reject' ? '❌ Tolak' : '✏️ Minta Revisi' }}
            Inspeksi
          </div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin:6px 0 16px">
            PO: <strong>{{ order.po_number }}</strong> — {{ order.product_name }}
          </div>
          <div class="field">
            <label>{{ actionModal.action === 'approve' ? 'Catatan (opsional)' : 'Alasan / Catatan (wajib)' }}</label>
            <textarea v-model="actionModal.remarks" rows="4"
              :placeholder="actionModal.action === 'approve' ? 'Tambahkan catatan jika ada...' : 'Tulis alasan keputusan Anda...'"/>
            <span v-if="actionModal.error" class="field-error">{{ actionModal.error }}</span>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="actionModal.open=false">Batal</button>
            <button class="btn" :disabled="actionModal.loading"
              :class="actionModal.action==='approve' ? 'btn-success' : actionModal.action==='reject' ? 'btn-danger' : 'btn-primary'"
              @click="submitAction">
              <span v-if="actionModal.loading" class="spinner-sm"/>
              {{ actionModal.action === 'approve' ? 'Setujui' : actionModal.action === 'reject' ? 'Tolak' : 'Kirim Revisi' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { approvalService } from '@/services'
import { useToast } from '@/composables'
import { statusLabel, statusClass } from '@/utils/statusHelper'

const route  = useRoute()
const router = useRouter()
const { success, error: toastError } = useToast()

const loading        = ref(true)
const approval       = ref(null)
const order          = ref(null)
const activeItem     = ref(null)
const activeSectionId = ref(null)
const responseCache  = ref({})

const actionModal = ref({ open:false, action:'approve', remarks:'', error:'', loading:false })

const samplingLabel = m => ({ aql_2_5:'AQL 2.5%', check_all:'100% Check All', custom:'Custom' }[m] ?? m)
const formatDate = iso => iso ? new Date(iso).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

const overallResult = computed(() => {
  if (!order.value?.items?.length) return 'pending'
  if (order.value.items.some(i => i.result === 'fail')) return 'fail'
  if (order.value.items.every(i => i.result === 'pass')) return 'pass'
  return 'conditional'
})
const overallLabel = computed(() => ({ pass:'PASS ✅', fail:'FAIL ❌', conditional:'CONDITIONAL ⚠️', pending:'PENDING ⏳' })[overallResult.value])
const overallColor = computed(() => ({ pass:'#0F6E56', fail:'#A32D2D', conditional:'#854F0B', pending:'#888' })[overallResult.value])

function getResponseVal(itemId, cpId, sampleNo) {
  const key = `${itemId}_${cpId}_${sampleNo}`
  const r = responseCache.value[key]
  if (!r) return '—'
  return r.value_number ?? r.value_text ?? '—'
}

function getResponseClass(itemId, cpId, sampleNo) {
  const key = `${itemId}_${cpId}_${sampleNo}`
  const r = responseCache.value[key]
  if (!r) return ''
  return r.is_out_of_range ? 'oor-val' : 'ok-val'
}

function hydrateCache() {
  if (!order.value?.items) return
  for (const item of order.value.items) {
    if (!item.responses) continue
    for (const sampleGroup of Object.values(item.responses)) {
      for (const resp of Object.values(sampleGroup)) {
        const key = `${item.id}_${resp.checkpoint_id}_${resp.sample_no}`
        responseCache.value[key] = resp
      }
    }
  }
}

function openAction(action) {
  actionModal.value = { open:true, action, remarks:'', error:'', loading:false }
}

async function submitAction() {
  const { action, remarks } = actionModal.value
  if (action !== 'approve' && !remarks.trim()) {
    actionModal.value.error = 'Alasan wajib diisi.'
    return
  }
  actionModal.value.loading = true
  actionModal.value.error   = ''
  try {
    const payload = { remarks }
    if (action === 'approve')      await approvalService.approve(approval.value.id, payload)
    else if (action === 'reject')  await approvalService.reject(approval.value.id, payload)
    else                           await approvalService.revise(approval.value.id, payload)

    success(action === 'approve' ? 'Inspeksi disetujui.' : action === 'reject' ? 'Inspeksi ditolak.' : 'Revisi dikirim.')
    actionModal.value.open = false
    router.push('/approvals')
  } catch(e) {
    actionModal.value.error = e.response?.data?.message ?? 'Terjadi kesalahan.'
  } finally {
    actionModal.value.loading = false
  }
}

onMounted(async () => {
  try {
    const { data } = await approvalService.get(route.params.id)
    approval.value       = data.approval
    order.value          = data.inspection
    activeItem.value     = order.value.items?.[0] ?? null
    activeSectionId.value = order.value.template?.sections?.[0]?.id ?? null
    hydrateCache()
  } catch { toastError('Gagal memuat data approval.') }
  finally { loading.value = false }
})
</script>

<style scoped>
.info-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:10px }
.info-card { background:#fff;border:0.5px solid var(--color-border-tertiary);border-radius:9px;padding:12px 14px }
.info-label { font-size:11.5px;color:var(--color-text-tertiary);margin-bottom:4px }
.info-val { font-size:15px;font-weight:500;color:var(--color-text-primary) }
.info-sub { font-size:11px;color:var(--color-text-tertiary);margin-top:2px }
.row-active td { background:#faf9ff !important }
.result-pass { color:#0F6E56 } .result-fail { color:#A32D2D } .result-pending { color:#888 } .result-conditional { color:#854F0B }
.tab-btn { padding:8px 14px;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;font-size:12.5px;color:var(--color-text-secondary);white-space:nowrap }
.tab-btn.active { border-bottom-color:#534AB7;color:#534AB7;font-weight:500 }
.cp-review-card { padding:10px 12px;background:var(--color-background-secondary);border-radius:8px;border:0.5px solid var(--color-border-tertiary) }
.cp-review-label { font-size:11.5px;font-weight:500;color:var(--color-text-secondary);margin-bottom:3px }
.cp-review-target { font-size:10.5px;color:var(--color-text-tertiary);margin-bottom:4px }
.cp-sample-val { font-size:12.5px;padding:2px 0;display:flex;gap:4px;align-items:center }
.ok-val { color:#0F6E56;font-weight:500 }
.oor-val { color:#A32D2D;font-weight:600 }
.evidence-card { border:0.5px solid var(--color-border-tertiary);border-radius:8px;overflow:hidden;padding:6px }
.approval-hist-row { display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:8px;margin-bottom:8px;border:0.5px solid var(--color-border-tertiary) }
.approval-hist-row.approved { background:#E1F5EE } .approval-hist-row.rejected { background:#FCEBEB } .approval-hist-row.revised { background:#FAEEDA }
.ap-step-badge { background:#534AB7;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px }
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100 }
.modal { background:#fff;border-radius:12px;padding:24px;width:460px;max-width:92%;box-shadow:0 8px 32px rgba(0,0,0,.15) }
.modal-title { font-size:15px;font-weight:500 }
.modal-footer { display:flex;gap:8px;justify-content:flex-end;margin-top:16px }
.spinner-sm { width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block }
@keyframes spin { to { transform:rotate(360deg) } }
.loading-ph,.empty-ph { text-align:center;padding:48px;color:var(--color-text-tertiary);font-size:13px }
</style>