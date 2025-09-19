// src/components/UserList.tsx
import React, { useEffect, useState } from 'react';
import { api, getRoles } from '../services/api';
import type{ Usuario, Rol } from '../types';
import UserForm from './UserForm';
import toast, { Toaster } from 'react-hot-toast';

const UserList = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get<Usuario[]>('/usuarios');
      setUsuarios(response.data);
    } catch (err: any) {
      setError('Error al cargar usuarios: ' + err.message);
      console.error(err);
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

  useEffect(() => {
    Promise.all([fetchUsuarios(), fetchRoles()]).finally(() => setLoading(false));
  }, []);

  // Obtener nombre real del rol desde la lista de roles
  const getRolNombre = (rolId: number) => {
    const rol = roles.find(r => r.id === rolId);
    return rol ? rol.nombre : 'Desconocido';
  };

  // Mapeo inteligente: cualquier variante → grupo estándar
  const mapearGrupo = (nombreRol: string): string => {
    const normalizado = nombreRol.toLowerCase().trim();

    if (normalizado.includes('jefe')) return 'Jefes de Turno';
    if (normalizado.includes('operador')) return 'Operador';
    if (normalizado.includes('emc')) return 'EMC';

    return 'Otros'; // Solo si no coincide con ninguno
  };

  // Grupos fijos en orden deseado
  const gruposOrdenados = ['Jefes de Turno', 'Operador', 'EMC'];

  // Agrupar usuarios
  const usuariosAgrupados = () => {
    const grupos: Record<string, Usuario[]> = {};

    // Inicializar grupos
    gruposOrdenados.forEach(grupo => {
      grupos[grupo] = [];
    });
    grupos['Otros'] = [];

    // Asignar cada usuario a un grupo
    usuarios.forEach(usuario => {
      const nombreRol = getRolNombre(usuario.rol_id);
      const grupo = mapearGrupo(nombreRol);
      grupos[grupo].push(usuario);
    });

    return grupos;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const handleUserCreated = () => {
    setShowForm(false);
    fetchUsuarios();
    toast.success('Usuario creado correctamente', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const grupos = usuariosAgrupados();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Toaster />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition"
        >
          + Nuevo Usuario
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p className="loading">Cargando usuarios y roles...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombres</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellidos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumple Años</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingreso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gruposOrdenados.map(grupo => {
                const usuariosDelGrupo = grupos[grupo] || [];
                if (usuariosDelGrupo.length === 0) return null;

                // Definir colores por grupo
                let bgColor = 'bg-blue-50';
                let textColor = 'text-blue-800';

                if (grupo === 'Operador') {
                  bgColor = 'bg-green-50';
                  textColor = 'text-green-800';
                } else if (grupo === 'EMC') {
                  bgColor = 'bg-purple-50';
                  textColor = 'text-purple-800';
                }

                return (
                  <React.Fragment key={grupo}>
                    {/* Separador de grupo */}
                    <tr className={bgColor}>
                      <td colSpan={9} className={`px-6 py-2 font-semibold ${textColor}`}>
                        {grupo} ({usuariosDelGrupo.length})
                      </td>
                    </tr>
                    {/* Usuarios del grupo */}
                    {usuariosDelGrupo.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getRolNombre(user.rol_id)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.nombres}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.apellidos}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.usuario}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.telefono || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.cumple_anios)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.fecha_ingreso)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.fecha_salida)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.estado === 'activo' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}

              {/* Mostrar "Otros" solo si hay usuarios no clasificados */}
              {grupos['Otros'].length > 0 && (
                <>
                  <tr className="bg-orange-50">
                    <td colSpan={9} className="px-6 py-2 font-semibold text-orange-800">
                      Otros ({grupos['Otros'].length})
                    </td>
                  </tr>
                  {grupos['Otros'].map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getRolNombre(user.rol_id)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.nombres}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.apellidos}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.usuario}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.telefono || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.cumple_anios)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.fecha_ingreso)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.fecha_salida)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.estado === 'activo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Crear Nuevo Usuario</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <UserForm 
              roles={roles} 
              onUserCreated={handleUserCreated} 
              onCancel={() => setShowForm(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;