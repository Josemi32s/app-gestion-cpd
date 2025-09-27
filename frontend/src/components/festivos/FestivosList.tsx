// src/components/festivos/FestivosList.tsx
import React, { useState, useEffect } from 'react';
import { getFestivos, crearFestivo, actualizarFestivo } from '../../services/festivosApi';
import type { Festivo, FestivoCreate } from '../../types';
import Modal from '../ui/Modal';
import toast, { Toaster } from 'react-hot-toast';

const FestivosList = () => {
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFestivo, setEditingFestivo] = useState<Festivo | null>(null);
  const [formData, setFormData] = useState<FestivoCreate>({
    dia_mes: '',
    descripcion: '',
    tipo: 'Nacional',
    estado: 'activo'
  });
  
  const [activeTab, setActiveTab] = useState<'activos' | 'inactivos'>('activos');
  const [filtroMes, setFiltroMes] = useState<string>('');

  useEffect(() => {
    cargarFestivos();
  }, []);

  const cargarFestivos = async () => {
    try {
      const data = await getFestivos();
      setFestivos(data);
    } catch (error) {
      toast.error('Error al cargar festivos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (festivo?: Festivo) => {
    if (festivo) {
      setEditingFestivo(festivo);
      setFormData({
        dia_mes: festivo.dia_mes,
        descripcion: festivo.descripcion,
        tipo: festivo.tipo,
        estado: festivo.estado
      });
    } else {
      setEditingFestivo(null);
      setFormData({
        dia_mes: '',
        descripcion: '',
        tipo: 'Nacional',
        estado: 'activo'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de formato DD/MM
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])$/;
    if (!dateRegex.test(formData.dia_mes)) {
      toast.error('Formato de fecha debe ser DD/MM (ej: 01/01)');
      return;
    }
    
    try {
      if (editingFestivo) {
        await actualizarFestivo(editingFestivo.id, formData);
        toast.success('Festivo actualizado correctamente');
      } else {
        await crearFestivo({
          ...formData,
          estado: 'activo'
        });
        toast.success('Festivo creado correctamente');
      }
      setShowModal(false);
      cargarFestivos();
    } catch (error: any) {
      const mensajeError = error.response?.data?.detail || 'Error al guardar festivo';
      toast.error(mensajeError);
    }
  };

  const handleToggleEstado = async (festivo: Festivo) => {
    try {
      const nuevoEstado = festivo.estado === 'activo' ? 'inactivo' : 'activo';
      await actualizarFestivo(festivo.id, { estado: nuevoEstado });
      toast.success(`Festivo ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
      cargarFestivos();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  // ✅ Función para obtener nombre del mes (recibe número)
  const getMonthName = (monthIndex: number): string => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex - 1] || '';
  };

  // ✅ Función para comparar fechas DD/MM
  const sortByDate = (a: Festivo, b: Festivo): number => {
    const [dayA, monthA] = a.dia_mes.split('/').map(Number);
    const [dayB, monthB] = b.dia_mes.split('/').map(Number);
    const dateA = monthA * 100 + dayA; // Ej: 12/25 → 1225
    const dateB = monthB * 100 + dayB;
    return dateA - dateB;
  };

  // ✅ Aplicar filtros Y ordenamiento
  const festivosFiltrados = festivos
    .filter(festivo => 
      activeTab === 'activos' ? festivo.estado === 'activo' : festivo.estado === 'inactivo'
    )
    .filter(festivo => {
      if (!filtroMes) return true;
      const mesFestivo = festivo.dia_mes.split('/')[1];
      return mesFestivo === filtroMes;
    })
    .sort(sortByDate); // ✅ Ordenar por día/mes

  if (loading) {
    return <div className="p-6">Cargando festivos...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Festivos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition"
        >
          + Nuevo Festivo
        </button>
      </div>

      <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-4 w-fit">
        <button
          onClick={() => setActiveTab('activos')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            activeTab === 'activos'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Activos ({festivos.filter(f => f.estado === 'activo').length})
        </button>
        <button
          onClick={() => setActiveTab('inactivos')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            activeTab === 'inactivos'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Inactivos ({festivos.filter(f => f.estado === 'inactivo').length})
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por mes:</label>
        <select
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los meses</option>
          {Array.from({ length: 12 }, (_, i) => {
            const monthNum = i + 1;
            return (
              <option key={monthNum} value={monthNum.toString().padStart(2, '0')}>
                {getMonthName(monthNum)}
              </option>
            );
          })}
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {festivosFiltrados.length > 0 ? (
              festivosFiltrados.map(festivo => (
                <tr key={festivo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {festivo.dia_mes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {festivo.descripcion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {festivo.tipo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      festivo.estado === 'activo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {festivo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(festivo)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleEstado(festivo)}
                      className={`${
                        festivo.estado === 'activo' 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {festivo.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay festivos {activeTab} en {filtroMes ? `el mes seleccionado` : 'la lista'}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFestivo ? "Editar Festivo" : "Crear Nuevo Festivo"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha (DD/MM) *</label>
            <input
              type="text"
              placeholder="01/01"
              autoFocus
              value={formData.dia_mes}
              onChange={(e) => setFormData({...formData, dia_mes: e.target.value})}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Formato: DD/MM (ej: 01/01)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción *</label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo *</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Nacional">Nacional</option>
              <option value="Madrid">Madrid</option>
            </select>
          </div>
          
          {editingFestivo ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <input
                type="text"
                value="Activo"
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <input type="hidden" name="estado" value="activo" />
            </div>
          )}
          
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
            >
              {editingFestivo ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FestivosList;