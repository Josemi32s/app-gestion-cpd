// src/hooks/useTurnos.ts
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Turno } from '../types';

// Nueva función: cargar todos los turnos de un mes
export const getTurnosPorMes = async (year: number, month: number) => {
  const response = await api.get<Turno[]>(`/turnos/mes/${year}/${month}`);
  return response.data;
};

export const useTurnosPorMes = (year: number, month: number) => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTurnos = async () => {
    try {
      setLoading(true);
      const data = await getTurnosPorMes(year, month);
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