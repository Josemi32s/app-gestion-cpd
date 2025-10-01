// src/hooks/useUsuarios.ts
import { useState, useEffect, useMemo } from 'react';
import { api, getRoles } from '../services/api';
import type { Usuario, Rol } from '../types';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordenOriginalIds, setOrdenOriginalIds] = useState<number[]>([]);

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

  // ✅ Usamos useMemo para optimizar el reordenamiento
  const usuariosOrdenados = useMemo(() => {
    if (ordenOriginalIds.length === 0) return usuarios;

    // Crear un mapa para acceso O(1)
    const mapUsuarios = new Map(usuarios.map(u => [u.id, u]));
    const ordenados: Usuario[] = [];
    const idsYaAgregados = new Set<number>();

    // 1. Agregar usuarios en el orden original
    for (const id of ordenOriginalIds) {
      if (mapUsuarios.has(id)) {
        ordenados.push(mapUsuarios.get(id)!);
        idsYaAgregados.add(id);
      }
    }

    // 2. Agregar nuevos usuarios (que no estaban en el orden original) al final
    for (const usuario of usuarios) {
      if (!idsYaAgregados.has(usuario.id)) {
        ordenados.push(usuario);
        idsYaAgregados.add(usuario.id); // Evitar duplicados
      }
    }

    return ordenados;
  }, [usuarios, ordenOriginalIds]);

  return {
    usuarios: usuariosOrdenados, // ✅ Siempre en orden estable
    roles,
    loading,
    error,
    refetch
  };
};