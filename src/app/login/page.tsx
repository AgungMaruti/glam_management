'use client'

import { useState } from 'react'
import { Sparkles, LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Email dan password wajib diisi')
      return
    }
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error === 'Invalid login credentials' 
        ? 'Email atau password salah' 
        : result.error
      )
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
      padding: 16,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(15,23,42,.08)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 28px 0',
          textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            boxShadow: '0 2px 8px rgba(99,102,241,.3)',
            margin: '0 auto 16px',
          }}>
            <Sparkles size={20} color="#fff" strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
            Glam Suite
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8' }}>
            Masuk untuk kelola bisnis parfum kamu
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: '#DC2626',
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={lbl}>Email</label>
            <input
              className="field"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label style={lbl}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="field"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 10,
              border: 'none',
              background: '#6366F1',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            <LogIn size={16} />
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
        </form>

        {/* Footer hint */}
        <div style={{
          background: '#F8FAFC',
          padding: '14px 28px',
          borderTop: '1px solid #F1F5F9',
          fontSize: 12,
          color: '#94A3B8',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          <p>Belum punya akun? Hubungi admin untuk buat akun baru.</p>
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }
