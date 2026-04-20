'use client'

import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline' | 'soft'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  loading?: boolean
}

const base = {
  primary: { background: '#6366F1', color: '#fff', border: '1px solid transparent', boxShadow: '0 1px 2px rgba(99,102,241,.2)' },
  ghost:   { background: '#fff', color: '#334155', border: '1px solid #E2E8F0' },
  danger:  { background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' },
  outline: { background: 'transparent', color: '#6366F1', border: '1px solid #C7D2FE' },
  soft:    { background: '#EEF2FF', color: '#4F46E5', border: '1px solid transparent' },
}

const hover = {
  primary: { background: '#4F46E5' },
  ghost:   { background: '#F8FAFC' },
  danger:  { background: '#FEE2E2' },
  outline: { background: '#EEF2FF' },
  soft:    { background: '#E0E7FF' },
}

const sizes = {
  sm: { padding: '7px 14px', fontSize: 13, gap: 6, iconSize: 14 },
  md: { padding: '9px 18px', fontSize: 14, gap: 7, iconSize: 15 },
  lg: { padding: '12px 24px', fontSize: 15, gap: 8, iconSize: 16 },
}

export default function Button({
  children, variant = 'primary', size = 'md', icon: Icon, loading,
  className = '', style, disabled, ...props
}: ButtonProps) {
  const s = sizes[size]
  const v = base[variant]
  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: s.gap, padding: s.padding, fontSize: s.fontSize, fontWeight: 600,
        borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all .12s', whiteSpace: 'nowrap',
        opacity: (disabled || loading) ? 0.5 : 1,
        ...v, ...style,
      }}
      onMouseEnter={e => { if (!disabled && !loading) Object.assign((e.currentTarget as HTMLButtonElement).style, hover[variant]) }}
      onMouseLeave={e => { if (!disabled && !loading) Object.assign((e.currentTarget as HTMLButtonElement).style, v) }}
      onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}
      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
      className={className}
    >
      {loading
        ? <span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
        : Icon && <Icon size={s.iconSize} strokeWidth={2.2} />}
      {children}
    </button>
  )
}
