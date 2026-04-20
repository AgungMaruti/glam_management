'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  style?: React.CSSProperties
}

export default function Select({ value, onChange, options, placeholder = '-- Pilih --', style }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const selected = options.find(o => o.value === value)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node))
        setOpen(false)
    }
    const closeOnScroll = (e: Event) => {
      if (!dropRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [open])

  const openDrop = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const dropH = Math.min(options.length * 40 + 8, 260)
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow > dropH ? rect.bottom + 4 : rect.top - dropH - 4
    setPos({ top, left: rect.left, width: rect.width })
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDrop}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: open ? '#fff' : '#F8FAFC',
          border: `1.5px solid ${open ? '#6366F1' : '#E2E8F0'}`,
          color: selected ? '#0F172A' : '#94A3B8',
          borderRadius: 8, padding: '9px 12px', fontSize: 14,
          fontFamily: 'inherit', outline: 'none',
          transition: 'border-color .15s, background .15s, box-shadow .15s',
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,.12)' : 'none',
          ...style,
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15} color="#94A3B8"
          style={{ flexShrink: 0, marginLeft: 8, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
        />
      </button>

      {open && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed', zIndex: 9999,
            top: pos.top, left: pos.left, width: pos.width,
            background: '#fff', border: '1px solid #E2E8F0',
            borderRadius: 10, padding: 4, overflowY: 'auto', maxHeight: 260,
            boxShadow: '0 8px 32px rgba(15,23,42,.12), 0 2px 8px rgba(15,23,42,.06)',
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '9px 12px', borderRadius: 7, gap: 8,
                background: opt.value === value ? '#EEF2FF' : 'transparent',
                color: opt.value === value ? '#4338CA' : '#334155',
                fontSize: 14, fontWeight: opt.value === value ? 600 : 400,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                transition: 'background .1s',
              }}
              onMouseEnter={e => { if (opt.value !== value) (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
              onMouseLeave={e => { if (opt.value !== value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <span style={{ flex: 1 }}>{opt.label}</span>
              {opt.value === value && <Check size={14} color="#6366F1" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
