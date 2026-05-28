'use client'
import { useRef, useCallback, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface SwipeableRowProps {
  children: React.ReactNode
  onDelete: () => void
}

const DELETE_W = 72
const THRESHOLD = DELETE_W * 0.38
const VELOCITY_THRESHOLD = 0.3

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const startTime = useRef(0)
  const dragX = useRef(0)
  const dragging = useRef(false)
  const open = useRef(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const snapTo = useCallback((target: number) => {
    if (!contentRef.current) return
    open.current = target < -THRESHOLD
    dragX.current = target
    contentRef.current.style.transition = 'transform 0.28s cubic-bezier(0.25, 0.8, 0.25, 1)'
    contentRef.current.style.transform = `translateX(${target}px)`
  }, [])

  const handleDelete = useCallback(() => {
    open.current = false
    snapTo(0)
    onDelete()
  }, [onDelete, snapTo])

  const handleDown = useCallback((cx: number, cy: number) => {
    startX.current = cx
    startY.current = cy
    startTime.current = Date.now()
    dragX.current = open.current ? -DELETE_W : 0
    dragging.current = false
    if (contentRef.current) {
      contentRef.current.style.transition = 'none'
      contentRef.current.style.transform = `translateX(${dragX.current}px)`
    }
  }, [])

  const handleMove = useCallback((cx: number, cy: number) => {
    if (!contentRef.current) return
    const dx = cx - startX.current
    const dy = cy - startY.current

    if (!dragging.current) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
      if (Math.abs(dx) < Math.abs(dy)) return
      dragging.current = true
    }

    const base = open.current ? -DELETE_W : 0
    dragX.current = Math.max(-DELETE_W - 12, Math.min(6, base + dx))
    contentRef.current.style.transform = `translateX(${dragX.current}px)`
  }, [])

  const handleUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false

    const elapsed = (Date.now() - startTime.current) / 1000
    const velocity = open.current
      ? (dragX.current + DELETE_W) / Math.max(elapsed, 0.01)
      : Math.abs(dragX.current) / Math.max(elapsed, 0.01)

    if (open.current) {
      if (dragX.current > -THRESHOLD || velocity > VELOCITY_THRESHOLD * 2) {
        snapTo(0)
      } else {
        snapTo(-DELETE_W)
      }
    } else {
      if (dragX.current < -THRESHOLD || velocity > VELOCITY_THRESHOLD) {
        snapTo(-DELETE_W)
      } else {
        snapTo(0)
      }
    }
  }, [snapTo])

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_W,
          background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 2, fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
          borderRadius: '0 12px 12px 0',
        }}
      >
        <Trash2 size={16} strokeWidth={2} />
        Hapus
      </button>

      <div
        ref={contentRef}
        onTouchStart={e => { e.stopPropagation(); handleDown(e.touches[0].clientX, e.touches[0].clientY) }}
        onTouchMove={e => { e.stopPropagation(); handleMove(e.touches[0].clientX, e.touches[0].clientY); if (dragging.current) e.preventDefault() }}
        onTouchEnd={e => { e.stopPropagation(); handleUp() }}
        onMouseDown={e => { e.stopPropagation(); handleDown(e.clientX, e.clientY) }}
        onMouseMove={e => { e.stopPropagation(); if (dragging.current) handleMove(e.clientX, e.clientY) }}
        onMouseUp={e => { e.stopPropagation(); handleUp() }}
        onMouseLeave={handleUp}
        style={{ position: 'relative', touchAction: 'pan-y', willChange: 'transform' }}
      >
        {children}
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Konfirmasi Hapus"
        message="Data yang dihapus tidak bisa dikembalikan. Lanjutkan?"
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
