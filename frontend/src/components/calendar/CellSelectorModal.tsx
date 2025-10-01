// src/components/calendar/CellSelectorModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import TabGroup from '../ui/TabGroup';
import TurnosTab from './TurnosTab';
import AusenciasTab from './AusenciasTab';
import type { Usuario } from '../../types';

interface CellSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  usuario: Usuario;
  fechasSeleccionadas: string[]; // Solo usado para TurnosTab y título
}

const CellSelectorModal: React.FC<CellSelectorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  usuario,
  fechasSeleccionadas
}) => {
  const [activeTab, setActiveTab] = useState<'turnos' | 'ausencias'>('turnos');

  const handleTabChange = (tabId: string) => {
    if (tabId === 'turnos' || tabId === 'ausencias') {
      setActiveTab(tabId as 'turnos' | 'ausencias');
    }
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

  // ✅ Mostrar rango en el título solo si hay múltiples días
  const getTitulo = () => {
    if (fechasSeleccionadas.length === 1) {
      return `Asignar a ${usuario.nombres} (${fechasSeleccionadas[0]})`;
    }
    const minFecha = fechasSeleccionadas.reduce((a, b) => a < b ? a : b);
    const maxFecha = fechasSeleccionadas.reduce((a, b) => a > b ? a : b);
    return `Asignar a ${usuario.nombres} (${minFecha} - ${maxFecha})`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitulo()}
    >
      <TabGroup
        tabs={[
          { id: 'turnos', label: 'Turnos' },
          { id: 'ausencias', label: 'Ausencias' }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="mt-4">
        {activeTab === 'turnos' && (
          <TurnosTab
            usuario={usuario}
            fechas={fechasSeleccionadas}
            onSuccess={handleSuccess}
          />
        )}
        {activeTab === 'ausencias' && (
          <AusenciasTab
            usuario={usuario}
            fechasSeleccionadas={fechasSeleccionadas}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </Modal>
  );
};

export default CellSelectorModal;