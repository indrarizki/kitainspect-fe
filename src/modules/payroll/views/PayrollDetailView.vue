<template>
	<div>
		<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
			<div>
				<h1 style="font-size:16px;font-weight:500">Slip Gaji</h1>
				<p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Detail payroll untuk karyawan</p>
			</div>
			<div>
				<button class="btn" @click="$router.back()">Kembali</button>
			</div>
		</div>

		<div class="card" v-if="loading">
			<div class="loading-ph">Memuat...</div>
		</div>

		<div v-else>
			<div class="card" style="margin-bottom:14px">
				<div style="display:flex;justify-content:space-between;align-items:center">
					<div>
						<div style="font-size:14px;font-weight:600">{{ payroll.employee?.fullName }}</div>
						<div style="font-size:13px;color:var(--color-text-secondary)">{{ payroll.employee?.code }}</div>
						<div style="font-size:12px;color:var(--color-text-secondary);margin-top:6px">
							<span style="margin-right:10px">Bulan: {{ monthName }}</span>
							<span style="margin-right:10px">Tahun: {{ yearValue }}</span>
							<span>Total Kerja: {{ totalWorkLabel }}</span>
						</div>
					</div>
					<div style="text-align:right">
						<div style="font-size:12px;color:var(--color-text-secondary)">Payroll ID</div>
						<div style="font-weight:600">{{ payroll.id || '-' }}</div>
					</div>
				</div>
			</div>

			<div class="slip-grid">
				<div class="slip-section">
					<div class="section-title">PENDAPATAN</div>
					<div class="section-body">
						<div v-for="(it,i) in earnings" :key="i" class="row">
							<div class="label">{{ it.label }}</div>
							<div class="value">{{ formatCurrency(it.amount) }}</div>
						</div>
					</div>
					<div class="section-total">Upah Kotor <span>{{ formatCurrency(sum(earnings)) }}</span></div>
				</div>

				<div class="slip-section">
					<div class="section-title">POTONGAN</div>
					<div class="section-body">
						<div v-for="(it,i) in deductions" :key="i" class="row">
							<div class="label">{{ it.label }}</div>
							<div class="value">{{ formatCurrency(it.amount) }}</div>
						</div>
						<div v-if="!deductions.length" class="muted">-</div>
					</div>
					<div class="section-total">Total Potongan <span>{{ formatCurrency(sum(deductions)) }}</span></div>
				</div>

				<div class="slip-section">
					<div class="section-title">PENYESUAIAN</div>
					<div class="section-body">
						<div v-for="(it,i) in adjustments" :key="i" class="row">
							<div class="label">{{ it.label }}</div>
							<div class="value">{{ formatCurrency(it.amount) }}</div>
						</div>
						<div v-if="!adjustments.length" class="muted">-</div>
					</div>
					<div class="section-total">Total Penyesuaian <span>{{ formatCurrency(sum(adjustments)) }}</span></div>
				</div>
			</div>

			<div class="card" style="margin-top:14px">
				<div style="display:flex;justify-content:space-between;align-items:center">
					<div style="font-weight:600">TAKE HOME PAY</div>
					<div style="font-weight:700;font-size:18px">{{ formatCurrency(takeHome) }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { payrollService } from '@/services'

const route = useRoute()
const id = route.params.id

const loading = ref(false)
const payroll = ref({})
const attendance_summary = ref({})

function formatCurrency(v) {
	if (v == null) return '-'
	return (Number(v) || 0).toLocaleString('id-ID')
}

function sum(arr) { return (arr || []).reduce((s, a) => s + (Number(a.amount) || 0), 0) }

const earnings = ref([])
const deductions = ref([])
const adjustments = ref([])

const takeHome = computed(() => {
	const explicit = payroll.value.takeHomePay ?? payroll.value.take_home ?? payroll.value.net_pay
	if (explicit != null) return Number(explicit)
	return sum(earnings.value) - sum(deductions.value) + sum(adjustments.value)
})

const employeeLabel = computed(() => {
	const p = payroll.value
	return p.employee_name || p.name || p.fullName || (p.employee && (p.employee.name || p.employee.full_name)) || '-'
})

const periodLabel = computed(() => {
	const p = payroll.value
	if (p.month && p.year) {
		const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des']
		return `${months[Number(p.month)-1] ?? p.month} ${p.year}`
	}
	return p.period_label || p.period || '-'
})

const monthName = computed(() => {
	// prefer nested payroll.period, then top-level period fields
	const root = payroll.value || {}
	const source = root.payroll ?? root
	const period = source.period ?? root.period
	const m = period?.month ?? source.month ?? root.month ?? null
	if (m == null) return '-'
	const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
	const idx = Number(m) - 1
	if (!Number.isNaN(idx) && months[idx]) return months[idx]
	return String(m)
})

const yearValue = computed(() => {
	const root = payroll.value || {}
	const source = root.payroll ?? root
	const period = source.period ?? root.period
	return period?.year ?? source.year ?? root.year ?? '-' 
})

const totalWorkLabel = computed(() => {
	const root = payroll.value || {}
	// attendance_summary may be stored in the dedicated ref, top-level, or nested under payroll
	const att = attendance_summary.value ?? root.attendance_summary ?? root.payroll?.attendance_summary ?? root.attendanceSummary

	const total = att?.totalWorkday ?? att?.total_workday ?? att?.total_work ?? att?.totalWork ?? root.totalWorkday ?? root.total_work
	if (total != null && total !== '') return String(total)
	return '-'
})

function normalizeDetail(data) {
	const earn = []
	const deduct = []
	const adjust = []

	if (!data) return { earn, deduct, adjust }

	const tryArrays = [data.earnings, data.pendapatan, data.income, data.incomes, data.items]
	tryArrays.forEach(a => {
		if (Array.isArray(a)) a.forEach(it => {
			const label = it.label || it.name || it.title || it.description || it.keterangan || it.key || it.code || 'Item'
			const amount = it.amount ?? it.value ?? it.nominal ?? it.total ?? it.takeHomePay ?? 0
			if (Number(amount) < 0) deduct.push({ label, amount: Math.abs(Number(amount)) })
			else earn.push({ label, amount: Number(amount) })
		})
	})

	const tryDed = [data.deductions, data.potongan, data.potongs]
	tryDed.forEach(a => {
		if (Array.isArray(a)) a.forEach(it => {
			const label = it.label || it.name || it.title || it.keterangan || 'Potongan'
			const amount = it.amount ?? it.value ?? it.nominal ?? it.total ?? 0
			deduct.push({ label, amount: Number(amount) })
		})
	})

	const tryAdj = [data.adjustments, data.penyesuaian, data.adjusts]
	tryAdj.forEach(a => {
		if (Array.isArray(a)) a.forEach(it => {
			const label = it.label || it.name || it.keterangan || 'Penyesuaian'
			const amount = it.amount ?? it.value ?? it.nominal ?? it.total ?? 0
			adjust.push({ label, amount: Number(amount) })
		})
	})

	if (data.gross && !earn.length) earn.push({ label: 'Upah Kotor', amount: Number(data.gross) })
	if (data.koreksi && !adjust.length) adjust.push({ label: 'Koreksi', amount: Number(data.koreksi) })

	return { earn, deduct, adjust }
}

async function load() {
	loading.value = true
	try {
		const res = await payrollService.payrollDetails(id)
		
		let resData = res.data?.data ?? res.data ?? res
		if (Array.isArray(resData)) {
			const arr = resData
			const base = arr.find(it => it.payroll && typeof it.payroll === 'object')?.payroll ?? {}
			payroll.value = base
			attendance_summary.value = arr.find(it => it.attendance_summary && typeof it.attendance_summary === 'object')?.attendance_summary ?? {}

			const earn = []
			const ded = []
			const adj = []

			arr.forEach(it => {
				const sc = it.salary_component || {}
				const state = (sc.state || '').toString().toUpperCase()
				const label = sc.name || sc.code || it.benefitKey || it.benefit_key || 'Item'
				const amount = Number(it.benefitValue ?? it.benefit_value ?? it.value ?? it.nominal ?? 0) || 0
				if (state === 'E') earn.push({ label, amount })
				else if (state === 'D') ded.push({ label, amount })
				else if (state === 'A') adj.push({ label, amount })
				else {
					if (amount < 0) ded.push({ label, amount: Math.abs(amount) })
					else earn.push({ label, amount })
				}
			})

			earnings.value = earn
			deductions.value = ded
			adjustments.value = adj
		} else {
			// If API returns an object with payroll + details (or details at root), prefer those
			if (resData.payroll) payroll.value = resData.payroll
			else payroll.value = resData

				// populate attendance_summary ref when present in object responses
				attendance_summary.value = resData.attendance_summary ?? resData.attendanceSummary ?? resData.payroll?.attendance_summary ?? resData.payroll?.attendanceSummary ?? {}

			if (Array.isArray(resData.details) && resData.details.length) {
				const earn = []
				const ded = []
				const adj = []

				resData.details.forEach(it => {
					const sc = it.salary_component || {}
					const state = (sc.state || '').toString().toUpperCase()
					const label = sc.name || sc.code || it.benefitKey || it.benefit_key || it.key || 'Item'
					const amount = Number(it.benefitValue ?? it.benefit_value ?? it.value ?? it.nominal ?? 0) || 0
					if (state === 'E') earn.push({ label, amount })
					else if (state === 'D') ded.push({ label, amount })
					else if (state === 'A') adj.push({ label, amount })
					else {
						if (amount < 0) ded.push({ label, amount: Math.abs(amount) })
						else earn.push({ label, amount })
					}
				})

				earnings.value = earn
				deductions.value = ded
				adjustments.value = adj
			} else {
				const n = normalizeDetail(payroll.value)
				earnings.value = n.earn
				deductions.value = n.deduct
				adjustments.value = n.adjust
			}
		}

	} catch (e) {
		console.error('Failed to load payroll detail', e)
		payroll.value = {}
		earnings.value = []
		deductions.value = []
		adjustments.value = []
	} finally {
		loading.value = false
	}
}

onMounted(() => load())
</script>

<style scoped>
.slip-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px }
.slip-section { border:1px solid var(--color-border-tertiary);border-radius:8px;padding:12px;background:#fff }
.section-title { font-weight:700;margin-bottom:8px }
.section-body { max-height:260px;overflow:auto }
.row { display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed rgba(0,0,0,0.04) }
.label { color:var(--color-text-secondary) }
.value { font-weight:600 }
.section-total { display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid rgba(0,0,0,0.06);margin-top:8px;font-weight:700 }
.muted { color:var(--color-text-tertiary) }
.card { background:#fff;border:1px solid var(--color-border-tertiary);border-radius:8px;padding:12px }
.loading-ph { text-align:center;padding:24px;color:var(--color-text-tertiary) }
</style>
