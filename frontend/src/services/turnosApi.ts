// src/services/turnosApi.ts
import { api } from './api';
import type{ Turno } from '../types'; // ← IMPORTA LA INTERFAZ

export const getTurnosPorUsuarioYMes = async (usuarioId: number, year: number, month: number) => {
  const response = await api.get(`/turnos/usuario/${usuarioId}/mes/${year}/${month}`);
  return response.data;
};

export const asignarTurno = async (data: {
  usuario_id: number;
  fecha: string;
  turno: string;
  es_reten?: boolean;
}) => {
  const response = await api.post('/turnos/', data);
  return response.data;
};

export const actualizarTurno = async (id: number, data: Partial<Turno>) => {
  const response = await api.patch(`/turnos/${id}`, data);
  return response.data;
};