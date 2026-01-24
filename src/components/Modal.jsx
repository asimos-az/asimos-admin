import React from 'react'

import { X } from 'lucide-react'

export default function Modal({ open, title, onClose, children, footer }){
  if (!open) return null
  return (
    <div className="modalOverlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="modalCard" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <div className="modalTitle">{title}</div>
            <div className="modalSub">Dəyişiklikləri edin və yadda saxlayın</div>
          </div>
          <button className="iconBtn" onClick={onClose} aria-label="Bağla">
            <X size={18} />
          </button>
        </div>

        <div className="modalBody">{children}</div>

        {footer ? (
          <div className="modalFooter">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
