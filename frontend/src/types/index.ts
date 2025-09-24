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
  fecha: string; 
  turno: string; 
  es_reten: boolean;
  generado_automático: boolean;
  modificado_manual: boolean;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface Ausencia {
  id: number;
  usuario_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  descripcion: string | null;
  created_at: string;
}