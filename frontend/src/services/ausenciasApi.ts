// src/services/ausenciasApi.ts
import { api } from './api';

export const crearAusencia = async (data: {
  usuario_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  descripcion: string;
}) => {
  const response = await api.post('/ausencias/', data);
  return response.data;
};

export const getAusenciasPorUsuarioYRango = async (usuarioId: number, fechaInicio: string, fechaFin: string) => {
  const response = await api.get(`/ausencias/usuario/${usuarioId}/rango?inicio=${fechaInicio}&fin=${fechaFin}`);
  return response.data;
};