'use client'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmModal({ open, title, message, onClose, onConfirm }: ConfirmModalProps) {
  return (
    <Modal open={open} title={title} size="sm" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="danger"
            onClick={() => { onConfirm(); onClose() }}
            style={{ background: '#EF4444', color: '#fff', borderColor: '#EF4444' }}
          >
            Hapus
          </Button>
        </div>
      </div>
    </Modal>
  )
}
