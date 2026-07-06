<template>
  <div class="holiday-page">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Holiday Calendar</h1>
        <p>Manage company holidays and national leave schedules</p>
      </div>

      <button class="btn-primary" @click="showModal = true">
        + Add Holiday
      </button>
    </div>

    <!-- Summary -->
    <div class="summary-row">
      <div class="summary-card">
        <div class="summary-number">
          {{ holidays.length }}
        </div>
        <div class="summary-label">
          Total Holidays
        </div>
      </div>
    </div>

    <!-- Calendar Card -->
    <div class="calendar-card">

      <div class="calendar-toolbar">

        <div class="toolbar-left">
          <button class="nav-btn" @click="prevMonth">‹</button>

          <div class="month-title">
            {{ monthLabel }}
          </div>

          <button class="nav-btn" @click="nextMonth">›</button>

          <button class="today-btn" @click="goToday">
            Today
          </button>
        </div>

        <div class="toolbar-right">
          <span class="holiday-count">
            {{ holidays.length }} Holidays
          </span>
        </div>

      </div>

      <div class="calendar-grid">

        <div
          class="weekday"
          v-for="d in weekDays"
          :key="d"
        >
          {{ d }}
        </div>

        <div
          v-for="cell in monthCells"
          :key="cell.key"
          class="day"
          :class="{
            holiday: isHoliday(cell.date),
            today: isToday(cell.date),
            other: !cell.inMonth,
            weekend: isWeekend(cell.date)
          }"
          @click="selectDate(cell.date)"
        >

          <div class="date-number">
            {{ cell.day }}
          </div>

          <div
            v-if="isHoliday(cell.date)"
            class="holiday-badge"
          >
            {{ holidaysMap[fmt(cell.date)] }}
          </div>

        </div>

      </div>
    </div>

    <!-- Holiday List -->
    <div class="holiday-card">

      <div class="holiday-card-header">
        Holiday List
      </div>

      <div class="holiday-list">

        <div
          class="holiday-item"
          v-for="h in holidaysSorted"
          :key="h.date"
        >
          <div>
            <div class="holiday-date">
              {{ h.date }}
            </div>

            <div class="holiday-name">
              {{ h.title }}
            </div>
          </div>

          <button
            class="delete-btn"
            @click="removeHoliday(h.date)"
          >
            Remove
          </button>

        </div>

      </div>

    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="modal-overlay"
    >
      <div class="modal">

        <div class="modal-title">
          Add Holiday
        </div>

        <div class="form-group">
          <label>Date</label>

          <input
            type="date"
            v-model="form.date"
          />
        </div>

        <div class="form-group">
          <label>Holiday Name</label>

          <input
            type="text"
            v-model="form.title"
            placeholder="Holiday name"
          />
        </div>

        <div class="modal-actions">

          <button
            class="btn-secondary"
            @click="closeModal"
          >
            Cancel
          </button>

          <button
            class="btn-primary"
            @click="saveHoliday"
          >
            Save
          </button>

        </div>

      </div>
    </div>

  </div>
</template>
										<script>
										export default {
											name: 'HolidayCalenderView',
											data() {
												const today = new Date()

												return {
													year: today.getFullYear(),
													month: today.getMonth(),

													weekDays: [
														'Mon',
														'Tue',
														'Wed',
														'Thu',
														'Fri',
														'Sat',
														'Sun'
													],

													holidays: this.loadHolidays(),

													form: {
														date: '',
														title: ''
													},

													showModal: false
												}
											},
											computed: {
												
												monthLabel() {
													return new Date(this.year, this.month).toLocaleString(undefined, { month: 'long', year: 'numeric' })
												},
												monthCells() {
													const first = new Date(this.year, this.month, 1)
													const startDay = first.getDay()
													// number of days in month
													const daysInMonth = new Date(this.year, this.month + 1, 0).getDate()
													const prevMonthDays = new Date(this.year, this.month, 0).getDate()

													const cells = []
													// show full 6 weeks (42 cells)
													const total = 42
													for (let i = 0; i < total; i++) {
														const dayIndex = i - startDay + 1
														let inMonth = true
														let day, dateObj
														if (dayIndex <= 0) {
															// previous month
															inMonth = false
															day = prevMonthDays + dayIndex
															dateObj = new Date(this.year, this.month - 1, day)
														} else if (dayIndex > daysInMonth) {
															inMonth = false
															day = dayIndex - daysInMonth
															dateObj = new Date(this.year, this.month + 1, day)
														} else {
															day = dayIndex
															dateObj = new Date(this.year, this.month, day)
														}
														cells.push({ key: `${dateObj.toISOString()}`, date: dateObj, day, inMonth })
													}
													return cells
												},
												holidaysMap() {
													const m = {}
													for (const h of this.holidays) m[h.date] = h.title
													return m
												},
												holidaysSorted() {
													return this.holidays.slice().sort((a, b) => (a.date > b.date ? 1 : -1))
												},
											},
											
											methods: {
												fmt(d) {
													if (!d) return ''
													const dt = new Date(d)
													const y = dt.getFullYear()
													const m = String(dt.getMonth() + 1).padStart(2, '0')
													const dd = String(dt.getDate()).padStart(2, '0')
													return `${y}-${m}-${dd}`
												},
												isHoliday(date) {
													return !!this.holidaysMap[this.fmt(date)]
												},
												selectDate(date) {
														const key = this.fmt(date)

														if (this.holidaysMap[key]) {
															alert(`Holiday: ${this.holidaysMap[key]} (${key})`)
														} else {
															this.form.date = key
															this.showModal = true
														}
													},
												isToday(date) {
  return this.fmt(date) === this.fmt(new Date())
},

isWeekend(date) {
  const d = new Date(date).getDay()
  return d === 0 || d === 6
},

closeModal() {
  this.showModal = false
  this.clearForm()
},

saveHoliday() {
    const date = this.form.date
    const title = this.form.title.trim()

    if (!date || !title) {
        alert('Date dan Title wajib diisi')
        return
    }

    if (this.holidays.some(h => h.date === date)) {
        alert('Holiday already set')
        return
    }

    this.holidays.push({ date, title })
    this.saveHolidays()

    this.showModal = false
    this.clearForm()
},
												prevMonth() {
													if (this.month === 0) {
														this.month = 11
														this.year--
													} else this.month--
												},
												nextMonth() {
													if (this.month === 11) {
														this.month = 0
														this.year++
													} else this.month++
												},
												goToday() {
													const today = new Date()
													this.year = today.getFullYear()
													this.month = today.getMonth()
												},
												loadHolidays() {
													try {
														const raw = localStorage.getItem('holidays')
														return raw ? JSON.parse(raw) : []
													} catch (e) {
														return []
													}
												},
												saveHolidays() {
													localStorage.setItem('holidays', JSON.stringify(this.holidays))
												},
												addHoliday() {
													const date = this.form.date
													const title = this.form.title.trim()
													if (!date || !title) return
													// prevent duplicates
													if (this.holidays.some(h => h.date === date)) {
														alert('Holiday already set for this date')
														return
													}
													this.holidays.push({ date, title })
													this.saveHolidays()
													this.clearForm()
												},
												removeHoliday(date) {
													if (!confirm('Remove holiday?')) return
													this.holidays = this.holidays.filter(h => h.date !== date)
													this.saveHolidays()
												},
												clearForm() {
													this.form.date = ''
													this.form.title = ''
												},
											},
										}


</script>
<style scoped>

.holiday-page {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

/* Header */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
}

.page-header p {
  margin-top: 4px;
  color: #64748b;
}

/* Summary */

.summary-row {
  margin-bottom: 20px;
}

.summary-card {
  width: 220px;
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow:
    0 1px 3px rgba(0,0,0,.06),
    0 10px 25px rgba(0,0,0,.04);
}

.summary-number {
  font-size: 32px;
  font-weight: 700;
}

.summary-label {
  color: #64748b;
  margin-top: 6px;
}

/* Calendar */

.calendar-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow:
    0 1px 3px rgba(0,0,0,.06),
    0 10px 25px rgba(0,0,0,.04);
}

.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.month-title {
  font-size: 20px;
  font-weight: 600;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: #f1f5f9;
}

.today-btn {
  border: none;
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.holiday-count {
  color: #64748b;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.weekday {
  padding: 14px;
  text-align: center;
  font-weight: 600;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}

.day {
  min-height: 120px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 10px;
  cursor: pointer;
  transition: .2s;
}

.day:hover {
  background: #f8fafc;
}

.day.other {
  opacity: .4;
}

.day.today {
  background: #eff6ff;
  border: 2px solid #2563eb;
}

.day.weekend {
  background: #fafafa;
}

.date-number {
  font-weight: 700;
}

.holiday {
  background: #fff5f5;
}

.holiday-badge {
  margin-top: 8px;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
}

/* Holiday List */

.holiday-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow:
    0 1px 3px rgba(0,0,0,.06),
    0 10px 25px rgba(0,0,0,.04);
}

.holiday-card-header {
  font-weight: 600;
  margin-bottom: 16px;
}

.holiday-list {
  max-height: 350px;
  overflow-y: auto;
}

.holiday-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 10px;
}

.holiday-date {
  font-size: 12px;
  color: #64748b;
}

.holiday-name {
  font-weight: 500;
}

.delete-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

/* Modal */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: 420px;
  background: white;
  border-radius: 14px;
  padding: 24px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
}

.btn-secondary {
  background: #f1f5f9;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
}

</style>

