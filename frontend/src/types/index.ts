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