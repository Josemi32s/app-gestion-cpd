// src/components/ui/ConfirmationDialog.tsx
import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Permitir cerrar clicando fuera. Por defecto false para requerir acción explícita. */
  closeOnBackdropClick?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Sí, desactivar",
  cancelText = "Cancelar",
  closeOnBackdropClick = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" {...(closeOnBackdropClick ? { onClick: onClose } : {})} />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white shadow-xl shadow-slate-300/40 animate-scaleIn">
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-lg font-semibold mb-2 text-slate-800 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600">!</span>
            {title}
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap break-words">
            {message}
          </p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              className="inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-md bg-gradient-to-br from-rose-600 to-rose-500 text-white text-sm font-semibold shadow hover:from-rose-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-60 transition"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}} .animate-scaleIn{animation:scaleIn .22s cubic-bezier(.16,.84,.44,1);}`}</style>
    </div>
  );
};

export default ConfirmationDialog;