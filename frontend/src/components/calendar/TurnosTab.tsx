// src/components/calendar/TurnosTab.tsx
import React, { useState } from 'react';
import { asignarTurno } from '../../services/turnosApi';
import toast from 'react-hot-toast';
import type{ Usuario } from '../../types';

// ✅ Interfaz clave
interface TurnosTabProps {
  usuario: Usuario;
  fechas: string[];
  onSuccess: () => void;
}

const TurnosTab: React.FC<TurnosTabProps> = ({ usuario, fechas, onSuccess }) => {
  const [turno, setTurno] = useState('M');
  const [esReten, setEsReten] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      for (const fecha of fechas) {
        await asignarTurno({
          usuario_id: usuario.id,
          fecha,
          turno,
          es_reten: esReten
        });
      }
      toast.success(`✅ ${fechas.length} turnos asignados correctamente`);
      onSuccess();
    } catch (err: any) {
      toast.error('❌ Error al asignar turnos: ' + (err.message || 'Desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const turnos = [
    { value: 'M', label: 'M (Mañana)' },
    { value: 'T', label: 'T (Tarde)' },
    { value: 'N', label: 'N (Noche)' },
    { value: 'FM1', label: 'FM1 (Mañana Casa)' },
    { value: 'FM2', label: 'FM2 (Mañana Oficina)' },
    { value: 'FN1', label: 'FN1 (Noche Casa)' },
    { value: 'FN2', label: 'FN2 (Noche Oficina)' },
    { value: 'd', label: 'Descanso' }
  ];

  return (
    <div className="space-y-4">
      <div>
  <label className="block text-sm font-medium text-gray-700">Turno</label>
        <select
          value={turno}
          onChange={(e) => setTurno(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {turnos.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="reten"
          checked={esReten}
          onChange={(e) => setEsReten(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
  <label htmlFor="reten" className="ml-2 block text-sm text-gray-700">
          Marcar como Retén
        </label>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {loading ? 'Asignando...' : `Asignar a ${fechas.length} días`}
        </button>
      </div>
    </div>
  );
};

export default TurnosTab;