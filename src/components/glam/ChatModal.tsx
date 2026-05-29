'use client'
import { useState, useRef, useEffect } from 'react'
import { chat } from '@/lib/glam-ai'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export default function ChatModal() {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!expanded) return
    const timer = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    return () => clearTimeout(timer)
  }, [messages, expanded])

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
    <div style={{ borderTop: '1px solid #F1F5F9' }}>
      <button onClick={() => setExpanded(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
          color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
        }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>🤖</span>
          AI CFO
        </span>
        <span style={{ fontSize: 11, color: '#94A3B8', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </button>

      {expanded && (
        <div style={{ height: 260, display: 'flex', flexDirection: 'column', borderTop: '1px solid #F1F5F9' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 8px', color: '#94A3B8', fontSize: 11, lineHeight: 1.6 }}>
                Tanya soal bisnis kamu di sini
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '90%', padding: '7px 10px', borderRadius: 10,
                  fontSize: 12, lineHeight: 1.5,
                  background: m.role === 'user' ? '#6366F1' : '#F1F5F9',
                  color: m.role === 'user' ? '#fff' : '#334155',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '7px 10px', borderRadius: 10, background: '#F1F5F9' }}>
                  <span style={{ display: 'inline-flex', gap: 2 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#94A3B8', animation: 'pulse 1s infinite' }} />
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#94A3B8', animation: 'pulse 1s infinite 0.2s' }} />
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#94A3B8', animation: 'pulse 1s infinite 0.4s' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '6px 8px 8px', display: 'flex', gap: 6, borderTop: '1px solid #F1F5F9' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="Tanya..."
              style={{ flex: 1, borderRadius: 8, border: '1px solid #E2E8F0', padding: '6px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={handleAsk} disabled={loading || !query.trim()}
              style={{ borderRadius: 8, border: 'none', background: '#6366F1', color: '#fff', padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (loading || !query.trim()) ? 0.5 : 1 }}>
              Kirim
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
