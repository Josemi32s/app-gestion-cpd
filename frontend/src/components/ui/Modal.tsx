// src/components/ui/Modal.tsx
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Si es true permite cerrar haciendo clic en el backdrop. Por defecto desactivado según nueva UX.
   */
  closeOnBackdropClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', closeOnBackdropClick = false }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-100 animate-fadeIn"
        {...(closeOnBackdropClick ? { onClick: onClose } : {})}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[92vh] animate-scaleIn overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white shadow-xl shadow-slate-300/40`}
        role="dialog" aria-modal="true" aria-labelledby="modal-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200/70 bg-white/85 px-6 py-4 backdrop-blur-sm">
          <h2 id="modal-title" className="text-lg md:text-xl font-semibold tracking-tight text-slate-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="group rounded-md p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="custom-scrollbar overflow-y-auto px-6 py-5 pb-8 text-slate-700">
          {children}
        </div>
      </div>
      <style>{`
        .animate-fadeIn{animation:fadeIn .18s ease-out;}
        .animate-scaleIn{animation:scaleIn .22s cubic-bezier(.16,.84,.44,1);}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
        .custom-scrollbar::-webkit-scrollbar{width:8px}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(100,116,139,.35);border-radius:4px}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(100,116,139,.55)}
      `}</style>
    </div>
  );
};

export default Modal;