// src/components/calendar/AusenciasTab.tsx
import React, { useState } from 'react';
import { asignarAusenciaRango } from '../../services/turnosApi';
import toast from 'react-hot-toast';
import type { Usuario } from '../../types';

interface AusenciasTabProps {
  usuario: Usuario;
  fechasSeleccionadas: string[]; // ✅ Recibe las fechas seleccionadas
  onSuccess: () => void;
}

const AusenciasTab: React.FC<AusenciasTabProps> = ({ 
  usuario, 
  fechasSeleccionadas, 
  onSuccess 
}) => {
  const [tipo, setTipo] = useState<'v' | 'b' | 'c'>('v');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // ✅ Calcula rango automáticamente desde fechasSeleccionadas
      const fechasOrdenadas = [...fechasSeleccionadas].sort();
      const fecha_inicio = fechasOrdenadas[0];
      const fecha_fin = fechasOrdenadas[fechasOrdenadas.length - 1];
      
      await asignarAusenciaRango(usuario.id, fecha_inicio, fecha_fin, tipo);
      toast.success(`✅ Ausencia '${tipo}' asignada del ${fecha_inicio} al ${fecha_fin}`);
      onSuccess();
    } catch (err: any) {
      const mensaje = err.response?.data?.detail || 'Error al asignar ausencia';
      toast.error(`❌ ${mensaje}`);
    } finally {
      setLoading(false);
    }
  };

  const tiposAusencia = [
    { value: 'v', label: 'Vacaciones (v)' },
    { value: 'b', label: 'Baja (b)' },
    { value: 'c', label: 'Cumpleaños (c)' }
  ];

  // ✅ Mostrar rango seleccionado
  const rangoTexto = fechasSeleccionadas.length === 1 
    ? fechasSeleccionadas[0]
    : `${fechasSeleccionadas[0]} - ${fechasSeleccionadas[fechasSeleccionadas.length - 1]}`;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-md">
        <p className="text-sm text-blue-800">
          Rango seleccionado: <strong>{rangoTexto}</strong>
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de ausencia</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {tiposAusencia.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Asignando...' : `Asignar Ausencia a ${fechasSeleccionadas.length} días`}
        </button>
      </form>
    </div>
  );
};

export default AusenciasTab;