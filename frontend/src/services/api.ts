// src/services/api.ts
import axios from 'axios';
import type { Rol } from '../types';
import type { Usuario, UsuarioCreate } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getRoles = async () => {
  const response = await api.get<Rol[]>('/roles');
  return response.data;
};

// NUEVAS FUNCIONES
export const updateUsuario = async (id: number, data: Partial<UsuarioCreate>) => {
  const response = await api.patch<Usuario>(`/usuarios/${id}`, data);
  return response.data;
};

export const deleteUsuario = async (id: number) => {
  await api.delete(`/usuarios/${id}`);
};