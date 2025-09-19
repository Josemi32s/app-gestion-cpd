// src/services/api.ts
import axios from 'axios';
import type { Rol } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Nueva función
export const getRoles = async () => {
  const response = await api.get<Rol[]>('/roles');
  return response.data;
};