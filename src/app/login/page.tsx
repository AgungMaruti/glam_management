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
    <div className="login-bg">
      <div className="login-card">
        {/* Logo */}
        <div className="login-header">
          <div className="login-logo">
            <Sparkles size={20} color="#fff" strokeWidth={2.2} />
          </div>
          <h1 className="login-title">Glam Suite</h1>
          <p className="login-subtitle">Masuk untuk kelola bisnis parfum kamu</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              className="login-input"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-password-wrap">
              <input
                className="login-input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPw(s => !s)}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            <LogIn size={16} />
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>Belum punya akun? Hubungi admin untuk buat akun baru.</p>
        </div>
      </div>

      <style jsx>{`
        .login-bg {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%);
          padding: 16px;
        }

        .login-card {
          width: 100%;
          max-width: 380px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(15,23,42,.08);
          border: 1px solid #E2E8F0;
          overflow: hidden;
        }

        .login-header {
          padding: 28px 28px 0;
          text-align: center;
        }

        .login-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          box-shadow: 0 2px 8px rgba(99,102,241,.3);
          margin: 0 auto 16px;
        }

        .login-title {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 4px;
          line-height: 1.2;
        }

        .login-subtitle {
          font-size: 13px;
          color: #94A3B8;
        }

        .login-form {
          padding: 24px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .login-error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #DC2626;
          font-weight: 600;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .login-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .login-input {
          width: 100%;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          color: #0F172A;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color .15s, box-shadow .15s, background .15s;
          box-sizing: border-box;
        }

        .login-input:focus {
          border-color: #6366F1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
        }

        .login-password-wrap {
          position: relative;
        }

        .login-password-wrap .login-input {
          padding-right: 40px;
        }

        .login-eye {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-btn {
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          border: none;
          background: #6366F1;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
          font-family: inherit;
          transition: opacity .15s;
        }

        .login-btn:disabled {
          opacity: .6;
          cursor: default;
        }

        .login-footer {
          background: #F8FAFC;
          padding: 14px 28px;
          border-top: 1px solid #F1F5F9;
          text-align: center;
        }

        .login-footer p {
          font-size: 12px;
          color: #94A3B8;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
