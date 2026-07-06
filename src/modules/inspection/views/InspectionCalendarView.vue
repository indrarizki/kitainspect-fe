<template>
  <div id="app" class="app-container">
    <div class="main-layout">
      <main class="calendar-area">
        <div class="week-header">
          <div class="week-nav">
            <button class="week-nav-btn" @click="prevWeek">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            
            <div class="week-text-group" @click="openWeekPicker" style="cursor: pointer; position: relative;">
              <div class="week-title">Week {{ weekNumber }}</div>
              <div class="week-label">{{ weekRange }}</div>
              
              <input 
                ref="weekInputRef" 
                type="week" 
                class="hidden-week-picker" 
                @change="onWeekSelected"
              />
            </div>
            
            <button class="week-nav-btn" @click="nextWeek">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="today-btn" @click="goToday">Today</button>
          </div>
          
          <div class="week-info">
            <div class="week-stat">
              <span class="week-stat-dot scheduled"></span>
              <strong>{{ totalScheduled }}</strong> Scheduled
            </div>
            <div class="week-stat">
              <span class="week-stat-dot completed"></span>
              <strong>{{ totalCompleted }}</strong> Completed
            </div>
          </div>
        </div>

        <div class="calendar-scroll">
          <div class="calendar-grid">
            <div class="day-header-corner">Inspectors</div>
            <div
              v-for="(day, idx) in weekDays"
              :key="'hdr-'+idx"
              class="day-header-cell"
              :class="{ today: day.isToday, weekend: day.isWeekend }"
            >
              <div class="day-name">{{ day.name }}</div>
              <div class="day-number-bubble" :class="{ active: day.isToday }">{{ day.date }}</div>
            </div>

            <div 
              v-for="insp in filteredInspectors" 
              :key="'row-'+insp.id" 
              class="calendar-row-group"
              :class="{ 'dimmed': selectedInspector !== null && selectedInspector !== insp.id }"
            >
              <div class="row-inspector-cell">
                <div class="row-avatar" :style="{ backgroundColor: insp.color + '15', color: insp.color }">
                  {{ insp.initials }}
                </div>
                <div class="row-inspector-meta">
                  <div class="row-name">{{ insp.name }}</div>
                  <div class="row-role">{{ insp.role }}</div>
                </div>
              </div>
              
              <div
                v-for="(day, dIdx) in weekDays"
                :key="'cell-'+insp.id+'-'+dIdx"
                class="row-day-cell"
                :class="{ today: day.isToday, weekend: day.isWeekend }"
              >
                <div class="cards-stack">
                  <div
                    v-for="event in getEvents(insp.id, day.dateKey)"
                    :key="event.id"
                    class="inspection-card"
                    :class="event.type"
                  >
                    <div class="card-pill"></div>
                    <div class="card-body">
                      <div class="inspection-time">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {{ event.time }}
                      </div>
                      <div class="inspection-title" :title="event.title">{{ event.title }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-number">{{ filteredInspectors.length }}</span>
            <span class="stat-text">Active Inspectors</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">{{ totalScheduled }}</span>
            <span class="stat-text">Total Inspections</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">5</span>
            <span class="stat-text">Working Days</span>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const searchQuery = ref('');
const selectedInspector = ref<number | null>(null);
const weekOffset = ref(0);
const weekInputRef = ref<HTMLInputElement | null>(null);

const inspectors = ref([
    { id: 1, name: 'Anders Nielsen',   initials: 'AN', role: 'Senior Inspector',    color: '#3b82f6', status: 'available' },
    { id: 2, name: 'Maria Jensen',     initials: 'MJ', role: 'Quality Lead',        color: '#8b5cf6', status: 'available' },
    { id: 3, name: 'Lars Pedersen',    initials: 'LP', role: 'Inspector',           color: '#10b981', status: 'busy' },
    { id: 4, name: 'Sophie Hansen',    initials: 'SH', role: 'Junior Inspector',    color: '#f59e0b', status: 'available' },
    { id: 5, name: 'Peter Larsen',     initials: 'PL', role: 'Inspector',           color: '#ef4444', status: 'offline' },
    { id: 6, name: 'Emma Christensen', initials: 'EC', role: 'Quality Specialist',  color: '#06b6d4', status: 'available' },
    { id: 7, name: 'Frederik Rasmussen', initials: 'FR', role: 'Senior Inspector',  color: '#ec4899', status: 'busy' },
]);

function getMonday(offset: number) {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff + offset * 7));
    monday.setHours(0,0,0,0);
    return monday;
}

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const weekDays = computed(() => {
    const monday = getMonday(weekOffset.value);
    const today = new Date();
    today.setHours(0,0,0,0);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        days.push({
            name: dayNames[i],
            date: d.getDate(),
            fullDate: d,
            dateKey: key,
            isToday: d.getTime() === today.getTime(),
            isWeekend: i >= 5,
        });
    }
    return days;
});

const weekNumber = computed(() => {
    const monday = getMonday(weekOffset.value);
    const oneJan = new Date(monday.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((monday.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((monday.getDay() + 1 + numberOfDays) / 7);
});

const weekRange = computed(() => {
    const days = weekDays.value;
    if (!days.length) return '';
    const first = days[0].fullDate;
    const last = days[6].fullDate;
    return `${first.getDate()} ${monthNames[first.getMonth()]} - ${last.getDate()} ${monthNames[last.getMonth()]} ${last.getFullYear()}`;
});

// Mocking Data disesuaikan ke tahun 2026 berjalan dinamis (Contoh isi disamakan dengan range tanggal)
const events = ref([
    { id: 1,  inspectorId: 1, date: '2026-05-18', time: '08:00', title: 'Steel Batch #4521',    type: 'type-a' },
    { id: 2,  inspectorId: 1, date: '2026-05-19', time: '10:30', title: 'Welding QC Line 3',    type: 'type-b' },
    { id: 3,  inspectorId: 1, date: '2026-05-20', time: '09:00', title: 'Surface Finish A12',    type: 'type-a' },
    { id: 4,  inspectorId: 1, date: '2026-05-22', time: '14:00', title: 'Assembly Final Check',  type: 'type-c' },
    { id: 5,  inspectorId: 2, date: '2026-05-18', time: '07:30', title: 'Paint Coating Test',    type: 'type-d' },
    { id: 6,  inspectorId: 2, date: '2026-05-19', time: '11:00', title: 'Dimensional Check B7',  type: 'type-a' },
    { id: 7,  inspectorId: 2, date: '2026-05-21', time: '08:30', title: 'Material Cert Review',  type: 'type-b' },
    { id: 8,  inspectorId: 2, date: '2026-05-22', time: '13:00', title: 'Packaging Inspection',  type: 'type-e' },
    { id: 9,  inspectorId: 3, date: '2026-05-18', time: '09:30', title: 'Electrical Safety #19', type: 'type-e' },
    { id: 10, inspectorId: 3, date: '2026-05-20', time: '10:00', title: 'Component Traceability',type: 'type-b' },
    { id: 11, inspectorId: 3, date: '2026-05-21', time: '15:00', title: 'Pressure Test Vessel',   type: 'type-c' },
    { id: 12, inspectorId: 4, date: '2026-05-19', time: '08:00', title: 'Incoming Material Q3',  type: 'type-a' },
    { id: 13, inspectorId: 4, date: '2026-05-20', time: '11:30', title: 'Color Match Verify',    type: 'type-d' },
    { id: 14, inspectorId: 4, date: '2026-05-21', time: '09:00', title: 'Labeling Compliance',   type: 'type-b' },
    { id: 15, inspectorId: 4, date: '2026-05-22', time: '10:00', title: 'Tolerance Check G5',    type: 'type-a' },
    { id: 16, inspectorId: 5, date: '2026-05-20', time: '08:00', title: 'Corrosion Test Panel',  type: 'type-c' },
    { id: 17, inspectorId: 5, date: '2026-05-22', time: '14:30', title: 'Hardness Test Batch',   type: 'type-e' },
    { id: 18, inspectorId: 6, date: '2026-05-18', time: '10:00', title: 'Cleanliness Audit',     type: 'type-d' },
    { id: 19, inspectorId: 6, date: '2026-05-19', time: '13:00', title: 'Torque Verification',   type: 'type-a' },
    { id: 20, inspectorId: 6, date: '2026-05-21', time: '08:00', title: 'Visual Inspection Lot', type: 'type-b' },
    { id: 21, inspectorId: 6, date: '2026-05-22', time: '09:30', title: 'Leak Test Assembly',    type: 'type-e' },
    { id: 22, inspectorId: 7, date: '2026-05-18', time: '08:30', title: 'NDT Ultrasonic Scan',   type: 'type-a' },
    { id: 23, inspectorId: 7, date: '2026-05-19', time: '09:00', title: 'Weld Penetration X-ray',type: 'type-c' },
    { id: 24, inspectorId: 7, date: '2026-05-21', time: '10:30', title: 'Final Release Sign-off',type: 'type-b' },
    { id: 25, inspectorId: 7, date: '2026-05-22', time: '11:00', title: 'Defect Cataloging',     type: 'type-d' },
]);

function getEvents(inspectorId: number, dateKey: string) {
    return events.value.filter(e => e.inspectorId === inspectorId && e.date === dateKey);
}

function getInspectorCount(inspectorId: number) {
    return events.value.filter(e => e.inspectorId === inspectorId).length;
}

function openWeekPicker() {
  if (weekInputRef.value) {
    // showPicker() adalah standard modern modern browser untuk membuka dropdown picker via JS
    if (typeof weekInputRef.value.showPicker === 'function') {
      weekInputRef.value.showPicker();
    } else {
      weekInputRef.value.click();
    }
  }
}

function onWeekSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.value) return;

  const [yearStr, weekStr] = target.value.split('-W');
  const targetYear = parseInt(yearStr, 10);
  const targetWeek = parseInt(weekStr, 10);

  const janFirst = new Date(targetYear, 0, 1);
  const janFirstDay = janFirst.getDay();
  const firstMonday = new Date(targetYear, 0, 1 + (janFirstDay <= 1 ? 1 - janFirstDay : 8 - janFirstDay));
  
  const selectedMonday = new Date(firstMonday.getTime() + (targetWeek - 1) * 7 * 24 * 60 * 60 * 1000);

  const now = new Date();
  const currentDay = now.getDay();
  const diffToMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const currentMonday = new Date(now.setDate(diffToMonday));
  currentMonday.setHours(0, 0, 0, 0);

  const msDiff = selectedMonday.getTime() - currentMonday.getTime();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  
  weekOffset.value = Math.round(msDiff / oneWeekMs);
  target.value = '';
}

const filteredInspectors = computed(() => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return inspectors.value;
    return inspectors.value.filter(i =>
        i.name.toLowerCase().includes(q) || i.role.toLowerCase().includes(q)
    );
});

const totalScheduled = computed(() => events.value.length);
const totalCompleted = computed(() => Math.floor(events.value.length * 0.7));

function prevWeek() { weekOffset.value--; }
function nextWeek() { weekOffset.value++; }
function goToday()  { weekOffset.value = 0; }
</script>

<style scoped>
/* Reset Token Variabel Warna Global & Tipografi Modern */
.app-container {
  --bg-primary: #f8fafc;
  --bg-white: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --weekend-bg: #fdfdfd;
  
  /* Jenis Warna Kategori Kartu (Pastel Tegas) */
  --type-a-bg: #eff6ff; --type-a-text: #1e40af; --type-a-pill: #3b82f6;
  --type-b-bg: #f5f3ff; --type-b-text: #5b21b6; --type-b-pill: #8b5cf6;
  --type-c-bg: #ecfdf5; --type-c-text: #065f46; --type-c-pill: #10b981;
  --type-d-bg: #fffbeb; --type-d-text: #92400e; --type-d-pill: #f59e0b;
  --type-e-bg: #fdf2f8; --type-e-text: #9d174d; --type-e-pill: #ec4899;

  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-main);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 1. TOPBAR STYLING */
.topbar {
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;
}
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar-logo {
  background: var(--primary);
  color: #fff;
  font-weight: 800;
  font-size: 18px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-content: center;
}
.brand-text {
  display: flex;
  flex-direction: column;
}
.topbar-title {
  font-weight: 700;
  font-size: 16px;
  color: var(--text-main);
  line-height: 1.2;
}
.topbar-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}
.topbar-actions {
  display: flex;
  gap: 8px;
}
.topbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  color: #334155;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.topbar-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.topbar-btn.primary {
  background: var(--primary);
  color: white;
  border: none;
}
.topbar-btn.primary:hover {
  background: var(--primary-hover);
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

/* 2. LAYOUT UTAMA */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 61px);
}

/* 3. SIDEBAR STYLING */
.sidebar {
  width: 280px;
  background: var(--bg-white);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
}
.sidebar-header-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.sidebar-header {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #475569;
  margin: 0;
}
.sidebar-badge {
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
}
.search-wrapper {
  position: relative;
  margin-bottom: 16px;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}
.sidebar-search {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px 8px 32px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.sidebar-search:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.inspector-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.inspector-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.inspector-item:hover {
  background: #f1f5f9;
}
.inspector-item.active {
  background: #eff6ff;
}
.inspector-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-weight: 600;
  font-size: 13px;
  display: grid;
  place-content: center;
  position: relative;
}
.inspector-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  bottom: 0;
  right: 0;
  border: 2px solid white;
}
.inspector-status.available { background: #10b981; }
.inspector-status.busy { background: #f59e0b; }
.inspector-status.offline { background: #94a3b8; }

.inspector-info {
  flex: 1;
  min-width: 0;
}
.inspector-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.inspector-role {
  font-size: 11px;
  color: var(--text-muted);
}
.inspector-count {
  font-size: 11px;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

/* 4. CALENDAR AREA & NAV */
.calendar-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.week-header {
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.week-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
.week-nav-btn {
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}
.week-nav-btn:hover { background: #f1f5f9; }
.week-text-group {
  display: flex;
  flex-direction: column;
}
.week-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}
.week-label {
  font-size: 12px;
  color: var(--text-muted);
}
.today-btn {
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-left: 8px;
}
.today-btn:hover { background: #f1f5f9; }

.week-info {
  display: flex;
  gap: 16px;
}
.week-stat {
  font-size: 13px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
}
.week-stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.week-stat-dot.scheduled { background: var(--primary); }
.week-stat-dot.completed { background: #10b981; }

/* 5. GRID TIMELINE / MATRIKS */
.calendar-scroll {
  flex: 1;
  overflow: auto;
  background: #f8fafc;
}
.calendar-grid {
  display: grid;
  grid-template-columns: 220px repeat(7, minmax(160px, 1fr));
  min-width: 1340px; /* Memastikan grid tidak remuk mengecil */
}

/* Header Sel Kalender */
.day-header-corner {
  background: var(--bg-white);
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 2px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  position: sticky;
  left: 0;
  z-index: 10;
}
.day-header-cell {
  background: var(--bg-white);
  padding: 10px;
  text-align: center;
  border-bottom: 2px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.day-header-cell.weekend {
  background: var(--weekend-bg);
}
.day-name {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
}
.day-number-bubble {
  font-size: 14px;
  font-weight: 700;
  width: 28px;
  height: 28px;
  display: grid;
  place-content: center;
  border-radius: 50%;
  color: #334155;
}
.day-number-bubble.active {
  background: var(--primary);
  color: white !important;
}

/* Baris & Isi Sel Kalender */
.calendar-row-group {
  display: contents; /* Menjaga struktur grid tetap sejajar */
}
.calendar-row-group.dimmed div.row-day-cell {
  opacity: 0.4;
}
.calendar-row-group.dimmed div.row-inspector-cell {
  opacity: 0.5;
}

.row-inspector-cell {
  background: var(--bg-white);
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 10px;
  position: sticky;
  left: 0;
  z-index: 9;
  box-shadow: 4px 0 8px -4px rgba(0,0,0,0.05);
}
.row-avatar {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 11px;
  display: grid;
  place-content: center;
}
.row-inspector-meta {
  min-width: 0;
}
.row-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-role {
  font-size: 11px;
  color: var(--text-muted);
}

.row-day-cell {
  background: var(--bg-white);
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  min-height: 90px;
  transition: opacity 0.2s ease;
}
.row-day-cell.weekend {
  background: var(--weekend-bg);
}
.row-day-cell.today {
  background: rgba(37, 99, 235, 0.01);
}

/* Stack Tumpukan Kartu Acara */
.cards-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 6. CARD INSPECTION DESIGN */
.inspection-card {
  border-radius: 6px;
  padding: 6px 8px;
  display: flex;
  gap: 6px;
  align-items: flex-start;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  transition: transform 0.1s;
}
.inspection-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.card-pill {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  margin-top: 2px;
  flex-shrink: 0;
}
.card-body {
  flex: 1;
  min-width: 0;
}
.inspection-time {
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 1px;
}
.inspection-title {
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

/* Skema Pewarnaan Kartu Dinamis */
.type-a { background-color: var(--type-a-bg); color: var(--type-a-text); }
.type-a .card-pill { background-color: var(--type-a-pill); }
.type-a .inspection-time { color: var(--type-a-pill); }

.type-b { background-color: var(--type-b-bg); color: var(--type-b-text); }
.type-b .card-pill { background-color: var(--type-b-pill); }
.type-b .inspection-time { color: var(--type-b-pill); }

.type-c { background-color: var(--type-c-bg); color: var(--type-c-text); }
.type-c .card-pill { background-color: var(--type-c-pill); }
.type-c .inspection-time { color: var(--type-c-pill); }

.type-d { background-color: var(--type-d-bg); color: var(--type-d-text); }
.type-d .card-pill { background-color: var(--type-d-pill); }
.type-d .inspection-time { color: var(--type-d-pill); }

.type-e { background-color: var(--type-e-bg); color: var(--type-e-text); }
.type-e .card-pill { background-color: var(--type-e-pill); }
.type-e .inspection-time { color: var(--type-e-pill); }

/* 7. STATS FOOTER BAR */
.stats-bar {
  background: var(--bg-white);
  border-top: 1px solid var(--border-color);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stat-number {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
}
.stat-text {
  font-size: 12px;
  color: var(--text-muted);
}
.stat-divider {
  width: 1px;
  height: 14px;
  background: var(--border-color);
}
.stat-footer-address {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 11px;
}

.hidden-week-picker {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none; /* Klik dilewatkan ke div induknya */
  z-index: -1;
}

/* Efek feedback hover opsional agar user tahu area ini bisa diklik */
.week-text-group:hover .week-title {
  color: #534AB7; /* Menyesuaikan warna tema kitaINSPECT Anda */
  text-decoration: underline;
}
</style>