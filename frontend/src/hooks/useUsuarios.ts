// src/hooks/useUsuarios.ts
import { useState, useEffect } from 'react';
import { api, getRoles } from '../services/api';
import type{ Usuario, Rol } from '../types';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordenOriginalIds, setOrdenOriginalIds] = useState<number[]>([]); // ← IDs en orden de primera carga

  const fetchUsuarios = async () => {
    try {
      const response = await api.get<Usuario[]>('/usuarios');
      const nuevosUsuarios = response.data;

      // Solo establecemos ordenOriginalIds la PRIMERA VEZ
      if (ordenOriginalIds.length === 0) {
        setOrdenOriginalIds(nuevosUsuarios.map(u => u.id));
      }

      setUsuarios(nuevosUsuarios);
    } catch (err: any) {
      setError('Error al cargar usuarios: ' + err.message);
    }
  };

  const fetchRoles = async () => {
    try {
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (err: any) {
      console.error('Error al cargar roles:', err);
    }
  };

  const refetch = () => {
    setLoading(true);
    Promise.all([fetchUsuarios(), fetchRoles()]).finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();
  }, []);

  // Función que reordena los usuarios según el orden original
  const getUsuariosOrdenados = () => {
    if (ordenOriginalIds.length === 0) return usuarios;

    const mapUsuarios = new Map(usuarios.map(u => [u.id, u]));
    const ordenados: Usuario[] = [];

    for (const id of ordenOriginalIds) {
      if (mapUsuarios.has(id)) {
        ordenados.push(mapUsuarios.get(id)!);
      }
    }

    // Añadir usuarios nuevos que no estaban en el orden original (al final)
    for (const usuario of usuarios) {
      if (!ordenOriginalIds.includes(usuario.id)) {
        ordenados.push(usuario);
      }
    }

    return ordenados;
  };

  return {
    usuarios: getUsuariosOrdenados(), // ← SIEMPRE devolvemos en orden original
    roles,
    loading,
    error,
    refetch
  };
};