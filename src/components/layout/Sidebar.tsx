'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FlaskConical, Boxes, Calculator, TrendingUp, Sparkles, Menu, X, ShoppingCart, LogOut, MessageSquare } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produk & Varian', icon: FlaskConical },
  { href: '/inventory', label: 'Inventori', icon: Boxes },
  { href: '/rad', label: 'RAD & HPP', icon: Calculator },
  { href: '/cashflow', label: 'Cashflow', icon: TrendingUp },
  { href: '/pricing', label: 'Kalkulator Harga', icon: ShoppingCart },
  { href: '/ai-cfo', label: 'AI CFO', icon: MessageSquare },
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
  const { user, logout } = useAuth()
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
                    ;(e.currentTarget as HTMLDivElement).style.color = '#334555'
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
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User & Footer */}
      <div className="sidebar-footer" style={{ padding: '8px 16px 16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ height: 1, background: '#F1F5F9', marginBottom: 12 }} />
        
        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 10px' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#EEF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#6366F1',
            flexShrink: 0,
          }}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'User'}
            </p>
            <p style={{ fontSize: 10, color: '#94A3B8' }}>{user?.email || ''}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 8,
            border: 'none',
            background: '#FEF2F2',
            color: '#DC2626',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <LogOut size={14} />
          Keluar
        </button>

        <p style={{ fontSize: 11, color: '#CBD5E1', padding: '10px 10px 0', textAlign: 'center' }}>Perfume Suite · v1.0 · 2026</p>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // eslint-disable-next-line react-hooks/set-state-in-effect
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
        paddingTop: 'env(safe-area-inset-top, 0px)',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px 0 16px', zIndex: 40,
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
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 50,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Mobile drawer */}
      {open && (
        <div style={{
          ...base, position: 'fixed', top: 0, left: 0, width: 260, height: '100%', zIndex: 51, overflowY: 'auto',
          boxShadow: '8px 0 32px rgba(15,23,42,.1)',
        }}>
          <NavContent pathname={pathname} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
