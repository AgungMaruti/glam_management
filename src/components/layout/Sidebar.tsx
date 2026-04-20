'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FlaskConical, Boxes, Calculator, TrendingUp, Sparkles, Menu, X, ShoppingCart } from 'lucide-react'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produk & Varian', icon: FlaskConical },
  { href: '/inventory', label: 'Inventori', icon: Boxes },
  { href: '/rad', label: 'RAD & HPP', icon: Calculator },
  { href: '/cashflow', label: 'Cashflow', icon: TrendingUp },
  { href: '/pricing', label: 'Kalkulator Harga', icon: ShoppingCart },
]

function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        boxShadow: '0 2px 8px rgba(99,102,241,.3)',
        flexShrink: 0,
      }}>
        <Sparkles size={14} color="#fff" strokeWidth={2.2} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>Glam Suite</p>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Business Manager</p>
      </div>
    </div>
  )
}

function NavContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{ padding: '18px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Brand />
        {onClose && (
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            <X size={15} />
          </button>
        )}
      </div>

      <div style={{ height: 1, background: '#F1F5F9', margin: '0 16px 6px' }} />

      {/* Nav */}
      <nav style={{ padding: '4px 10px', flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.08em', padding: '4px 8px 8px', textTransform: 'uppercase' }}>
          Menu
        </p>
        {nav.map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 1 }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  transition: 'all 0.12s',
                  background: active ? '#EEF2FF' : 'transparent',
                  color: active ? '#4F46E5' : '#64748B',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'
                    ;(e.currentTarget as HTMLDivElement).style.color = '#334155'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLDivElement).style.color = '#64748B'
                  }
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: active ? '#E0E7FF' : 'transparent',
                  transition: 'background 0.12s',
                }}>
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.9} />
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{ height: 1, background: '#F1F5F9', marginBottom: 12 }} />
        <p style={{ fontSize: 11, color: '#CBD5E1', padding: '0 10px' }}>Perfume Suite · v1.0 · 2026</p>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  const base: React.CSSProperties = {
    background: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="only-desktop" style={{
        ...base, position: 'fixed', top: 0, left: 0, width: 240, height: '100vh',
        flexDirection: 'column', zIndex: 40,
      }}>
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile topbar */}
      <div className="only-mobile" style={{
        background: '#fff',
        borderBottom: '1px solid #E2E8F0',
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 40,
      }}>
        <Brand />
        <button
          onClick={() => setOpen(true)}
          style={{
            width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748B', background: '#F1F5F9', border: 'none', cursor: 'pointer',
          }}
        >
          <Menu size={17} />
        </button>
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 50,
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Mobile drawer */}
      <div style={{
        ...base, position: 'fixed', top: 0, left: 0, width: 260, height: '100%', zIndex: 51,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: open ? '8px 0 32px rgba(15,23,42,.1)' : 'none',
      }}>
        <NavContent pathname={pathname} onClose={() => setOpen(false)} />
      </div>
    </>
  )
}
