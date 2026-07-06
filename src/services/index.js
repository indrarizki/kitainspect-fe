import http from './http'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login:          (data)   => http.post('/auth/login', data),
  logout:         ()       => http.post('/auth/logout'),
  me:             ()       => http.get('/auth/me'),
  changePassword: (data)   => http.put('/auth/password', data),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  summary:       ()      => http.get('/dashboard/summary'),
  recent:        ()      => http.get('/dashboard/recent'),
  stats:         ()      => http.get('/dashboard/stats'),
  notifications: (p)     => http.get('/dashboard/notifications', { params: p }),
  markRead:      (id)    => http.put(`/dashboard/notifications/${id}/read`),
  markAllRead:   ()      => http.put('/dashboard/notifications/read-all'),
}

export const dashboardHrisService = {
  summary: () => http.get('/dashboard-hris/summary'),
  // employeeList:  (p) => http.get('/dashboard-hris/employees', { params: p }),
}

export const employeeService = {
  list:   (params) => http.get('/employees', { params }),
  get:    (id)     => http.get(`/employees/${id}`),
  create: (data)   => http.post('/employees', data),
  update: (id, d)  => http.put(`/employees/${id}`, d),
  delete: (id)     => http.delete(`/employees/${id}`),
  export: (params) => http.get('/employees/export', { params, responseType: 'blob' }),
  import: (formData) => http.post('/employees/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export const payrollService = {
  list:   (params) => http.get('/payrolls', { params }),
  get:    (id)     => http.get(`/payrolls/${id}`),
  create: (data)   => http.post('/payrolls', data),
  update: (id, d)  => http.put(`/payrolls/${id}`, d),
  delete: (id)     => http.delete(`/payrolls/${id}`),
  export: (id)     => http.get(`/payrolls/${id}/export`, { responseType: 'blob' }),
  import: (formData) => http.post('/payrolls/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  listPayroll: (id) => http.get(`/payrolls/list/${id}`),
  payrollDetails: (id) => http.get(`/payrolls/details/${id}`),
}

export const departmentService = {
  list:   (params) => http.get('/departments', { params }),
  get:    (id)     => http.get(`/departments/${id}`),
  create: (data)   => http.post('/departments', data),
  update: (id, d)  => http.put(`/departments/${id}`, d),
  delete: (id)     => http.delete(`/departments/${id}`),
}

export const attendanceService = {
  list:   (params) => http.get('/attendance', { params }),
  get:    (id)     => http.get(`/attendance/${id}`),
  create: (data)   => http.post('/attendance', data),
  update: (id, d)  => http.put(`/attendance/${id}`, d),
  delete: (id)     => http.delete(`/attendance/${id}`),
  export: (id)     => http.get(`/attendance/${id}/export`, { responseType: 'blob' }),
  import: (formData) => http.post('/attendance/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export const holidaysService = {
  list:   (params) => http.get('/holidays', { params }),
  get:    (id)     => http.get(`/holidays/${id}`),
  create: (data)   => http.post('/holidays', data),
  update: (id, d)  => http.put(`/holidays/${id}`, d),
  delete: (id)     => http.delete(`/holidays/${id}`),
}


// ── Inspection Orders ─────────────────────────────────────────────────────────
export const hrisMasterDataService = {
  list:   (resource, params) => http.get(`/hris-master-data/${resource}`, { params }),
  get:    (resource, id)     => http.get(`/hris-master-data/${resource}/${id}`),
  create: (resource, data)   => http.post(`/hris-master-data/${resource}`, data),
  update: (resource, id, d)  => http.put(`/hris-master-data/${resource}/${id}`, d),
  delete: (resource, id)     => http.delete(`/hris-master-data/${resource}/${id}`),
}

export const shiftmentService = {
  list:   (params) => http.get('/shiftments', { params }),
  get:    (id)     => http.get(`/shiftments/${id}`),
  create: (data)   => http.post('/shiftments', data),
  update: (id, d)  => http.put(`/shiftments/${id}`, d),
  delete: (id)     => http.delete(`/shiftments/${id}`),
}

export const workShiftService = {
  list:   (params) => http.get('/workshifts', { params }),
  get:    (id)     => http.get(`/workshifts/${id}`),
  create: (data)   => http.post('/workshifts', data),
  update: (id, d)  => http.put(`/workshifts/${id}`, d),
  delete: (id)     => http.delete(`/workshifts/${id}`),
}

export const overtimeService = {
  list:   (params) => http.get('/overtimes', { params }),
  get:    (id)     => http.get(`/overtimes/${id}`),
  create: (data)   => http.post('/overtimes', data),
  update: (id, d)  => http.put(`/overtimes/${id}`, d),
  delete: (id)     => http.delete(`/overtimes/${id}`),
}

export const inspectionService = {
  // Orders
  list:    (params)  => http.get('/inspections', { params }),
  get:     (id)      => http.get(`/inspections/${id}`),
  create:  (data)    => http.post('/inspections', data),
  update:  (id, d)   => http.put(`/inspections/${id}`, d),
  delete:  (id)      => http.delete(`/inspections/${id}`),
  submit:  (id)      => http.post(`/inspections/${id}/submit`),
  aqlPreview: (id)   => http.get(`/inspections/${id}/aql-preview`),

  // Items
  listItems:   (orderId)          => http.get(`/inspections/${orderId}/items`),
  storeItem:   (orderId, data)    => http.post(`/inspections/${orderId}/items`, data),
  updateItem:  (orderId, itemId, data) => http.put(`/inspections/${orderId}/items/${itemId}`, data),
  destroyItem: (orderId, itemId)  => http.delete(`/inspections/${orderId}/items/${itemId}`),

  // Checkpoint responses
  saveResponses: (orderId, itemId, data) =>
    http.post(`/inspections/${orderId}/items/${itemId}/responses`, data),

  // Defects
  storeDefect:   (orderId, itemId, data) =>
    http.post(`/inspections/${orderId}/items/${itemId}/defects`, data),
  destroyDefect: (defectId) => http.delete(`/defects/${defectId}`),

  // Evidences
  uploadEvidence: (orderId, itemId, formData) =>
    http.post(`/inspections/${orderId}/items/${itemId}/evidences`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  destroyEvidence: (evidenceId) => http.delete(`/evidences/${evidenceId}`),
}

export const roleService = {
  list:   ()      => http.get('/roles'),
  get:    (id)    => http.get(`/roles/${id}`),
  create: (data)   => http.post('/roles', data),
  update: (id, d)  => http.put(`/roles/${id}`, d),
  delete: (id)     => http.delete(`/roles/${id}`),
}

export const permissionService = {
  list: () => http.get('/permissions'),
  update: (roleId, data) => http.put(`/permissions/${roleId}`, data),
}

// ── Approvals ─────────────────────────────────────────────────────────────────
export const approvalService = {
  list:    (params) => http.get('/approvals', { params }),
  get:     (id)     => http.get(`/approvals/${id}`),
  approve: (id, d)  => http.post(`/approvals/${id}/approve`, d),
  reject:  (id, d)  => http.post(`/approvals/${id}/reject`, d),
  revise:  (id, d)  => http.post(`/approvals/${id}/revise`, d),
  history: (params) => http.get('/approvals/history', { params }),
}

// ── Templates ─────────────────────────────────────────────────────────────────
export const templateService = {
  // Templates
  list:      (params) => http.get('/templates', { params }),
  get:       (id)     => http.get(`/templates/${id}`),
  create:    (data)   => http.post('/templates', data),
  update:    (id, d)  => http.put(`/templates/${id}`, d),
  delete:    (id)     => http.delete(`/templates/${id}`),
  publish:   (id)     => http.post(`/templates/${id}/publish`),
  duplicate: (id)     => http.post(`/templates/${id}/duplicate`),
  types:     ()       => http.get('/inspection-types'),

  // Sections
  getSections:   (templateId)      => http.get(`/templates/${templateId}/sections`),
  addSection:    (templateId, d)   => http.post(`/templates/${templateId}/sections`, d),
  updateSection: (sectionId, d)    => http.put(`/sections/${sectionId}`, d),
  deleteSection: (sectionId)       => http.delete(`/sections/${sectionId}`),
  reorderSections: (data)          => http.put('/sections/reorder', data),

  // Checkpoints
  addItem:         (sectionId, d)  => http.post(`/sections/${sectionId}/items`, d),
  updateItem:      (cpId, d)       => http.put(`/items/${cpId}`, d),
  deleteItem:      (cpId)          => http.delete(`/items/${cpId}`),
  reorderItems:    (data)          => http.put('/items/reorder', data),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const userService = {
  list:       (params) => http.get('/users', { params }),
  get:        (id)     => http.get(`/users/${id}`),
  create:     (data)   => http.post('/users', data),
  update:     (id, d)  => http.put(`/users/${id}`, d),
  delete:     (id)     => http.delete(`/users/${id}`),
  assignRole: (id, d)  => http.put(`/users/${id}/role`, d),
  roles:      ()       => http.get('/users/roles'),
  resetPassword: (id, d)  => http.put(`/users/${id}/reset-password`, d),
}

// ── Companies ─────────────────────────────────────────────────────────────────
export const companyService = {
  list:   (params) => http.get('/companies', { params }),
  get:    (id)     => http.get(`/companies/${id}`),
  create: (data)   => http.post('/companies', data),
  update: (id, d)  => http.put(`/companies/${id}`, d),
  delete: (id)     => http.delete(`/companies/${id}`),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportService = {
  list:        (params) => http.get('/reports', { params }),
  exportPdf:   (data)   => http.post('/reports/export/pdf', data, { responseType: 'blob' }),
  exportExcel: (data)   => http.post('/reports/export/excel', data, { responseType: 'blob' }),
}
