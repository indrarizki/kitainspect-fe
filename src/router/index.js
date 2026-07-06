import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/modules/auth/store/authStore'

const routes = [
  // ── Auth ───────────────────────────────────────────────────────────────────
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: { layout: 'auth', public: true },
  },

  // ── Redirect root ──────────────────────────────────────────────────────────
  { path: '/', redirect: '/dashboard' },

  // ── App ────────────────────────────────────────────────────────────────────
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/modules/dashboard/views/DashboardView.vue'),
    meta: { layout: 'default' },
  },
  {
    path: '/dashboard-hris',
    name: 'dashboard-hris',
    component: () => import('@/modules/dashboard/views/DashboardHrisView.vue'),
    meta: { layout: 'default', permission: 'dashboard.hris.view' },
  },
  {
    path: '/hris/master-data',
    name: 'hris-master-data',
    component: () => import('@/modules/dashboard/views/HrisMasterDataView.vue'),
    meta: { layout: 'default', permission: 'dashboard.hris.view' },
  },
  {
    path: '/hris/shift-overtime',
    name: 'hris-shift-overtime',
    component: () => import('@/modules/dashboard/views/ShiftOvertimeView.vue'),
    meta: { layout: 'default', permission: 'dashboard.hris.view' },
  },
  {
    path: '/employees',
    name: 'employees',
    component: () => import('@/modules/employee/views/EmployeeListView.vue'),
    meta: { layout: 'default', permission: 'employee.view' },
  },
  {
    path: '/attendances',
    name: 'attendances',
    component: () => import('@/modules/attendance/views/AttendanceListView.vue'),
    meta: { layout: 'default', permission: 'attendance.view' },
  },
  {
    path: '/attendances/:id',
    name: 'attendance-detail',
    component: () => import('@/modules/attendance/views/AttendanceDetailView.vue'),
    meta: { layout: 'default', permission: 'attendance.view' },
  },
  {
    path: '/attendances/:id/edit',
    name: 'attendance-edit',
    component: () => import('@/modules/attendance/views/AttendanceUpdateView.vue'),
    meta: { layout: 'default', permission: 'attendance.update' },
  },
  {
    path: '/departments',
    name: 'departments',
    component: () => import('@/modules/department/views/DepartmentListView.vue'),
    meta: { layout: 'default', permission: 'department.view' },
  },
  {
    path: '/employees/create',
    name: 'employee-create',
    component: () => import('@/modules/employee/views/EmployeeCreateView.vue'),
    meta: { layout: 'default', permission: 'employee.create' },
  },
  {
    path: '/employees/:id',
    name: 'employee-detail',
    component: () => import('@/modules/employee/views/EmployeeDetailView.vue'),
    meta: { layout: 'default', permission: 'employee.view' },
  },
  {
    path: '/employees/:id/edit',
    name: 'employee-edit',
    component: () => import('@/modules/employee/views/EmployeeCreateView.vue'),
    meta: { layout: 'default', permission: 'employee.update' },
  },
  {
    path: '/payrolls',
    name: 'payroll',
    component: () => import('@/modules/payroll/views/PayrollPeriodListView.vue'),
    meta: { layout: 'default', permission: 'payroll.view' },
  },
  {
    path: '/holiday-calender',
    name: 'holiday-calender',
    component: () => import('@/modules/holiday/views/HolidayCalenderView.vue'),
    meta: { layout: 'default', permission: 'holiday.calender.view' },
  },
  {
    path: '/payrolls/list',
    name: 'payrolls',
    component: () => import('@/modules/payroll/views/PayrollListView.vue'),
    meta: { layout: 'default', permission: 'payroll.view' },
  },
  {
    path: '/payrolls/:id',
    name: 'payroll-list',
    component: () => import('@/modules/payroll/views/PayrollListView.vue'),
    meta: { layout: 'default', permission: 'payroll.view' },
  },
  {
    path: '/payrolls/detail/:id',
    name: 'payroll-detail',
    component: () => import('@/modules/payroll/views/PayrollDetailView.vue'),
    meta: { layout: 'default', permission: 'payroll.detail.view' },
  },
  {
    path: '/inspections',
    name: 'inspections',
    component: () => import('@/modules/inspection/views/InspectionListView.vue'),
    meta: { layout: 'default', permission: 'inspection.view-all' },
  },
  {
    path: '/inspections',
    name: 'inspections',
    component: () => import('@/modules/inspection/views/InspectionListView.vue'),
    meta: { layout: 'default', permission: 'inspection.view-own' },
  },
  {
    path: '/inspections/calendar',
    name: 'inspection-calendar',
    component: () => import('@/modules/inspection/views/InspectionCalendarView.vue'),
    meta: { layout: 'default', permission: 'inspection.view-all' },
  },
  {
    path: '/inspections/create',
    name: 'inspection-create',
    component: () => import('@/modules/inspection/views/InspectionOrderView.vue'),
    meta: { layout: 'default', permission: 'inspection.create' },
  },
  {
    path: '/inspections/:id',
    name: 'inspection-detail',
    component: () => import('@/modules/inspection/views/InspectionDetailView.vue'),
    meta: { layout: 'default', permissions: ['inspection.view-all', 'inspection.view-own'] },
  },
  {
    path: '/inspections/:id/form',
    name: 'inspection-form',
    component: () => import('@/modules/inspection/views/InspectionDetailView.vue'),
    meta: { layout: 'default', permission: 'inspection.create' },
  },
  {
    path: '/approvals',
    name: 'approvals',
    component: () => import('@/modules/approval/views/ApprovalQueueView.vue'),
    meta: { layout: 'default', permission: 'approval.view' },
  },
  {
    path: '/approvals/:id',
    name: 'approval-detail',
    component: () => import('@/modules/approval/views/ApprovalDetailView.vue'),
    meta: { layout: 'default', permission: 'approval.view' },
  },
  {
    path: '/templates',
    name: 'templates',
    component: () => import('@/modules/template/views/TemplateListView.vue'),
    meta: { layout: 'default', permission: 'template.view' },
  },
  {
    path: '/templates/create',
    name: 'template-create',
    component: () => import('@/modules/template/views/TemplateCreateView.vue'),
    meta: { layout: 'default', permission: 'template.create' },
  },
  {
    path: '/templates/:id/builder',
    name: 'template-builder',
    component: () => import('@/modules/template/views/TemplateBuilderView.vue'),
    meta: { layout: 'default', permission: 'template.create' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/modules/user/views/UserListView.vue'),
    meta: { layout: 'default', permission: 'user.view' },
  },
  {
    path: '/companies',
    name: 'companies',
    component: () => import('@/modules/company/views/CompanyListView.vue'),
    meta: { layout: 'default', permission: 'company.view' },
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/modules/report/views/ReportView.vue'),
    meta: { layout: 'default', permission: 'report.view' },
  },
  {
    path: '/roles',
    name: 'roles',
    component: () => import('@/modules/role/views/RoleListView.vue'),
    meta: { layout: 'default', permission: 'role.view' },
  },
    {
    path: '/roles/:id',
    name: 'roles-detail',
    component: () => import('@/modules/role/views/RoleEditView.vue'),
    meta: { layout: 'default', permission: 'role.view' },
  },

  // ── 404 ────────────────────────────────────────────────────────────────────



  // ── 404 ────────────────────────────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/modules/auth/views/NotFoundView.vue'),
    meta: { layout: 'blank' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.public) return true
  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  if (!auth.user) await auth.fetchMe()
  if (!auth.user) return { name: 'login' }

  // If the user role is admin_hr, redirect default dashboard to HRIS dashboard
  if (auth.roleSlug === 'admin_hr') {
    if (to.name === 'dashboard') return { name: 'dashboard-hris' }
  }

  if (to.meta.permission && !auth.can(to.meta.permission)) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
