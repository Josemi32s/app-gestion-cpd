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
  onSuccess?: () => void; // ← Esta prop es importante
  usuario: Usuario;
  fechasSeleccionadas: string[];
}

const CellSelectorModal: React.FC<CellSelectorModalProps> = ({
  isOpen,
  onClose,
  onSuccess, // ← Desestructuramos onSuccess
  usuario,
  fechasSeleccionadas
}) => {
  const [activeTab, setActiveTab] = useState<'turnos' | 'ausencias'>('turnos');

  const handleTabChange = (tabId: string) => {
    if (tabId === 'turnos' || tabId === 'ausencias') {
      setActiveTab(tabId);
    }
  };

  // ✅ Usamos onSuccess si existe, si no, usamos onClose
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignar a ${usuario.nombres} (${fechasSeleccionadas.length} días)`}
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
            onSuccess={handleSuccess} // ✅ Pasamos handleSuccess
          />
        )}
        {activeTab === 'ausencias' && (
          <AusenciasTab
            usuario={usuario}
            fechas={fechasSeleccionadas}
            onSuccess={handleSuccess} // ✅ Pasamos handleSuccess
          />
        )}
      </div>
    </Modal>
  );
};

export default CellSelectorModal;