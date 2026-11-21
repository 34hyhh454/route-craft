import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export function Button({ variant = 'secondary', className = '', ...props }) {
  return <button className={`btn ${variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : ''} ${className}`} {...props} />
}

export function Card({ className = '', children, ...props }) {
  return <section className={`panel ${className}`} {...props}>{children}</section>
}

export function Badge({ tone = 'default', className = '', children, ...props }) {
  return <span className={`badge badge-${tone} ${className}`} {...props}>{children}</span>
}

export function Input({ className = '', ...props }) {
  return <input className={`field ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return <select className={`field ${className}`} {...props}>{children}</select>
}

export function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="stat-tile">
      {Icon && <Icon aria-hidden="true" size={16} className="stat-icon" />}
      <p>{label}</p>
      <strong className="mono">{value}</strong>
    </div>
  )
}

export function Tabs({ items, value, onChange, label = 'Choose a view' }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button key={item.value} type="button" role="tab" aria-selected={value === item.value} className={value === item.value ? 'tab active' : 'tab'} onClick={() => onChange(item.value)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />
}

export function SkeletonBlock({ rows = 3 }) {
  return (
    <div className="skeleton-block" role="status" aria-label="Loading content">
      {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className={index === 0 ? 'skeleton-title' : 'skeleton-row'} />)}
    </div>
  )
}

export function Toast({ kind = 'info', children, onDismiss }) {
  const Icon = kind === 'success' ? CheckCircle2 : kind === 'error' ? AlertCircle : Info
  return (
    <div className={`toast toast-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" size={17} />
      <span>{children}</span>
      {onDismiss && <button className="toast-dismiss" type="button" aria-label="Dismiss notification" onClick={onDismiss}><X size={15} /></button>}
    </div>
  )
}

export function EmptyState({ icon: Icon = Info, title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon aria-hidden="true" size={22} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  )
}
