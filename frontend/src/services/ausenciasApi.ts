// src/services/ausenciasApi.ts
import { api } from './api';
import type { Ausencia } from '../types';

// ✅ CREAR AUSENCIA
export const crearAusencia = async (data: {
  usuario_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  descripcion?: string;
}) => {
  const response = await api.post<Ausencia>('/ausencias/', data);
  return response.data;
};