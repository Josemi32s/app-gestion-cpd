// src/services/turnosApi.ts
import { api } from './api';
import type{ Turno } from '../types'; // ← IMPORTA LA INTERFAZ

export const getTurnosPorUsuarioYMes = async (usuarioId: number, year: number, month: number) => {
  const response = await api.get(`/turnos/usuario/${usuarioId}/mes/${year}/${month}`);
  return response.data;
};

// ✅ CREAR TURNO
export const asignarTurno = async (data: {
  usuario_id: number;
  fecha: string;
  turno: string;
  es_reten?: boolean;
}) => {
  const response = await api.post<Turno>('/turnos/', data);
  return response.data;
};

// ✅ ACTUALIZAR TURNO (si necesitas editar)
export const actualizarTurno = async (id: number, data: Partial<Turno>) => {
  const response = await api.patch<Turno>(`/turnos/${id}`, data);
  return response.data;
};

export const asignarCumpleanosMes = async (year: number, month: number) => {
  const response = await api.post(`/turnos/cumpleanos/mes/${year}/${month}`);
  return response.data;
};