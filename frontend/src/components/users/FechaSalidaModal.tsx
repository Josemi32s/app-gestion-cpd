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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha de Salida *
          </label>
          <input
            type="date"
            value={fechaSalida}
            onChange={(e) => setFechaSalida(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Confirmar
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FechaSalidaModal;