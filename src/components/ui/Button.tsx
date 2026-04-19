'use client'

import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline' | 'soft'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  loading?: boolean
}

const styles = {
  primary: {
    background: '#6366F1', color: '#fff', border: '1.5px solid transparent',
    boxShadow: '0 1px 3px rgba(99,102,241,0.3)',
  },
  ghost: { background: '#fff', color: '#374151', border: '1.5px solid #E5E2DC' },
  danger: { background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA' },
  outline: { background: 'transparent', color: '#6366F1', border: '1.5px solid #C7D2FE' },
  soft: { background: '#EEF2FF', color: '#4F46E5', border: '1.5px solid transparent' },
}

const hoverStyles = {
  primary: { background: '#4F46E5' },
  ghost: { background: '#F9F8F5' },
  danger: { background: '#FEE2E2' },
  outline: { background: '#EEF2FF' },
  soft: { background: '#E0E7FF' },
}

const sizes = {
  sm: { padding: '6px 12px', fontSize: 12, gap: 5, iconSize: 13 },
  md: { padding: '9px 16px', fontSize: 13, gap: 6, iconSize: 14 },
  lg: { padding: '11px 20px', fontSize: 14, gap: 7, iconSize: 15 },
}

export default function Button({
  children, variant = 'primary', size = 'md', icon: Icon, loading,
  className = '', style, disabled, ...props
}: ButtonProps) {
  const s = sizes[size]
  const v = styles[variant]

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: s.gap, padding: s.padding, fontSize: s.fontSize, fontWeight: 600,
        borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all .15s', whiteSpace: 'nowrap',
        opacity: (disabled || loading) ? 0.55 : 1,
        ...v, ...style,
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) Object.assign((e.currentTarget as HTMLButtonElement).style, hoverStyles[variant])
      }}
      onMouseLeave={e => {
        if (!disabled && !loading) Object.assign((e.currentTarget as HTMLButtonElement).style, v)
      }}
      onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}
      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
      className={className}
    >
      {loading
        ? <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
        : Icon && <Icon size={s.iconSize} strokeWidth={2.2} />}
      {children}
    </button>
  )
}
