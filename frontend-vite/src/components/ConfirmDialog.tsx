import React from 'react'

interface Props {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title = 'Confirmar ação', description, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface shadow-lg">
        <div className="p-4 border-b border-border">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        {description && (
          <div className="p-4 text-sm text-gray-300">{description}</div>
        )}
        <div className="p-3 flex justify-end gap-2 border-t border-border">
          <button className="px-3 py-2 text-sm border border-border rounded-md" onClick={onCancel} autoFocus>{cancelText}</button>
          <button className="px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-600" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
