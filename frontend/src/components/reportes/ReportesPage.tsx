import React, { useState, useEffect, useMemo } from 'react';
import { useUsuarios } from '../../hooks/useUsuarios';
import type { Usuario } from '../../types';
import { 
  getReporteTrabajados, 
  getReporteTurnos, 
  getReporteFestivos, 
  getReporteVacaciones, 
  getReporteYears
} from '../../services/reportesApi';
import toast from 'react-hot-toast';

// ✅ Importaciones para gráficos
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

type ReporteType = 'trabajados' | 'turnos' | 'festivos' | 'vacaciones';

interface ReporteFiltros {
  year: number;
  month: number | null;
  usuarioId: number | null; // null = todos los usuarios
}

const ReportesPage: React.FC = () => {
  const { usuarios: allUsuarios, loading: loadingUsuarios } = useUsuarios();
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [filtros, setFiltros] = useState<ReporteFiltros>({
    year: new Date().getFullYear(),
    month: null,
    usuarioId: null // ✅ null = vista global
  });
  const [reporteData, setReporteData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Cargar usuarios al inicio (solo jefes y operadores activos)
  useEffect(() => {
    if (allUsuarios.length > 0) {
      const filtrados = allUsuarios.filter(u => 
        u.estado === 'activo' && (u.rol_id === 1 || u.rol_id === 2)
      );
      setUsuariosFiltrados(filtrados);
    }
  }, [allUsuarios]);

  // ✅ Años disponibles dinámicos desde backend
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await getReporteYears();
        const years = resp.data.sort((a,b) => a - b);
        setAvailableYears(years);
        // Ajustar año si el actual no está en la lista
        if (years.length > 0 && !years.includes(filtros.year)) {
            setFiltros(f => ({ ...f, year: years[years.length - 1] }));
        }
      } catch (e) {
        // fallback: mantener año actual único
        const y = new Date().getFullYear();
        setAvailableYears([y]);
        setFiltros(f => ({ ...f, year: y }));
      }
    })();
  }, []);

  const cargarReporte = async () => {
    setLoading(true);
    try {
      const requestData = {
        year: filtros.year,
        month: filtros.month || undefined,
        usuario_id: filtros.usuarioId || undefined // undefined = todos
      };

      let response;
      switch (activeTab) {
        case 'trabajados':
          response = await getReporteTrabajados(requestData);
          break;
        case 'turnos':
          response = await getReporteTurnos(requestData);
          break;
        case 'festivos':
          if (filtros.month === null) {
            toast.error('El reporte de festivos requiere un mes específico');
            return;
          }
          response = await getReporteFestivos(requestData);
          break;
        case 'vacaciones':
          response = await getReporteVacaciones(requestData);
          break;
        default:
          return;
      }
      
      setReporteData(response.data);
    } catch (error: any) {
      toast.error('Error al cargar el reporte: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<ReporteType>('trabajados');

  useEffect(() => {
    cargarReporte();
  }, [activeTab, filtros]);



  // ✅ Obtener nombre del usuario o "Todos"
  const nombreUsuario = useMemo(() => {
    if (filtros.usuarioId === null) return 'Todos los usuarios';
    const usuario = usuariosFiltrados.find(u => u.id === filtros.usuarioId);
    return usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'Selecciona un usuario';
  }, [filtros.usuarioId, usuariosFiltrados]);

  // ✅ Datos para gráficos (global o individual)
  const datosResumen = useMemo(() => {
    if (reporteData.length === 0) return null;

    let totalLaborables = 0;
    let totalFestivos = 0;
    let totalHoras = 0;

    reporteData.forEach(usuario => {
      const festivos = usuario.dias_festivos || 0;
      const laborables = (usuario.dias_trabajados_no_festivo !== undefined && usuario.dias_trabajados_no_festivo !== null)
        ? usuario.dias_trabajados_no_festivo
        : (usuario.dias_trabajados || 0) - festivos; // fallback si frontend todavía recibe respuesta antigua
      totalLaborables += laborables;
      totalFestivos += festivos;
      totalHoras += usuario.horas_trabajadas || 0;
    });

    return {
      laborables: totalLaborables,
      festivos: totalFestivos,
      totalDias: totalLaborables + totalFestivos,
      horas: totalHoras
    };
  }, [reporteData]);

  // ✅ Gráficos para Días Trabajados
  const graficoTrabajados = useMemo(() => {
    if (reporteData.length === 0) return null;
    // Solo mostrar donut en vista individual
    if (filtros.usuarioId === null) return null;
    const u = reporteData[0];
    const festivos = filtros.month ? (u.dias_festivos || 0) : 0;
    const laborables = (u.dias_trabajados_no_festivo !== undefined && u.dias_trabajados_no_festivo !== null)
      ? u.dias_trabajados_no_festivo
      : (u.dias_trabajados || 0) - festivos;
    return {
      labels: ['Días Laborables', 'Días Festivos'],
      datasets: [
        {
          data: [laborables, festivos],
            backgroundColor: ['#36A2EB', '#FF6384'],
            borderWidth: 2,
        },
      ],
    };
  }, [reporteData, filtros.usuarioId, filtros.month]);

  // 📊 Gráfico de barras por usuario (solo vista global)
  const graficoBarrasTrabajados = useMemo(() => {
    if (reporteData.length === 0 || filtros.usuarioId !== null) return null;
    const labels = reporteData.map(u => `${u.nombres.split(' ')[0]}`);
    const laborablesData = reporteData.map(u => (
      u.dias_trabajados_no_festivo !== undefined && u.dias_trabajados_no_festivo !== null
        ? u.dias_trabajados_no_festivo
        : (u.dias_trabajados || 0) - (u.dias_festivos || 0)
    ));
    const festivosData = filtros.month ? reporteData.map(u => u.dias_festivos || 0) : [];
    const datasets: any[] = [
      {
        label: 'Laborables',
        data: laborablesData,
        backgroundColor: '#36A2EB'
      }
    ];
    if (filtros.month) {
      datasets.push({
        label: 'Festivos',
        data: festivosData,
        backgroundColor: '#FF6384'
      });
    }
    return { labels, datasets };
  }, [reporteData, filtros.usuarioId, filtros.month]);

  // ===================== TURNOS (individual donut / global barras) =====================
  const graficoTurnosDonut = useMemo(() => {
    if (activeTab !== 'turnos' || reporteData.length === 0) return null;
    if (filtros.usuarioId === null) return null; // solo individual
    const u = reporteData[0];
    return {
      labels: ['Mañana', 'Tarde', 'Noche'],
      datasets: [{
        data: [u.mañana || 0, u.tarde || 0, u.noche || 0],
        backgroundColor: ['#36A2EB', '#FFCE56', '#FF6384'],
        borderWidth: 2
      }]
    };
  }, [activeTab, reporteData, filtros.usuarioId]);

  const graficoTurnosBar = useMemo(() => {
    if (activeTab !== 'turnos' || reporteData.length === 0) return null;
    if (filtros.usuarioId !== null) return null; // solo global
    const labels = reporteData.map(u => u.nombres.split(' ')[0]);
    const mañana = reporteData.map(u => u.mañana || 0);
    const tarde = reporteData.map(u => u.tarde || 0);
    const noche = reporteData.map(u => u.noche || 0);
    return {
      labels,
      datasets: [
        { label: 'Mañana', data: mañana, backgroundColor: '#36A2EB' },
        { label: 'Tarde', data: tarde, backgroundColor: '#FFCE56' },
        { label: 'Noche', data: noche, backgroundColor: '#FF6384' }
      ]
    };
  }, [activeTab, reporteData, filtros.usuarioId]);

  // ===================== FESTIVOS (individual donut / global barras) =====================
  const graficoFestivosDonut = useMemo(() => {
    if (activeTab !== 'festivos' || reporteData.length === 0) return null;
    if (filtros.usuarioId === null) return null; // solo individual
    const u = reporteData[0];
    const fechas = u.festivos_trabajados || [];
    if (!filtros.month || fechas.length === 0) return null;
    return {
      labels: fechas.map((f: string) => new Date(f).getDate().toString()),
      datasets: [{
        data: fechas.map(() => 1),
        backgroundColor: fechas.map(() => '#FF6384'),
        borderWidth: 1
      }]
    };
  }, [activeTab, reporteData, filtros.usuarioId, filtros.month]);

  // Eliminado gráfico de barras global para festivos: se mostrará solo detalle por día con usuarios y turnos

  // Listado detallado festivos global (día -> usuarios)
  const festivosDetalleLista = useMemo(() => {
    if (activeTab !== 'festivos' || reporteData.length === 0) return [];
    if (filtros.usuarioId !== null) return [];
    if (!filtros.month) return [];
    const registroGlobal = reporteData[0];
    const detalle = (registroGlobal?.festivos_detalle_dia || {}) as Record<string, string[]>;
    return Object.entries(detalle)
      .sort((a,b) => Number(a[0]) - Number(b[0]))
      .map(([dia, usuarios]) => ({ dia: Number(dia), usuarios: (usuarios || []) }));
  }, [activeTab, reporteData, filtros.usuarioId, filtros.month]);

  // ===================== VACACIONES (individual donut / global barras) =====================
  const graficoVacacionesDonut = useMemo(() => {
    if (activeTab !== 'vacaciones' || reporteData.length === 0) return null;
    if (filtros.usuarioId === null) return null; // solo individual
    const u = reporteData[0];
    const usados = (31 - (u.dias_restantes || 0));
    const restantes = (u.dias_restantes || 0);
    return {
      labels: ['Usados', 'Restantes'],
      datasets: [{
        data: [usados, restantes],
        backgroundColor: ['#FF6384', '#36A2EB'],
        borderWidth: 2
      }]
    };
  }, [activeTab, reporteData, filtros.usuarioId]);

  const graficoVacacionesBar = useMemo(() => {
    if (activeTab !== 'vacaciones' || reporteData.length === 0) return null;
    if (filtros.usuarioId !== null) return null; // solo global
    const labels = reporteData.map(u => u.nombres.split(' ')[0]);
    const usados = reporteData.map(u => 31 - (u.dias_restantes || 0));
    const restantes = reporteData.map(u => (u.dias_restantes || 0));
    return {
      labels,
      datasets: [
        { label: 'Usados', data: usados, backgroundColor: '#FF6384' },
        { label: 'Restantes', data: restantes, backgroundColor: '#36A2EB' }
      ]
    };
  }, [activeTab, reporteData, filtros.usuarioId]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Reportes</h1>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <select
              value={filtros.usuarioId || ''}
              onChange={(e) => setFiltros({
                ...filtros, 
                usuarioId: e.target.value ? Number(e.target.value) : null
              })}
              className="border border-gray-300 rounded px-3 py-2 w-full"
              disabled={loadingUsuarios}
            >
              <option value="">Todos los usuarios</option>
              {usuariosFiltrados.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombres} {usuario.apellidos}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select
              value={availableYears.includes(filtros.year) ? filtros.year : ''}
              onChange={(e) => setFiltros({...filtros, year: Number(e.target.value)})}
              className="border border-gray-300 rounded px-3 py-2 w-full"
            >
              {availableYears.length === 0 && (
                <option value="">Cargando...</option>
              )}
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <select
              value={filtros.month || ''}
              onChange={(e) => setFiltros({
                ...filtros, 
                month: e.target.value ? Number(e.target.value) : null
              })}
              className="border border-gray-300 rounded px-3 py-2 w-full"
            >
              <option value="">Todo el año</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mostrar nombre del usuario seleccionado */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-800">
          Reporte para: <span className="text-blue-900">{nombreUsuario}</span>
          {filtros.month && (
            <span className="text-blue-700 ml-2">
              - {new Date(filtros.year, filtros.month - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
          )}
        </h2>
      </div>

      {/* Tabs de reportes */}
      <div className="flex flex-wrap gap-1 bg-gray-200 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('trabajados')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
            activeTab === 'trabajados'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Días Trabajados
        </button>
        <button
          onClick={() => setActiveTab('turnos')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
            activeTab === 'turnos'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Turnos por Tipo
        </button>
        <button
          onClick={() => setActiveTab('festivos')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
            activeTab === 'festivos'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Festivos Trabajados
        </button>
        <button
          onClick={() => setActiveTab('vacaciones')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
            activeTab === 'vacaciones'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Vacaciones
        </button>
      </div>

      {/* Contenido de reportes - SOLO GRÁFICOS */}
      <div className="bg-white shadow-md rounded-lg p-6 min-h-[400px]">
        {loading || loadingUsuarios ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'trabajados' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Resumen de Actividad</h3>
                  <div className="flex justify-center space-x-8 mt-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">
                        {datosResumen?.laborables || 0}
                      </div>
                      <div className="text-gray-600">Días Laborables</div>
                    </div>
                    {filtros.month && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-red-600">
                          {datosResumen?.festivos || 0}
                        </div>
                        <div className="text-gray-600">Festivos Trabajados</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-indigo-600">
                        {datosResumen?.totalDias || 0}
                      </div>
                      <div className="text-gray-600">Total Días</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600">
                        {datosResumen?.horas || 0}
                      </div>
                      <div className="text-gray-600">Horas Trabajadas</div>
                    </div>
                  </div>
                </div>
                
                {graficoTrabajados && (
                  <div className="max-w-md mx-auto mt-8">
                    <Doughnut
                      data={graficoTrabajados}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' as const },
                          title: { display: true, text: 'Distribución de días' }
                        }
                      }}
                    />
                  </div>
                )}
                {graficoBarrasTrabajados && (
                  <div className="max-w-4xl mx-auto mt-12">
                    <h4 className="text-center font-medium text-gray-700 mb-4">Días por usuario</h4>
                    <Bar 
                      data={graficoBarrasTrabajados}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' as const },
                          title: { display: false }
                        },
                        scales: {
                          y: { beginAtZero: true, ticks: { stepSize: 1 } }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'turnos' && reporteData.length > 0 && (
              <div className="space-y-10">
                {graficoTurnosDonut && (
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">Turnos del Usuario</h3>
                    <Doughnut 
                      data={graficoTurnosDonut}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' as const },
                          title: { display: true, text: 'Distribución individual' }
                        }
                      }}
                    />
                  </div>
                )}
                {graficoTurnosBar && (
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">Turnos por Usuario</h3>
                    <Bar 
                      data={graficoTurnosBar}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' as const },
                          title: { display: false }
                        },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'festivos' && (
              <div className="space-y-10">
                <h3 className="text-lg font-medium text-gray-800 text-center">
                  Festivos Trabajados {filtros.month ? `en ${new Date(0, filtros.month - 1).toLocaleString('es-ES', { month: 'long' })}` : ''}
                </h3>
                {graficoFestivosDonut && (
                  <div className="max-w-md mx-auto">
                    <Doughnut 
                      data={graficoFestivosDonut}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' as const },
                          title: { display: true, text: 'Festivos del Usuario' }
                        }
                      }}
                    />
                  </div>
                )}
                {filtros.usuarioId === null && filtros.month && festivosDetalleLista.length > 0 && (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h5 className="text-center font-semibold text-gray-800 mb-4">Detalle por día festivo</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 text-gray-700">
                              <th className="px-3 py-2 text-left font-medium">Día</th>
                              <th className="px-3 py-2 text-left font-medium">Usuarios y turno</th>
                              <th className="px-3 py-2 text-left font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {festivosDetalleLista.map(f => (
                              <tr key={f.dia} className="border-b last:border-none hover:bg-gray-50">
                                <td className="px-3 py-2 font-semibold text-gray-800">{f.dia.toString().padStart(2,'0')}</td>
                                <td className="px-3 py-2 text-gray-700">
                                  <div className="flex flex-wrap gap-1">
                                    {f.usuarios.map(u => (
                                      <span key={u} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{u}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center font-medium text-gray-800">{f.usuarios.length}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {!graficoFestivosDonut && filtros.usuarioId === null && festivosDetalleLista.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {filtros.month ? 'Sin datos de festivos para este filtro' : 'Selecciona un mes'}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'vacaciones' && reporteData.length > 0 && (
              <div className="space-y-10">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Estado de Vacaciones</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 max-w-3xl mx-auto">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-gray-800">
                        {reporteData.reduce((sum, u) => sum + (u.vacaciones_tomadas || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-600">Vacaciones Tomadas</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-gray-800">
                        {reporteData.filter(u => u.cumpleaños_tomado).length} / {reporteData.length}
                      </div>
                      <div className="text-sm text-gray-600">Cumpleaños Tomados</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {reporteData.reduce((sum, u) => sum + (u.dias_restantes || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-600">Días Restantes Totales</div>
                    </div>
                  </div>
                </div>
                {graficoVacacionesDonut && (
                  <div className="max-w-md mx-auto">
                    <Doughnut 
                      data={graficoVacacionesDonut}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' as const },
                          title: { display: true, text: 'Uso de Vacaciones (Usuario)' }
                        }
                      }}
                    />
                  </div>
                )}
                {graficoVacacionesBar && (
                  <div className="max-w-4xl mx-auto">
                    <h4 className="text-center font-medium text-gray-700 mb-4">Vacaciones por Usuario</h4>
                    <Bar 
                      data={graficoVacacionesBar}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' as const },
                          title: { display: false }
                        },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {reporteData.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No hay datos para mostrar con los filtros seleccionados
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportesPage;