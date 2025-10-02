// src/components/users/UserActions.tsx
import { useState } from 'react';
import type { Usuario } from '../../types';
import UserEditForm from './UserEditForm';
import ConfirmationDialog from '../ui/ConfirmationDialog';
import { updateUsuario } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import FechaSalidaModal from './FechaSalidaModal';

interface UserActionsProps {
  usuario: Usuario;
  roles: any[];
  onUserUpdated: () => void;
}

const UserActions: React.FC<UserActionsProps> = ({ usuario, roles, onUserUpdated }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFechaSalidaModal, setShowFechaSalidaModal] = useState(false);
  const [fechaSalidaSeleccionada, setFechaSalidaSeleccionada] = useState<string | null>(null);

  // Solo actualizamos estado y fecha_salida, no todo el objeto
  const handleDesactivar = async () => {
    if (!fechaSalidaSeleccionada) {
      toast.error('❌ Debes seleccionar una fecha de salida');
      return;
    }

    try {
      await updateUsuario(usuario.id, {
        estado: 'inactivo',
        fecha_salida: fechaSalidaSeleccionada
      });
      toast.success('✅ Usuario desactivado correctamente');
      onUserUpdated();
    } catch (err: any) {
      toast.error('❌ Error al desactivar usuario: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleConfirmarFecha = (fecha: string) => {
    setFechaSalidaSeleccionada(fecha);
    setShowFechaSalidaModal(false);
    setShowDeleteConfirm(true); // Mostrar confirmación final
  };

  return (
    <>
      <div className="flex gap-1.5">
        <button
          onClick={() => setShowEditModal(true)}
          className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-gradient-to-br from-blue-50 to-white text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        >
          <svg className="w-3.5 h-3.5 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
          <span>Editar</span>
        </button>
        <button
          onClick={() => setShowFechaSalidaModal(true)}
          title="Definir fecha de salida"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-gradient-to-br from-rose-50 to-white text-rose-700 border border-rose-200 hover:from-rose-100 hover:to-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
        >
          <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 21c4.97 0 9-4.03 9-9"/><path d="M3 12c0 1.79.5 3.46 1.37 4.88M12 3c2.11 0 4.06.65 5.67 1.76M4.73 6.73 3 5m3.11 8.89 1.42-1.42M12 8v4"/></svg>
          <span>Desactivar</span>
        </button>
      </div>

      {/* Modal de Edición */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Usuario"
      >
        <UserEditForm
          usuario={usuario}
          roles={roles}
          onSave={() => {
            setShowEditModal(false);
            onUserUpdated();
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Modal para seleccionar fecha de salida */}
      <FechaSalidaModal
        isOpen={showFechaSalidaModal}
        onClose={() => setShowFechaSalidaModal(false)}
        onConfirm={handleConfirmarFecha}
      />

      {/* Diálogo de Confirmación FINAL */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setFechaSalidaSeleccionada(null);
        }}
        onConfirm={() => {
          handleDesactivar();
          setShowDeleteConfirm(false);
        }}
        title="Confirmar desactivación"
        message={`¿Estás seguro de que deseas desactivar a ${usuario.nombres} ${usuario.apellidos}? Se registrará la fecha de salida: ${fechaSalidaSeleccionada ? new Date(fechaSalidaSeleccionada).toLocaleDateString() : 'no definida'}.`}
        confirmText="Sí, desactivar"
      />
    </>
  );
};

export default UserActions;