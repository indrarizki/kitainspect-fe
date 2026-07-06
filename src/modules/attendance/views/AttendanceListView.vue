<template>
	<div>
		<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
			<div>
				<h1 style="font-size:16px;font-weight:500">Manajemen Attendance</h1>
				<p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Kelola data kehadiran</p>
			</div>
			<div>
				<button v-if="can('attendance.create')" class="btn btn-primary" @click="openAddModal">+ Tambah Attendance</button>
			</div>
		</div>

		<div class="table-wrap">
			<div v-if="loading" class="loading-ph">Memuat...</div>
			<div v-else-if="!items.length" class="empty-ph">Tidak ada attendance ditemukan.</div>
			<table v-else>
				<thead>
					<tr>
						<th>Tanggal</th>
						<th>Employee</th>
						<th>Check In</th>
						<th>Check Out</th>
						<th>Status</th>
						<th>Aksi</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="r in items" :key="r.id">
						<td>{{ formatDate(r.date) }}</td>
						<td style="font-weight:500">{{ r.employeeName || r.employee?.fullName || '-' }}</td>
						<td>{{ r.checkIn || '-' }}</td>
						<td>{{ r.checkOut || '-' }}</td>
						<td>
							<span class="badge" :class="{ 'badge-success': r.status === 'present', 'badge-danger': r.status === 'absent' }">{{ r.status || '-' }}</span>
						</td>
						<td>
							<div style="display:flex;gap:5px">
								<button class="btn btn-secondary btn-sm" @click="$router.push(`/attendances/${r.id}`)">Detail</button>
								<button v-if="can('attendance.update')" class="btn btn-secondary btn-sm" @click="$router.push(`/attendances/${r.id}/edit`)">Edit</button>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div style="display:flex;gap:5px;margin-top:14px;justify-content:flex-end" v-if="meta.last_page > 1">
			<button v-for="p in meta.last_page" :key="p" class="pg-btn" :class="{active:p===meta.current_page}" @click="fetchPage(p)">{{ p }}</button>
		</div>
    
		<div v-if="showAddModal" class="modal-overlay">
			<div class="modal">
				<div class="modal-title">Tambah Attendance</div>
				<div style="margin-top:12px">
					<label>Employee</label>
					<input type="text" :value="selectedEmployee ? (selectedEmployee.fullName || selectedEmployee.full_name || selectedEmployee.name) : empSearch" @input="onEmpInput" placeholder="Cari employee..." style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px" />
					<div v-if="empDropdown && employees.length" class="emp-dropdown">
						<div v-for="e in employees" :key="e.id" class="emp-item" @click="selectEmployee(e)">
							<div style="font-weight:500">{{ e.fullName || e.full_name || e.name }}</div>
							<div style="font-size:12px;color:var(--color-text-tertiary)">{{ e.code || e.employeeId || '' }}</div>
						</div>
					</div>

					<label style="margin-top:10px;display:block">Tanggal</label>
					<input v-model="form.date" type="date" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px" />

					<label style="margin-top:10px;display:block">Check In</label>
					<input v-model="form.checkIn" type="time" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px" />

					<label style="margin-top:10px;display:block">Check Out</label>
					<input v-model="form.checkOut" type="time" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px" />

					<label style="margin-top:10px;display:block">Status</label>
					<select v-model="form.status" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px">
						<option value="present">Present</option>
						<option value="absent">Absent</option>
					</select>

					<label style="margin-top:10px;display:block">Notes</label>
					<textarea v-model="form.notes" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px"></textarea>
				</div>
				<div class="modal-footer">
					<button class="btn" @click="closeAddModal">Batal</button>
					<button class="btn btn-primary" :disabled="savingAdd" @click="submitAdd">
						<span v-if="savingAdd" class="spinner-sm"></span>
						<span v-if="!savingAdd">Simpan</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { attendanceService, employeeService } from '@/services'
import { usePermission, useToast } from '@/composables'

const { can } = usePermission()
const toast = useToast()

const items = ref([])
const loading = ref(false)
const meta = ref({ current_page: 1, last_page: 1 })

// Add modal state
const showAddModal = ref(false)
const savingAdd = ref(false)
const employees = ref([])
const empSearch = ref('')
const empDropdown = ref(false)
const selectedEmployee = ref(null)

const form = ref({ employeeId: '', date: '', checkIn: '', checkOut: '', status: 'present', notes: '' })

let empDebounce = null

const fetchEmployees = async (q = '') => {
	try {
		const params = { q, per_page: 20 }
		const res = await employeeService.list(params)
		const r = res.data
		if (Array.isArray(r)) employees.value = r
		else if (r.data) employees.value = r.data
		else employees.value = []
	} catch (e) {
		console.error('Gagal memuat employees', e)
		employees.value = []
	}
}

function onEmpInput(e) {
	empSearch.value = e.target.value
	empDropdown.value = true
	clearTimeout(empDebounce)
	empDebounce = setTimeout(() => fetchEmployees(empSearch.value), 300)
}

function selectEmployee(emp) {
	selectedEmployee.value = emp
	form.value.employeeId = emp.id
	empDropdown.value = false
}

function openAddModal() {
	showAddModal.value = true
	selectedEmployee.value = null
	form.value = { employeeId: '', date: '', checkIn: '', checkOut: '', status: 'present', notes: '' }
	fetchEmployees('')
}

function closeAddModal() { showAddModal.value = false }

const fetchPage = async (page = 1) => {
	loading.value = true
	try {
		const params = { page, per_page: 15 }
		const res = await attendanceService.list(params)
		const result = res.data
		if (Array.isArray(result)) {
			items.value = result
			meta.value = { current_page: 1, last_page: 1 }
		} else if (result.data) {
			items.value = result.data
			meta.value = result.meta || { current_page: 1, last_page: 1 }
		}
	} catch (e) {
		console.error('Gagal memuat attendance', e)
	} finally {
		loading.value = false
	}
}

async function submitAdd() {
	if (!form.value.employeeId) return alert('Pilih employee')
	savingAdd.value = true
	try {
		const payload = { employeeId: form.value.employeeId, date: form.value.date, checkIn: form.value.checkIn, checkOut: form.value.checkOut, status: form.value.status, notes: form.value.notes }
		await attendanceService.create(payload)
		toast.success('Attendance berhasil ditambahkan')
		closeAddModal()
		fetchPage()
	} catch (e) {
		console.error('Gagal menambah attendance', e)
		toast.error('Gagal menambahkan attendance')
	} finally {
		savingAdd.value = false
	}
}

function formatDate(d) {
	if (!d) return '-'
	try {
		const dt = new Date(d)
		return dt.toLocaleDateString()
	} catch (e) {
		return d
	}
}

onMounted(() => fetchPage())
</script>

<style scoped>
.loading-ph,.empty-ph { text-align:center;padding:40px;color:var(--color-text-tertiary);font-size:13px }
.pg-btn { width:30px;height:30px;border:1px solid var(--color-border-tertiary);border-radius:6px;background:#fff;font-size:13px;cursor:pointer }
.pg-btn.active { background:#534AB7;color:#fff;border-color:#534AB7 }
.badge { padding:6px 8px;border-radius:6px;font-size:12px }
.badge-success { background:#dff4e6;color:#1a7a3a }
.badge-danger { background:#fdecea;color:#a11 }
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100 }
.modal { background:#fff;border-radius:12px;padding:20px;width:520px;max-width:96%;box-shadow:0 8px 32px rgba(0,0,0,.15) }
.modal-title { font-size:15px;font-weight:500 }
.modal-footer { display:flex;gap:8px;justify-content:flex-end;margin-top:16px }
.spinner-sm { width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block }
@keyframes spin { to { transform:rotate(360deg) } }
.emp-dropdown { max-height:220px;overflow:auto;border:1px solid var(--color-border-tertiary);border-radius:8px;background:#fff;margin-top:6px }
.emp-item { padding:8px;border-bottom:1px solid #f4f4f4;cursor:pointer }
.emp-item:hover { background:#f6f7ff }
</style>
