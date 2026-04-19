'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color?: 'indigo' | 'green' | 'amber' | 'red' | 'violet'
}

const palette = {
  indigo: { bg: '#EEF2FF', icon: '#6366F1', text: '#4338CA' },
  green:  { bg: '#F0FDF4', icon: '#16A34A', text: '#15803D' },
  amber:  { bg: '#FFFBEB', icon: '#D97706', text: '#B45309' },
  red:    { bg: '#FEF2F2', icon: '#DC2626', text: '#B91C1C' },
  violet: { bg: '#F5F3FF', icon: '#7C3AED', text: '#6D28D9' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo' }: StatCardProps) {
  const p = palette[color]
  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.bg, flexShrink: 0 }}>
        <Icon size={17} color={p.icon} strokeWidth={2.2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 500, marginBottom: 2 }}>{title}</p>
        <p style={{ fontSize: 18, fontWeight: 800, color: p.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</p>
        {subtitle && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
  )
}
