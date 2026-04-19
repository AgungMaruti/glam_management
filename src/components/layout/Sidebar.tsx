'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, FlaskConical, Boxes, Calculator, TrendingUp, Sparkles, Menu, X } from 'lucide-react'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produk & Varian', icon: FlaskConical },
  { href: '/inventory', label: 'Inventori', icon: Boxes },
  { href: '/rad', label: 'RAD & HPP', icon: Calculator },
  { href: '/cashflow', label: 'Cashflow', icon: TrendingUp },
]

const sidebarStyle: React.CSSProperties = {
  background: '#111827',
  borderRight: '1px solid rgba(255,255,255,0.06)',
}

function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      }}>
        <Sparkles size={15} color="#fff" />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Glam Suite</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Business Manager</p>
      </div>
    </div>
  )
}

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Brand />
        {onClose && (
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', background: 'none', border: 'none', display: 'flex' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', padding: '4px 10px 8px', textTransform: 'uppercase' }}>Menu</p>
        {nav.map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                transition: 'all 0.15s',
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? '#A5B4FC' : 'rgba(255,255,255,0.45)',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.8)' }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.45)' } }}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{item.label}</span>
                {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#6366F1' }} />}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px 20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>Perfume Business Suite</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 2 }}>v1.0 · 2026</p>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="only-desktop" style={{
        ...sidebarStyle,
        position: 'fixed', top: 0, left: 0, width: 256, height: '100vh',
        flexDirection: 'column', zIndex: 40,
      }}>
        <NavContent />
      </aside>

      {/* Mobile topbar */}
      <div className="only-mobile" style={{
        ...sidebarStyle,
        position: 'fixed', top: 0, left: 0, right: 0, height: 60,
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 40,
      }}>
        <Brand />
        <button
          onClick={() => setOpen(true)}
          style={{
            width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: 'none',
          }}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50 }}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              style={{ ...sidebarStyle, position: 'fixed', top: 0, left: 0, width: 280, height: '100%', zIndex: 51 }}
            >
              <NavContent onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
