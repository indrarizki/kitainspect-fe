<template>
	<div>
		<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
			<button class="btn btn-secondary btn-sm" @click="$router.push('/employees')">← Kembali</button>
			<div>
				<h1 style="font-size:16px;font-weight:500">Buat Employee</h1>
				<p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Tambah data employee baru</p>
			</div>
		</div>

		<div style="display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start">
			<div class="card">
				<div class="section-title">Informasi Employee</div>

				<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
					<div class="field">
						<label>Employee ID *</label>
						<input v-model="form.code" type="text" placeholder="e.g. EMP-001" :class="{ 'field-error-input': errors.code }" />
						<span v-if="errors.code" class="field-error">{{ errors.code }}</span>
					</div>

					<div class="field">
						<label>Employee Status *</label>
						<select v-model="form.employeeStatus">
							<option value="A">A - Active</option>
							<option value="I">I - Inactive</option>
						</select>
					</div>

					<div class="field">
						<label>Full Name *</label>
						<input v-model="form.fullName" type="text" placeholder="Full name" :class="{ 'field-error-input': errors.fullName }" />
						<span v-if="errors.fullName" class="field-error">{{ errors.fullName }}</span>
					</div>

					<div class="field">
						<label>Email *</label>
						<input v-model="form.email" type="email" placeholder="email@example.com" :class="{ 'field-error-input': errors.email }" />
						<span v-if="errors.email" class="field-error">{{ errors.email }}</span>
					</div>

					<div class="field">
						<label>Phone</label>
						<input v-model="form.phone" type="text" placeholder="0812xxxx" />
					</div>

					<div class="field">
						<label>Join Date *</label>
						<input v-model="form.joinDate" type="date" :class="{ 'field-error-input': errors.joinDate }" />
						<span v-if="errors.joinDate" class="field-error">{{ errors.joinDate }}</span>
					</div>

					<div class="field">
						<label>Gender *</label>
						<select v-model="form.gender" :class="{ 'field-error-input': errors.gender }">
							<option value="M">M - Male</option>
							<option value="F">F - Female</option>
						</select>
						<span v-if="errors.gender" class="field-error">{{ errors.gender }}</span>
					</div>

					<div class="field">
						<label>Date of Birth *</label>
						<input v-model="form.dateOfBirth" type="date" :class="{ 'field-error-input': errors.dateOfBirth }" />
						<span v-if="errors.dateOfBirth" class="field-error">{{ errors.dateOfBirth }}</span>
					</div>

					<div class="field">
						<label>Identity Number *</label>
						<input v-model="form.identityNumber" type="text" :class="{ 'field-error-input': errors.identityNumber }" />
						<span v-if="errors.identityNumber" class="field-error">{{ errors.identityNumber }}</span>
					</div>

					<div class="field">
						<label>Identity Type *</label>
						<select v-model="form.identityType" :class="{ 'field-error-input': errors.identityType }">
							<option value="K">K - KTP</option>
							<option value="P">P - Passport</option>
						</select>
						<span v-if="errors.identityType" class="field-error">{{ errors.identityType }}</span>
					</div>

					<div class="field">
						<label>Marital Status *</label>
						<select v-model="form.maritalStatus" :class="{ 'field-error-input': errors.maritalStatus }">
							<option value="S">S - Single</option>
							<option value="M">M - Married</option>
						</select>
						<span v-if="errors.maritalStatus" class="field-error">{{ errors.maritalStatus }}</span>
					</div>

					<div class="field">
						<label>Leave Balance</label>
						<input v-model.number="form.leaveBalance" type="number" min="0" />
					</div>

					<div class="field">
						<label>Tax Group *</label>
						<input v-model="form.taxGroup" type="text" maxlength="3" :class="{ 'field-error-input': errors.taxGroup }" />
						<span v-if="errors.taxGroup" class="field-error">{{ errors.taxGroup }}</span>
					</div>

					<div class="field">
						<label>Resign Date</label>
						<input v-model="form.resignDate" type="date" />
					</div>

					<div class="field">
						<label>Overtime Benefit</label>
						<div style="display:flex;align-items:center;gap:8px">
							<input type="checkbox" v-model="form.haveOvertimeBenefit" /> <span style="font-size:13px">Eligible for overtime</span>
						</div>
					</div>

					<div class="field">
						<label>Risk Ratio *</label>
						<input v-model="form.riskRatio" type="text" maxlength="3" :class="{ 'field-error-input': errors.riskRatio }" />
						<span v-if="errors.riskRatio" class="field-error">{{ errors.riskRatio }}</span>
					</div>

					<div class="field">
						<label>Username *</label>
						<input v-model="form.username" type="text" :class="{ 'field-error-input': errors.username }" />
						<span v-if="errors.username" class="field-error">{{ errors.username }}</span>
					</div>

					<div class="field">
						<label>Password *</label>
						<input v-model="form.password" type="password" />
						<div style="font-size:12px;color:var(--color-text-tertiary);margin-top:6px">Password default: <strong>password123</strong></div>
					</div>

					<div class="field" style="grid-column:1/-1">
						<label>Upload Foto</label>
						<div style="display:flex;gap:10px;align-items:center">
							<div class="avatar-preview" v-if="previewUrl">
								<img :src="previewUrl" alt="preview" />
							</div>
							<input type="file" @change="onFileChange" accept="image/*" />
						</div>
						<span v-if="errors.photo" class="field-error">{{ errors.photo }}</span>
					</div>
				</div>

				<div style="margin-top:20px;padding-top:12px;border-top:0.5px solid var(--color-border-tertiary);display:flex;gap:10px;justify-content:flex-end">
					<button class="btn btn-secondary" @click="$router.push('/employees')">Batal</button>
					<button class="btn btn-primary" :disabled="loading" @click="submit">
						<span v-if="loading" class="spinner-sm"/>
						{{ loading ? 'Menyimpan...' : 'Simpan Employee' }}
					</button>
				</div>
			</div>

			<div class="card">
				<div style="font-size:13px;font-weight:500;margin-bottom:10px">Preview</div>
				<div class="preview-row"><span>Employee ID</span><span>{{ form.code || '—' }}</span></div>
				<div class="preview-row"><span>Full Name</span><span>{{ form.fullName || '—' }}</span></div>
				<div class="preview-row"><span>Email</span><span>{{ form.email || '—' }}</span></div>
				<div class="preview-row"><span>Phone</span><span>{{ form.phone || '—' }}</span></div>
				<div class="preview-row"><span>Employee Status</span><span>{{ form.employeeStatus }}</span></div>
				<div class="preview-row"><span>Join Date</span><span>{{ form.joinDate || '—' }}</span></div>
				<div class="preview-row"><span>Gender</span><span>{{ form.gender || '—' }}</span></div>
				<div class="preview-row"><span>Date of Birth</span><span>{{ form.dateOfBirth || '—' }}</span></div>
				<div class="preview-row"><span>Identity</span><span>{{ form.identityNumber || '—' }}</span></div>
				<div class="preview-row"><span>Tax Group</span><span>{{ form.taxGroup || '—' }}</span></div>
				<div class="preview-row"><span>Username</span><span>{{ form.username || '—' }}</span></div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { employeeService } from '@/services'
import http from '@/services/http'
import { useToast } from '@/composables'

const router = useRouter()
const { success, error: toastError } = useToast()

const loading = ref(false)
const errors = ref({})
const form = ref({
	code: '',
	fullName: '',
	email: '',
	phone: '',
	employeeStatus: 'A',
	joinDate: '',
	gender: 'M',
	dateOfBirth: '',
	identityNumber: '',
	identityType: 'K',
	maritalStatus: 'S',
	leaveBalance: null,
	taxGroup: '',
	resignDate: '',
	haveOvertimeBenefit: false,
	riskRatio: '',
	username: '',
	password: 'password123',
})

const selectedFile = ref(null)
const previewUrl = ref(null)

function onFileChange(e) {
	const f = e.target.files && e.target.files[0]
	if (!f) {
		selectedFile.value = null
		clearPreview()
		return
	}
	selectedFile.value = f
	if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
	previewUrl.value = URL.createObjectURL(f)
}

function clearPreview() {
	if (previewUrl.value) {
		URL.revokeObjectURL(previewUrl.value)
		previewUrl.value = null
	}
}

onBeforeUnmount(() => clearPreview())

function validate() {
	const e = {}
	if (!form.value.code || !form.value.code.trim()) e.code = 'Employee ID wajib diisi.'
	if (!form.value.fullName || !form.value.fullName.trim()) e.fullName = 'Full name wajib diisi.'
	if (!form.value.joinDate) e.joinDate = 'Join date wajib diisi.'
	if (!form.value.employeeStatus) e.employeeStatus = 'Employee status wajib dipilih.'
	if (!form.value.gender) e.gender = 'Gender wajib dipilih.'
	if (!form.value.dateOfBirth) e.dateOfBirth = 'Date of birth wajib diisi.'
	if (!form.value.identityNumber) e.identityNumber = 'Identity number wajib diisi.'
	if (!form.value.identityType) e.identityType = 'Identity type wajib dipilih.'
	if (!form.value.maritalStatus) e.maritalStatus = 'Marital status wajib dipilih.'
	if (!form.value.taxGroup) e.taxGroup = 'Tax group wajib diisi.'
	if (!form.value.riskRatio) e.riskRatio = 'Risk ratio wajib diisi.'
	if (!form.value.email) e.email = 'Email wajib diisi.'
	if (!form.value.username) e.username = 'Username wajib diisi.'
	if (!form.value.password || form.value.password.length < 6) e.password = 'Password minimal 6 karakter.'
	errors.value = e
	return Object.keys(e).length === 0
}

async function submit() {
	if (!validate()) return
	loading.value = true
	try {

		// helper to convert File -> base64 string
		function fileToBase64(file) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader()
				reader.onload = () => resolve(reader.result)
				reader.onerror = reject
				reader.readAsDataURL(file)
			})
		}

		// resize / compress image using canvas -> returns dataURL
		function resizeImageFileToDataURL(file, maxWidth = 800, quality = 0.7) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader()
				reader.onload = () => {
					const img = new Image()
					img.onload = () => {
						const ratio = img.width / img.height
						const width = Math.min(img.width, maxWidth)
						const height = Math.round(width / ratio)
						const canvas = document.createElement('canvas')
						canvas.width = width
						canvas.height = height
						const ctx = canvas.getContext('2d')
						ctx.drawImage(img, 0, 0, width, height)
						// use JPEG to maximize compression
						const dataUrl = canvas.toDataURL('image/jpeg', quality)
						resolve(dataUrl)
					}
					img.onerror = reject
					img.src = reader.result
				}
				reader.onerror = reject
				reader.readAsDataURL(file)
			})
		}

		if (selectedFile.value) {
			// resize/compress first
			const dataUrl = await resizeImageFileToDataURL(selectedFile.value, 800, 0.7)
			// strip prefix and compute byte length
			const parts = dataUrl.split(',')
			const b64 = parts[1] || parts[0]
			// compute byte length from base64
			let byteLength = 0
			try {
				const binary = atob(b64)
				byteLength = binary.length
			} catch (err) {
				// fallback estimate
				byteLength = Math.round((b64.length * 3) / 4)
			}

			// if still very large, abort and ask to pick smaller image
			const MAX_BYTES = 65535 // conservative default (fits in VARCHAR(65535) approx)
			if (byteLength > MAX_BYTES) {
				toastError('Gambar masih terlalu besar setelah kompresi (' + Math.round(byteLength/1024) + ' KB). Gunakan gambar lebih kecil atau hubungi admin untuk perubahan penyimpanan.')
				loading.value = false
				return
			}

			const payload = { ...form.value }
			payload.haveOvertimeBenefit = !!payload.haveOvertimeBenefit
			payload.profile_image = b64 // base64 without data URI prefix
			payload.profileSize = byteLength
			await employeeService.create(payload)
		} else {
			const payload = { ...form.value }
			payload.haveOvertimeBenefit = !!payload.haveOvertimeBenefit
			await employeeService.create(payload)
		}
		success('Employee berhasil dibuat')
		router.push('/employees')
	} catch (e) {
		const msg = e.response?.data?.message || 'Gagal menyimpan employee.'
		toastError(msg)
	} finally { loading.value = false }
}
</script>

<style scoped>
.section-title { font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-secondary);margin-bottom:12px;padding-bottom:6px;border-bottom:1.5px solid var(--color-border-tertiary) }
.field { display:flex;flex-direction:column }
.field label { font-size:13px;font-weight:500;margin-bottom:6px }
.field input[type=text], .field input[type=email], .field select, .field textarea { padding:8px;border:1px solid var(--color-border-tertiary);border-radius:8px;outline:none }
.card { background:#fff;padding:16px;border-radius:10px;border:1px solid var(--color-border-tertiary) }
.preview-row { display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:0.5px solid var(--color-border-tertiary) }
.preview-row span:first-child { color:var(--color-text-tertiary) }
.preview-row span:last-child { color:var(--color-text-primary);font-weight:500 }
.avatar-preview { width:56px;height:56px;border-radius:8px;overflow:hidden;flex-shrink:0 }
.avatar-preview img { width:100%;height:100%;object-fit:cover }
.field-error { font-size:11.5px;color:#A32D2D;margin-top:6px }
.field-error-input { border-color:#E24B4A !important }
.spinner-sm { width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block }
@keyframes spin { to { transform:rotate(360deg) } }
</style>