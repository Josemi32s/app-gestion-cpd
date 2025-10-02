// src/components/users/FechaSalidaModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal';

interface FechaSalidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fecha: string) => void;
}

const FechaSalidaModal: React.FC<FechaSalidaModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [fechaSalida, setFechaSalida] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fechaSalida) {
      onConfirm(fechaSalida);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Fecha de Salida">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label htmlFor="fecha_salida" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Fecha de Salida <span className="text-pink-500">*</span>
          </label>
          <input
            id="fecha_salida"
            type="date"
            value={fechaSalida}
            onChange={(e) => setFechaSalida(e.target.value)}
            required
            className="block w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-[11px] text-slate-500">Esta fecha quedará registrada como salida oficial.</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-gradient-to-br from-blue-600 to-blue-500 text-sm font-semibold text-white shadow hover:from-blue-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
          >
            Confirmar
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FechaSalidaModal;