'use client'
import { useState, useRef, useEffect } from 'react'
import { chat } from '@/lib/glam-ai'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

const STORAGE_KEY = 'glam-ai-cfo-history'

export default function AICFOPage() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { setMessages(JSON.parse(saved)) } catch { }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [messages])

  async function handleAsk() {
    if (!query.trim() || loading) return
    const userMsg: Message = { role: 'user', text: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setLoading(true)
    try {
      const res = await chat(query)
      setMessages(prev => [...prev, { role: 'assistant', text: res.answer || 'Maaf, tidak ada jawaban.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Gagal terhubung ke Glam AI.' }])
    }
    setLoading(false)
  }

  return (
    <div className="page-sections" style={{ padding: 0, gap: 0, minHeight: 'calc(100dvh - 64px)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>AI CFO</h1>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>Tanya apapun tentang bisnis kamu</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); localStorage.removeItem(STORAGE_KEY); }}
            style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6 }}>
            Hapus Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700, margin: '0 auto', width: '100%' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Halo! Ada yang bisa dibantu?</p>
            <p style={{ fontSize: 13, marginBottom: 28 }}>Analisis bisnis kamu dalam hitungan detik</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320, margin: '0 auto' }}>
              {[
                'Berapa profit bulan ini?',
                'Kas saya sekarang berapa?',
                'Stok apa yang hampir habis?',
                'Varian mana paling laku?',
                'Rekomendasi harga jual?',
              ].map(q => (
                <button key={q} onClick={() => setQuery(q)}
                  style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background .15s' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: '70%', padding: '12px 16px', borderRadius: 14,
              fontSize: 14, lineHeight: 1.7,
              background: m.role === 'user' ? '#6366F1' : '#F1F5F9',
              color: m.role === 'user' ? '#fff' : '#334155',
              whiteSpace: 'pre-wrap',
              borderBottomRightRadius: m.role === 'user' ? 4 : 14,
              borderBottomLeftRadius: m.role === 'assistant' ? 4 : 14,
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🤖</div>
            <div style={{ padding: '12px 16px', borderRadius: 14, background: '#F1F5F9', borderBottomLeftRadius: 4 }}>
              <span style={{ display: 'inline-flex', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#94A3B8', animation: 'pulse 1s infinite' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#94A3B8', animation: 'pulse 1s infinite 0.2s' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#94A3B8', animation: 'pulse 1s infinite 0.4s' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid #F1F5F9', padding: '16px 24px', maxWidth: 700, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Tanya apapun tentang bisnis kamu..."
            style={{ flex: 1, borderRadius: 12, border: '1.5px solid #E2E8F0', padding: '11px 16px', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s' }}
            onFocus={e => e.target.style.borderColor = '#6366F1'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
          <button onClick={handleAsk} disabled={loading || !query.trim()}
            style={{ borderRadius: 12, border: 'none', background: '#6366F1', color: '#fff', padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (loading || !query.trim()) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            Kirim →
          </button>
        </div>
      </div>
    </div>
  )
}
