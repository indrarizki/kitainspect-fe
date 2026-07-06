<template>
  <component :is="layout" />

  <!-- Global Toast -->
  <Teleport to="body">
    <div class="toast-wrap">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="`toast-${t.type}`"
        >
          <span class="toast-icon">{{ icons[t.type] }}</span>
          {{ t.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout    from '@/layouts/AuthLayout.vue'
import BlankLayout   from '@/layouts/BlankLayout.vue'
import { useToast }  from '@/composables'

const route  = useRoute()
const { toasts } = useToast()

const icons  = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }

const layoutMap = { default: DefaultLayout, auth: AuthLayout, blank: BlankLayout }
const layout    = computed(() => layoutMap[route.meta.layout ?? 'default'] ?? DefaultLayout)
</script>

<style>
/* ── Reset & tokens ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; background: #f5f4f0; color: #1a1a18; }
a { text-decoration: none; color: inherit; }
button { cursor: pointer; font-family: inherit; }
input, textarea, select { font-family: inherit; }

/* Global design tokens (ensure CSS variables used across components have sensible defaults) */
:root {
  --color-border-tertiary: #e0dfd8;
  --color-border-primary: #d8d7cf;
  --color-background-secondary: #faf9f7;
  --color-text-secondary: #555;
  --color-text-primary: #1a1a18;
}

/* ── Toast ── */
.toast-wrap { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
.toast { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; min-width: 260px; max-width: 380px; box-shadow: 0 4px 16px rgba(0,0,0,.12); }
.toast-icon { font-size: 15px; }
.toast-success { background: #E1F5EE; color: #085041; border: 1px solid #A8DFC8; }
.toast-error   { background: #FCEBEB; color: #791F1F; border: 1px solid #F5BABA; }
.toast-info    { background: #E6F1FB; color: #0C447C; border: 1px solid #A8C9EF; }
.toast-warning { background: #FAEEDA; color: #633806; border: 1px solid #F0CC8C; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to   { opacity: 0; transform: translateX(20px); }
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }

/* ── Badge ── */
.badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
.badge-draft     { background: #F1EFE8; color: #5F5E5A; }
.badge-submitted { background: #E6F1FB; color: #0C447C; }
.badge-review    { background: #EEEDFE; color: #3C3489; }
.badge-approved  { background: #E1F5EE; color: #085041; }
.badge-rejected  { background: #FCEBEB; color: #791F1F; }

/* ── Shared card ── */
.card { background: #fff; border: 0.5px solid #e0dfd8; border-radius: 10px; padding: 16px; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-title { font-size: 13px; font-weight: 500; color: #1a1a18; }

/* ── Form elements ── */
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 12px; font-weight: 500; color: #555; margin-bottom: 5px; }
.field input,
.field select,
.field textarea { width: 100%; padding: 8px 11px; border: 1px solid #d8d7cf; border-radius: 7px; font-size: 13px; color: #1a1a18; background: #fff; outline: none; transition: border-color .15s; }
.field input:focus,
.field select:focus,
.field textarea:focus { border-color: #534AB7; box-shadow: 0 0 0 3px rgba(83,74,183,.1); }
.field-error { font-size: 11.5px; color: #A32D2D; margin-top: 4px; }

/* ── Buttons ── */
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 7px; font-size: 13px; font-weight: 500; border: 1px solid transparent; transition: all .15s; }
.btn-primary  { background: #534AB7; color: #fff; }
.btn-primary:hover  { background: #4540a0; }
.btn-secondary { background: #fff; color: #3d3d3a; border-color: #d8d7cf; }
.btn-secondary:hover { background: #f5f4f0; }
.btn-danger   { background: #FCEBEB; color: #791F1F; border-color: #F5BABA; }
.btn-danger:hover { background: #f8d5d5; }
.btn-success  { background: #E1F5EE; color: #085041; border-color: #A8DFC8; }
.btn-success:hover { background: #c9edde; }
.btn-sm { padding: 5px 11px; font-size: 12px; }
.btn:disabled { opacity: .55; pointer-events: none; }

/* ── Table ── */
.table-wrap { background: #fff; border: 0.5px solid #e0dfd8; border-radius: 10px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
thead tr { border-bottom: 1px solid #e0dfd8; }
th { padding: 10px 14px; font-size: 11.5px; font-weight: 500; color: #888; text-align: left; white-space: nowrap; }
tbody tr { border-bottom: 0.5px solid #e0dfd8; transition: background .1s; }
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: #faf9f7; }
td { padding: 11px 14px; font-size: 13px; color: #1a1a18; }
</style>