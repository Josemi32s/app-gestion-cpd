// src/components/users/UserActions.tsx
import { useState } from 'react';
import type { Usuario } from '../types';
import UserEditForm from './UserEditForm';
import ConfirmationDialog from './ui/ConfirmationDialog';
import { updateUsuario } from '../services/api';
import toast from 'react-hot-toast';
import Modal from './ui/Modal';
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
      <div className="flex space-x-2">
        <button
          onClick={() => setShowEditModal(true)}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
        >
          Editar
        </button>
        <button
          onClick={() => setShowFechaSalidaModal(true)}
          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
        >
          Desactivar
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