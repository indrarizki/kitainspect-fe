export const STATUS_CONFIG = {
  draft:     { label: 'Draft',     class: 'badge-draft',     color: '#888780' },
  submitted: { label: 'Submitted', class: 'badge-submitted', color: '#185FA5' },
  in_review: { label: 'In Review', class: 'badge-review',    color: '#534AB7' },
  approved:  { label: 'Approved',  class: 'badge-approved',  color: '#0F6E56' },
  rejected:  { label: 'Rejected',  class: 'badge-rejected',  color: '#A32D2D' },
}

export const statusLabel = (status) => STATUS_CONFIG[status]?.label ?? status
export const statusClass = (status) => STATUS_CONFIG[status]?.class ?? 'badge-draft'
export const statusColor = (status) => STATUS_CONFIG[status]?.color ?? '#888'

export const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', color: '#534AB7' },
  admin:       { label: 'Admin',       color: '#185FA5' },
  inspector:   { label: 'Inspector',   color: '#0F6E56' },
  reviewer:    { label: 'Reviewer',    color: '#854F0B' },
  viewer:      { label: 'Viewer',      color: '#888780' },
}

export const roleLabel = (slug) => ROLE_CONFIG[slug]?.label ?? slug

export const INPUT_TYPE_LABELS = {
  text:      'Teks',
  textarea:  'Teks Panjang',
  number:    'Angka',
  date:      'Tanggal',
  checkbox:  'Checkbox',
  radio:     'Pilihan Tunggal',
  select:    'Dropdown',
  photo:     'Foto',
  signature: 'Tanda Tangan',
  rating:    'Rating',
}