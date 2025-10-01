// src/components/UserList.tsx
import React, { useState } from 'react';
import { useUsuarios } from '../../hooks/useUsuarios';
import UserForm from './UserForm';
import UserActions from './UserActions';
import toast, { Toaster } from 'react-hot-toast';
import Modal from '../ui/Modal';
import { updateUsuario } from '../../services/api';

const UserList = () => {
  const { usuarios: allUsuarios, roles, loading, error, refetch } = useUsuarios();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'activos' | 'inactivos'>('activos');

  // Filtrar usuarios según pestaña (sin reordenar, mantienen orden original)
  const usuariosFiltrados = allUsuarios.filter(user => 
    activeTab === 'activos' ? user.estado === 'activo' : user.estado === 'inactivo'
  );

  const handleUserCreatedOrUpdated = () => {
    refetch();
  };

  // Función para activar usuario
  const handleActivarUsuario = async (usuarioId: number) => {
    try {
      await updateUsuario(usuarioId, { estado: 'activo' });
      toast.success('Usuario activado correctamente');
      refetch();
    } catch (err: any) {
      toast.error('❌ Error al activar usuario: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Mapeo de grupos (manteniendo tu lógica)
  const mapearGrupo = (nombreRol: string): string => {
    const normalizado = nombreRol.toLowerCase().trim();
    if (normalizado.includes('jefe')) return 'Jefes de Turno';
    if (normalizado.includes('operador')) return 'Operador';
    if (normalizado.includes('emc')) return 'EMC';
    return 'Otros';
  };

  const gruposOrdenados = ['Jefes de Turno', 'Operador', 'EMC'];

  const usuariosAgrupados = () => {
    const grupos: Record<string, any[]> = {};
    gruposOrdenados.forEach(grupo => grupos[grupo] = []);
    grupos['Otros'] = [];

    usuariosFiltrados.forEach(usuario => {
      const nombreRol = roles.find(r => r.id === usuario.rol_id)?.nombre || 'Desconocido';
      const grupo = mapearGrupo(nombreRol);
      grupos[grupo].push(usuario);
    });

    return grupos;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const grupos = usuariosAgrupados();

  return (
    <div className="w-full"> {/* ✅ max-w-6xl en lugar de max-w-screen-xl */}
      <Toaster />

      <div className="flex justify-between items-center mb-4"> {/* ✅ mb-4 en lugar de mb-6 */}
        <h1 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h1> {/* ✅ text-xl en lugar de text-2xl */}
        {activeTab === 'activos' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition"
          >
            + Nuevo Usuario
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-4 w-fit"> {/* ✅ mb-4 */}
        <button
          onClick={() => setActiveTab('activos')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${ /* ✅ px-3 py-1 text-xs */
            activeTab === 'activos'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Activos ({allUsuarios.filter(u => u.estado === 'activo').length})
        </button>
        <button
          onClick={() => setActiveTab('inactivos')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${ /* ✅ px-3 py-1 text-xs */
            activeTab === 'inactivos'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Inactivos ({allUsuarios.filter(u => u.estado === 'inactivo').length})
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p className="loading">Cargando...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="w-full overflow-x-hidden"> {/* ✅ Elimina scroll horizontal */}
            <table className="w-full"> {/* ✅ w-full + table-fixed */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Rol</th> {/* ✅ px-2 py-2 text-[10px] */}
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Nombres</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Apellidos</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Cumple</th> {/* ✅ "Cumple" en lugar de "Cumple Años" */}
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Ingreso</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Salida</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gruposOrdenados.map(grupo => {
                  const usuariosDelGrupo = grupos[grupo] || [];
                  if (usuariosDelGrupo.length === 0) return null;

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
                      <tr className={bgColor}>
                        <td colSpan={10} className={`px-2 py-1 font-semibold text-[11px] ${textColor}`}> {/* ✅ px-2 py-1 text-[11px] */}
                          {grupo} ({usuariosDelGrupo.length})
                        </td>
                      </tr>
                      {usuariosDelGrupo.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-900"> {/* ✅ px-2 py-2 text-[11px] */}
                            {roles.find(r => r.id === user.rol_id)?.nombre || 'Desconocido'}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-[11px] font-medium text-gray-900">{user.nombres}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{user.apellidos}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{user.usuario}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{user.telefono || '-'}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{formatDate(user.cumple_anios)}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{formatDate(user.fecha_ingreso)}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{formatDate(user.fecha_salida)}</td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 text-[10px] leading-4 font-semibold rounded-full ${ /* ✅ px-1.5 py-0.5 text-[10px] */
                              user.estado === 'activo' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            {activeTab === 'activos' ? (
                              <UserActions
                                usuario={user}
                                roles={roles}
                                onUserUpdated={handleUserCreatedOrUpdated}
                              />
                            ) : (
                              <button
                                onClick={() => handleActivarUsuario(user.id)}
                                className="px-2 py-0.5 bg-green-600 text-white text-[10px] rounded hover:bg-green-700 transition" /* ✅ px-2 py-0.5 text-[10px] */
                              >
                                Activar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                {grupos['Otros'].length > 0 && (
                  <>
                    <tr className="bg-orange-50">
                      <td colSpan={10} className="px-2 py-1 font-semibold text-orange-800 text-[11px]">
                        Otros ({grupos['Otros'].length})
                      </td>
                    </tr>
                    {grupos['Otros'].map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-900">
                          {roles.find(r => r.id === user.rol_id)?.nombre || 'Desconocido'}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-[11px] font-medium text-gray-900">{user.nombres}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{user.apellidos}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{user.usuario}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{user.telefono || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{formatDate(user.cumple_anios)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{formatDate(user.fecha_ingreso)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500">{formatDate(user.fecha_salida)}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 text-[10px] leading-4 font-semibold rounded-full ${
                            user.estado === 'activo' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {activeTab === 'activos' ? (
                            <UserActions
                              usuario={user}
                              roles={roles}
                              onUserUpdated={handleUserCreatedOrUpdated}
                            />
                          ) : (
                            <button
                              onClick={() => handleActivarUsuario(user.id)}
                              className="px-2 py-0.5 bg-green-600 text-white text-[10px] rounded hover:bg-green-700 transition"
                            >
                              Activar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear Usuario */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Crear Nuevo Usuario"
      >
        <UserForm
          roles={roles}
          onUserCreated={() => {
            setShowCreateForm(false);
            handleUserCreatedOrUpdated();
            toast.success('Usuario creado correctamente');
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      </Modal>
    </div>
  );
};

export default UserList;