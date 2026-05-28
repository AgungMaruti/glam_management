'use client'
import { useRef, useCallback, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface SwipeableRowProps {
  children: React.ReactNode
  onDelete: () => void
}

const DELETE_W = 72
const THRESHOLD = DELETE_W * 0.45
const TAP_THRESHOLD = 10

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const dragX = useRef(0)
  const dragging = useRef(false)
  const open = useRef(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const snapTo = useCallback((target: number) => {
    if (!contentRef.current) return
    contentRef.current.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)'
    contentRef.current.style.transform = `translateX(${target}px)`
    dragX.current = target
    open.current = target < -THRESHOLD
  }, [])

  const handleDelete = useCallback(() => {
    open.current = false
    snapTo(0)
    onDelete()
  }, [onDelete, snapTo])

  const handleDown = useCallback((cx: number, cy: number) => {
    startX.current = cx
    startY.current = cy
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
      if (Math.abs(dx) < TAP_THRESHOLD && Math.abs(dy) < TAP_THRESHOLD) return
      if (Math.abs(dx) < Math.abs(dy)) return
      dragging.current = true
    }

    const base = open.current ? -DELETE_W : 0
    dragX.current = Math.max(-DELETE_W, Math.min(4, base + dx))
    contentRef.current.style.transform = `translateX(${dragX.current}px)`
  }, [])

  const handleUp = useCallback(() => {
    if (dragging.current) {
      snapTo(dragX.current < -THRESHOLD ? -DELETE_W : 0)
      dragging.current = false
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
        onTouchStartCapture={e => { e.stopPropagation(); handleDown(e.touches[0].clientX, e.touches[0].clientY) }}
        onTouchMoveCapture={e => { e.stopPropagation(); handleMove(e.touches[0].clientX, e.touches[0].clientY) }}
        onTouchEndCapture={e => { e.stopPropagation(); handleUp() }}
        onMouseDownCapture={e => { e.stopPropagation(); handleDown(e.clientX, e.clientY) }}
        onMouseMoveCapture={e => { e.stopPropagation(); handleMove(e.clientX, e.clientY) }}
        onMouseUpCapture={e => { e.stopPropagation(); handleUp() }}
        onMouseLeaveCapture={e => { e.stopPropagation(); handleUp() }}
        style={{ position: 'relative', touchAction: 'pan-y' }}
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
