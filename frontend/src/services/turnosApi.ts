// src/services/turnosApi.ts
import { api } from './api';
import type { Turno } from '../types';

// ✅ NUEVO: usa /turnos/asignar para evitar duplicados
export const asignarTurno = async (data: {
  usuario_id: number;
  fecha: string;
  turno: string;
  es_reten?: boolean;
}) => {
  const response = await api.post<Turno>('/turnos/asignar', data);
  return response.data;
};

// ✅ Corregido: convierte month 0-11 → 1-12 antes de enviar
export const getTurnosPorMes = async (year: number, monthZeroBased: number) => {
  const monthOneBased = monthZeroBased + 1; // 0-11 → 1-12
  const response = await api.get<Turno[]>(`/turnos/mes/${year}/${monthOneBased}`);
  return response.data;
};

// ✅ Corregido: mismo ajuste para cumpleaños
export const asignarCumpleanosMes = async (year: number, monthZeroBased: number) => {
  const monthOneBased = monthZeroBased + 1;
  const response = await api.post(`/turnos/cumpleanos/mes/${year}/${monthOneBased}`);
  return response.data;
};

export const asignarAusenciaRango = async (
  usuario_id: number,
  fecha_inicio: string, // "YYYY-MM-DD"
  fecha_fin: string,    // "YYYY-MM-DD"
  tipo: 'v' | 'b' | 'c'
) => {
  // ✅ Envía un objeto con los campos esperados por el esquema
  const response = await api.post('/turnos/ausencia/rango', {
    usuario_id,
    fecha_inicio,
    fecha_fin,
    tipo
  });
  return response.data;
};