<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div style="display:flex;align-items:center;gap:12px">
        <button class="btn btn-secondary btn-sm" @click="$router.push('/employees')">← Kembali</button>
        <div>
          <h1 style="font-size:16px;font-weight:500">Detail Employee</h1>
          <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Informasi lengkap employee</p>
        </div>
      </div>
      <div>
        <button class="btn btn-primary" @click="$router.push(`/employees/${id}/edit`)">Edit</button>
      </div>
    </div>

    <div class="card" v-if="loading">Memuat...</div>

    <div style="display:grid;grid-template-columns:320px 1fr;gap:16px" v-else>
      <div class="card">
        <div style="display:flex;gap:12px;align-items:center">
          <div class="avatar-large">
            <img :src="profileSrc" alt="avatar" v-if="employee" />
            <div v-else class="avatar-placeholder">—</div>
          </div>
          <div>
            <div style="font-size:15px;font-weight:600">{{ employee?.fullName || '—' }}</div>
            <div style="font-size:13px;color:var(--color-text-tertiary);margin-top:6px">{{ employee?.code || '—' }}</div>
          </div>
        </div>

        <div style="margin-top:14px">
          <div class="detail-row"><span>Username</span><span>{{ employee?.username || '—' }}</span></div>
          <div class="detail-row"><span>Email</span><span>{{ employee?.email || '—' }}</span></div>
          <div class="detail-row"><span>Phone</span><span>{{ employee?.phone || '—' }}</span></div>
          <div class="detail-row"><span>Employee Status</span><span>{{ employee?.employeeStatus || '—' }}</span></div>
          <div class="detail-row"><span>Join Date</span><span>{{ formatDate(employee?.joinDate) }}</span></div>
        </div>
      </div>

      <div class="card">
        <div style="font-size:14px;font-weight:600;margin-bottom:10px">Informasi Lengkap</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="field">
            <label>Full Name</label>
            <div class="field-val">{{ employee?.fullName || '—' }}</div>
          </div>
          <div class="field">
            <label>Code</label>
            <div class="field-val">{{ employee?.code || '—' }}</div>
          </div>
          <div class="field">
            <label>Gender</label>
            <div class="field-val">{{ employee?.gender || '—' }}</div>
          </div>
          <div class="field">
            <label>Date of Birth</label>
            <div class="field-val">{{ formatDate(employee?.dateOfBirth) }}</div>
          </div>
          <div class="field">
            <label>Identity</label>
            <div class="field-val">{{ employee?.identityType }} · {{ employee?.identityNumber }}</div>
          </div>
          <div class="field">
            <label>Marital Status</label>
            <div class="field-val">{{ employee?.maritalStatus || '—' }}</div>
          </div>
          <div class="field">
            <label>Leave Balance</label>
            <div class="field-val">{{ typeof employee?.leaveBalance === 'number' ? employee.leaveBalance : '—' }}</div>
          </div>
          <div class="field">
            <label>Tax Group</label>
            <div class="field-val">{{ employee?.taxGroup || '—' }}</div>
          </div>
          <div class="field">
            <label>Resign Date</label>
            <div class="field-val">{{ formatDate(employee?.resignDate) }}</div>
          </div>
          <div class="field">
            <label>Overtime Benefit</label>
            <div class="field-val">{{ employee?.haveOvertimeBenefit ? 'Yes' : 'No' }}</div>
          </div>
          <div class="field">
            <label>Risk Ratio</label>
            <div class="field-val">{{ employee?.riskRatio || '—' }}</div>
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Roles</label>
            <div class="field-val">{{ (employee?.roles || []).join(', ') || '—' }}</div>
          </div>

          <!-- Additional relational IDs shown plainly -->
          <div class="field">
            <label>Contract</label>
            <div class="field-val">{{ employee?.contract_id || '—' }}</div>
          </div>
          <div class="field">
            <label>Department</label>
            <div class="field-val">{{ employee?.department_id || '—' }}</div>
          </div>
          <div class="field">
            <label>Job Level</label>
            <div class="field-val">{{ employee?.joblevel_id || '—' }}</div>
          </div>
          <div class="field">
            <label>Job Title</label>
            <div class="field-val">{{ employee?.jobtitle_id || '—' }}</div>
          </div>
          <div class="field">
            <label>Supervisor</label>
            <div class="field-val">{{ employee?.supervisor_id || '—' }}</div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { employeeService } from '@/services'
import { useToast } from '@/composables'

const route = useRoute()
const router = useRouter()
const { error: toastError } = useToast()

const id = route.params.id
const employee = ref(null)
const loading = ref(true)

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString() } catch { return d }
}

const profileSrc = computed(() => {
  if (!employee.value) return ''
  const v = employee.value.profile_image || employee.value.profileImage || employee.value.profileUrl || ''
  if (!v) return ''
  if (v.startsWith('http') || v.startsWith('/')) return v
  if (v.startsWith('data:')) return v
  return 'data:image/jpeg;base64,' + v
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await employeeService.get(id)
    employee.value = res.data?.employee ?? res.data ?? res
  } catch (e) {
    toastError(e.response?.data?.message ?? 'Gagal memuat data employee.')
    router.push('/employees')
  } finally { loading.value = false }
})
</script>

<style scoped>
.avatar-large { width:84px;height:84px;border-radius:10px;overflow:hidden;background:var(--color-background-secondary);display:flex;align-items:center;justify-content:center }
.avatar-large img { width:100%;height:100%;object-fit:cover }
.avatar-placeholder { color:var(--color-text-tertiary) }
.detail-row { display:flex;justify-content:space-between;padding:8px 0;border-bottom:0.5px solid var(--color-border-tertiary);font-size:13px }
.detail-row span:first-child { color:var(--color-text-tertiary) }
.field label { font-size:12px;color:var(--color-text-secondary);margin-bottom:6px }
.field-val { font-size:13px;font-weight:500;color:var(--color-text-primary) }
</style>
