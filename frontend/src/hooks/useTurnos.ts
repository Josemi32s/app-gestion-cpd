// src/hooks/useTurnos.ts
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Turno } from '../types';

// ✅ Corregido: convierte month 0-11 → 1-12 antes de enviar al backend
export const getTurnosPorMes = async (year: number, monthZeroBased: number) => {
  const monthOneBased = monthZeroBased + 1; // 0-11 → 1-12
  const response = await api.get<Turno[]>(`/turnos/mes/${year}/${monthOneBased}`);
  return response.data;
};

export const useTurnosPorMes = (year: number, month: number) => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTurnos = async () => {
    try {
      setLoading(true);
      const data = await getTurnosPorMes(year, month); // month es 0-11 desde el componente
      setTurnos(data);
    } catch (err: any) {
      setError('Error al cargar turnos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnos();
  }, [year, month]);

  return {
    turnos,
    loading,
    error,
    refetch: fetchTurnos
  };
};