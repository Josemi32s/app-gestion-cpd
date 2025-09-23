// src/components/calendar/AusenciasTab.tsx
import React, { useState } from 'react';
import { crearAusencia } from '../../services/ausenciasApi';
import toast from 'react-hot-toast';
import type{ Usuario } from '../../types';

// ✅ Interfaz clave que define las props
interface AusenciasTabProps {
  usuario: Usuario;
  fechas: string[];
  onSuccess: () => void;
}

const AusenciasTab: React.FC<AusenciasTabProps> = ({ usuario, fechas, onSuccess }) => {
  const [tipo, setTipo] = useState('v');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (fechas.length === 0) return;

    setLoading(true);
    try {
      const fechaInicio = fechas[0];
      const fechaFin = fechas[fechas.length - 1];

      await crearAusencia({
        usuario_id: usuario.id,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        tipo,
        descripcion: descripcion || `Ausencia tipo ${tipo}`
      });

      toast.success(`✅ Ausencia registrada para ${fechas.length} días`);
      onSuccess();
    } catch (err: any) {
      toast.error('❌ Error al registrar ausencia: ' + (err.message || 'Desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const tipos = [
    { value: 'v', label: 'Vacaciones' },
    { value: 'b', label: 'Baja médica' },
    { value: 'c', label: 'Cumpleaños' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo de Ausencia</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {tipos.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ej: Vacaciones anuales"
        />
      </div>

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Registrando...' : `Registrar ausencia para ${fechas.length} días`}
        </button>
      </div>
    </div>
  );
};

export default AusenciasTab;