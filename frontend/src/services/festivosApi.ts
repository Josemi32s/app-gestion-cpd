// src/services/festivosApi.ts
import { api } from './api';
import type { Festivo, FestivoCreate } from '../types';

export const getFestivos = async (): Promise<Festivo[]> => {
  const response = await api.get<Festivo[]>('/festivos/');
  return response.data;
};

export const crearFestivo = async (festivo: FestivoCreate): Promise<Festivo> => {
  const response = await api.post<Festivo>('/festivos/', festivo);
  return response.data;
};

export const actualizarFestivo = async (id: number, festivo: Partial<Festivo>): Promise<Festivo> => {
  const response = await api.patch<Festivo>(`/festivos/${id}`, festivo);
  return response.data;
};