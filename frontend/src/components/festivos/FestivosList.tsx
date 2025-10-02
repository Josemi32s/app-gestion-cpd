// src/components/festivos/FestivosList.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  getFestivos,
  crearFestivo,
  actualizarFestivo,
} from "../../services/festivosApi";
import type { Festivo, FestivoCreate } from "../../types";
import Modal from "../ui/Modal";
import toast, { Toaster } from "react-hot-toast";

const FestivosList = () => {
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFestivo, setEditingFestivo] = useState<Festivo | null>(null);
  const [formData, setFormData] = useState<FestivoCreate>({
    dia_mes: "",
    descripcion: "",
    tipo: "Nacional",
    estado: "activo",
  });

  const [activeTab, setActiveTab] = useState<"activos" | "inactivos">("activos");
  const [filtroMes, setFiltroMes] = useState<string>("");
  const [busqueda, setBusqueda] = useState<string>("");

  useEffect(() => {
    cargarFestivos();
  }, []);

  const cargarFestivos = async () => {
    try {
      const data = await getFestivos();
      setFestivos(data);
    } catch (error) {
      toast.error("Error al cargar festivos");
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
        estado: festivo.estado,
      });
    } else {
      setEditingFestivo(null);
      setFormData({
        dia_mes: "",
        descripcion: "",
        tipo: "Nacional",
        estado: "activo",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de formato DD/MM
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])$/;
    if (!dateRegex.test(formData.dia_mes)) {
      toast.error("Formato de fecha debe ser DD/MM (ej: 01/01)");
      return;
    }

    try {
      if (editingFestivo) {
        await actualizarFestivo(editingFestivo.id, formData);
        toast.success("Festivo actualizado correctamente");
      } else {
        await crearFestivo({
          ...formData,
          estado: "activo",
        });
        toast.success("Festivo creado correctamente");
      }
      setShowModal(false);
      cargarFestivos();
    } catch (error: any) {
      const mensajeError =
        error.response?.data?.detail || "Error al guardar festivo";
      toast.error(mensajeError);
    }
  };

  const handleToggleEstado = async (festivo: Festivo) => {
    try {
      const nuevoEstado = festivo.estado === "activo" ? "inactivo" : "activo";
      await actualizarFestivo(festivo.id, { estado: nuevoEstado });
      toast.success(
        `Festivo ${
          nuevoEstado === "activo" ? "activado" : "desactivado"
        } correctamente`
      );
      cargarFestivos();
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  // ✅ Función para obtener nombre del mes (recibe número)
  const getMonthName = (monthIndex: number): string => {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return months[monthIndex - 1] || "";
  };

  // ✅ Función para comparar fechas DD/MM
  const sortByDate = (a: Festivo, b: Festivo): number => {
    const [dayA, monthA] = a.dia_mes.split("/").map(Number);
    const [dayB, monthB] = b.dia_mes.split("/").map(Number);
    const dateA = monthA * 100 + dayA; // Ej: 12/25 → 1225
    const dateB = monthB * 100 + dayB;
    return dateA - dateB;
  };

  // ✅ Filtro + búsqueda + orden
  const festivosFiltrados = useMemo(() => {
    return festivos
      .filter(f => activeTab === 'activos' ? f.estado === 'activo' : f.estado === 'inactivo')
      .filter(f => {
        if (!filtroMes) return true;
        const mesFestivo = f.dia_mes.split('/')[1];
        return mesFestivo === filtroMes;
      })
      .filter(f => {
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase();
        return f.descripcion.toLowerCase().includes(q) || f.dia_mes.includes(q);
      })
      .sort(sortByDate);
  }, [festivos, activeTab, filtroMes, busqueda]);

  // ✅ Agrupar por mes para layout en tarjetas
  const festivosPorMes = useMemo(() => {
    const map: Record<string, Festivo[]> = {};
    festivosFiltrados.forEach(f => {
      const mes = f.dia_mes.split('/')[1];
      if (!map[mes]) map[mes] = [];
      map[mes].push(f);
    });
    // ordenar internos
    Object.values(map).forEach(lista => lista.sort(sortByDate));
    // ordenar claves mes
    return Object.entries(map).sort((a,b) => Number(a[0]) - Number(b[0]));
  }, [festivosFiltrados]);

  if (loading) {
    return <div className="p-6">Cargando festivos...</div>;
  }

  return (
    <div className="w-full">
      <Toaster />
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Festivos Corporativos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Administración centralizada de festivos nacionales y regionales.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm shadow-sm transition"
          >
            <span className="text-lg leading-none">＋</span>
            Nuevo
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
            <button
              onClick={() => setActiveTab('activos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab==='activos' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
            >Activos ({festivos.filter(f=>f.estado==='activo').length})</button>
            <button
              onClick={() => setActiveTab('inactivos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab==='inactivos' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
            >Inactivos ({festivos.filter(f=>f.estado==='inactivo').length})</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mes</label>
            <select
              value={filtroMes}
              onChange={(e)=>setFiltroMes(e.target.value)}
              className="border border-gray-300 bg-white rounded-md px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value=''>Todos</option>
              {Array.from({length:12}, (_,i)=>{
                const m=i+1;
                return <option key={m} value={m.toString().padStart(2,'0')}>{getMonthName(m)}</option>
              })}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e)=>setBusqueda(e.target.value)}
              placeholder="Ej: Navidad, 01/01 ..."
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {busqueda && (
            <button
              onClick={()=>setBusqueda('')}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >Limpiar búsqueda</button>
          )}
        </div>
      </div>

      {/* Contenido */}
      {festivosFiltrados.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-sm text-gray-500 mb-4">No hay festivos {activeTab}{filtroMes && ' en el mes seleccionado'}.</p>
          <button
            onClick={()=>handleOpenModal()}
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm shadow-sm transition"
          >Crear festivo</button>
        </div>
      )}

      {festivosFiltrados.length > 0 && (
        <div className="space-y-8">
          {festivosPorMes.map(([mes, lista]) => (
            <div key={mes} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50 to-white border-b">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-600 text-xs font-bold">{mes}</span>
                  {getMonthName(Number(mes))}
                  <span className="text-xs font-normal text-gray-400">({lista.length} {lista.length===1?'festivo':'festivos'})</span>
                </h3>
                <div className="text-xs text-gray-400">{activeTab === 'activos' ? 'Activos' : 'Inactivos'}</div>
              </div>
              <ul className="divide-y divide-gray-100">
                {lista.map(f => (
                  <li key={f.id} className="group flex items-start gap-4 px-5 py-3 hover:bg-gray-50 transition">
                    <div className="flex flex-col items-center w-14 shrink-0">
                      <span className="text-lg font-semibold text-blue-600 leading-none">{f.dia_mes.split('/')[0]}</span>
                      <span className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">{f.dia_mes.split('/')[1]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-800">{f.descripcion}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${f.tipo === 'Nacional' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>{f.tipo}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${f.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{f.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
                      </div>
                      {/* ID oculto por solicitud del usuario. Si se requiere para debug se puede volver a mostrar o poner en tooltip. */}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenModal(f)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                      >Editar</button>
                      <button
                        onClick={() => handleToggleEstado(f)}
                        className={`text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 ${f.estado==='activo' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                      >{f.estado==='activo' ? 'Desactivar' : 'Activar'}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFestivo ? "Editar Festivo" : "Crear Nuevo Festivo"}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha (DD/MM) *
            </label>
            <input
              type="text"
              placeholder="01/01"
              autoFocus
              value={formData.dia_mes}
              onChange={(e) =>
                setFormData({ ...formData, dia_mes: e.target.value })
              }
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /* ✅ py-1.5 px-2.5 text-sm */
            />
            <p className="mt-1 text-[10px] text-gray-500">
              Formato: DD/MM (ej: 01/01)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción *
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Nacional">Nacional</option>
              <option value="Madrid">Madrid</option>
            </select>
          </div>
          {editingFestivo ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <input
                type="text"
                value="Activo"
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <input type="hidden" name="estado" value="activo" />
            </div>
          )}
          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-[11px] font-medium text-gray-700 hover:bg-gray-50" /* ✅ px-3 py-1.5 text-[11px] */
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 border border-transparent rounded-md text-[11px] font-medium text-white hover:bg-blue-700"
            >
              {editingFestivo ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default FestivosList;
