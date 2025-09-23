// src/types/index.ts

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  usuario: string;
  cumple_anios: string | null;
  telefono: string | null;
  fecha_ingreso: string;
  fecha_salida: string | null;
  estado: string;
  rol_id: number;
}

export interface UsuarioCreate {
  nombres: string;
  apellidos: string;
  usuario: string;
  cumple_anios?: string | null;
  telefono?: string | null;
  fecha_ingreso: string;
  fecha_salida?: string | null;
  estado?: string;
  rol_id: number;
}

export interface Turno {
  id: number;
  usuario_id: number;
  fecha: string; // "YYYY-MM-DD"
  turno: string; // "M", "T", "N", "FM1", "v", "c", "b", etc.
  es_reten: boolean;
  generado_automático: boolean;
  modificado_manual: boolean;
  estado: string;
  created_at: string;
  updated_at: string;
}