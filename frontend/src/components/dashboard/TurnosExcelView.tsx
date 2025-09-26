// src/components/dashboard/TurnosExcelView.tsx
import { useState, useMemo, useEffect } from 'react';
import { useUsuarios } from '../../hooks/useUsuarios';
import { useTurnosPorMes } from '../../hooks/useTurnos';
import CellSelectorModal from '../calendar/CellSelectorModal';
import { asignarCumpleanosMes } from '../../services/turnosApi';
import type { Usuario, Turno } from '../../types';

const getDaysOfMonth = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { day: number; date: string; isWeekend: boolean }[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
    days.push({ day, date: dateStr, isWeekend });
  }
  
  return days;
};

const getDayName = (dateString: string) => {
  const dayIndex = new Date(dateString).getDay();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return dayNames[dayIndex];
};

const TurnosExcelView = () => {
  const { usuarios, loading: loadingUsuarios } = useUsuarios();
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [selectedFechas, setSelectedFechas] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  
  // ✅ Estado para crosshair highlighting
  const [hoverUsuarioId, setHoverUsuarioId] = useState<number | null>(null);
  const [hoverFecha, setHoverFecha] = useState<string | null>(null);
  
  const availableYears = [2025];
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const { turnos, loading: loadingTurnos, refetch: refetchTurnos } = useTurnosPorMes(selectedYear, selectedMonth);

  useEffect(() => {
    const aplicarCumpleanosAuto = async () => {
      try {
        await asignarCumpleanosMes(selectedYear, selectedMonth);
        await refetchTurnos();
      } catch (err) {
        console.warn('No se pudieron asignar cumpleaños automáticos');
      }
    };
    
    aplicarCumpleanosAuto();
  }, [selectedYear, selectedMonth]);

  const turnosMap = useMemo(() => {
    const map = new Map<string, Map<number, Turno>>();
    turnos.forEach(turno => {
      if (!map.has(turno.fecha)) {
        map.set(turno.fecha, new Map());
      }
      map.get(turno.fecha)!.set(turno.usuario_id, turno);
    });
    return map;
  }, [turnos]);

  const handleCellSelect = (usuario: Usuario, fecha: string) => {
    setSelectedUsuario(usuario);
    setSelectedFechas([fecha]);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUsuario(null);
    setSelectedFechas([]);
  };

  const handleSuccess = () => {
    handleCloseModal();
    refetchTurnos();
  };

  const getCellColor = (turno: string | null, esReten: boolean) => {
    if (esReten) return 'bg-blue-200 border border-blue-400';
    if (!turno) return 'bg-white border border-gray-300';
    if (turno === 'v' || turno === 'c') return 'bg-yellow-100 border border-yellow-300';
    if (turno === 'd') return 'bg-gray-300 border border-gray-500 text-white';
    if (turno === 'b') return 'bg-red-200 border border-red-400';
    if (['FM1', 'FM2'].includes(turno)) return 'bg-orange-100 border border-orange-300';
    if (['FN1', 'FN2'].includes(turno)) return 'bg-purple-100 border border-purple-300';
    return 'bg-white border border-gray-300';
  };

  const days = getDaysOfMonth(selectedYear, selectedMonth);
  const usuariosActivos = usuarios.filter(u => u.estado === 'activo');

  const usuariosActivosPorGrupo = {
    jefes: usuariosActivos.filter(u => u.rol_id === 1),
    operadores: usuariosActivos.filter(u => u.rol_id === 2),
    emc: usuariosActivos.filter(u => u.rol_id === 3)
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => Math.max(2025, prev - 1));
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  if (loadingUsuarios || loadingTurnos) {
    return <div className="p-6">Cargando turnos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition"
          >
            ◄ Mes anterior
          </button>
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition"
          >
            Mes siguiente ►
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
  <tr>
    <th 
      scope="col" 
      className="border border-gray-300 px-2 py-2 bg-gray-100 text-center w-16"
      rowSpan={2}
    >
      <div className="transform -rotate-90 origin-center">
        Rol
      </div>
    </th>
    <th 
      scope="col" 
      className="border border-gray-300 px-2 py-2 bg-gray-100 text-center min-w-32"
      rowSpan={2}
    >
      Usuario
    </th>
    {days.map((day, index) => (
      <th 
        key={`num-${index}`} 
        scope="col" 
        className={`border border-gray-300 px-2 py-2 bg-gray-100 text-center w-12 ${
          hoverFecha === day.date ? 'highlight-column-header' : ''
        }`}
      >
        {day.day}
      </th>
    ))}
  </tr>
  <tr>
    {days.map((day, index) => {
      const isWeekend = day.isWeekend;
      return (
        <th 
          key={`name-${index}`} 
          scope="col" 
          className={`border border-gray-300 px-2 py-2 bg-gray-100 text-center w-12 ${
            isWeekend 
              ? 'text-red-600 font-bold' 
              : 'text-gray-500'
          } ${
            hoverFecha === day.date ? 'highlight-column-header' : ''
          }`}
        >
          <div className="text-xs font-medium">{getDayName(day.date)}</div>
        </th>
      );
    })}
  </tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
  {/* JEFES DE TURNO */}
  {usuariosActivosPorGrupo.jefes.length > 0 && (
    <>
      {usuariosActivosPorGrupo.jefes.map((usuario, index) => (
        <tr 
          key={usuario.id} 
          className={`
            hover:bg-gray-50 transition-colors
            ${hoverUsuarioId === usuario.id ? 'highlight-jefe-row' : ''}
          `}
        >
          {/* Celda de Rol (solo en la primera fila de cada grupo) */}
          {index === 0 && (
            <td 
              rowSpan={usuariosActivosPorGrupo.jefes.length} 
              className="border border-gray-300 px-1 py-1 text-sm font-bold text-gray-900 whitespace-nowrap text-center align-middle bg-blue-50"
            >
              <div className="transform -rotate-90 origin-center whitespace-nowrap text-blue-800">
                Jefes de Turno
              </div>
            </td>
          )}
          
          <td className="border border-gray-300 px-2 py-2 text-sm font-medium text-gray-900 whitespace-nowrap min-w-32">
            {usuario.nombres} {usuario.apellidos}
          </td>
          
          {days.map((day) => {
            const turnoObj = turnosMap.get(day.date)?.get(usuario.id);
            const turno = turnoObj ? turnoObj.turno : null;
            const esReten = turnoObj ? turnoObj.es_reten : false;
            
            return (
              <td
                key={`${usuario.id}-${day.date}`}
                className={`
                  border border-gray-300 px-2 py-2 text-center cursor-pointer text-xs font-bold
                  ${getCellColor(turno, esReten)}
                  ${hoverUsuarioId === usuario.id ? 'highlight-jefe-cell' : ''}
                  ${hoverFecha === day.date ? 'highlight-column' : ''}
                `}
                onClick={() => handleCellSelect(usuario, day.date)}
                onMouseEnter={() => {
                  setHoverUsuarioId(usuario.id);
                  setHoverFecha(day.date);
                }}
                onMouseLeave={() => {
                  setHoverUsuarioId(null);
                  setHoverFecha(null);
                }}
              >
                {turno || '-'}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  )}

  {/* OPERADORES */}
  {usuariosActivosPorGrupo.operadores.length > 0 && (
    <>
      {usuariosActivosPorGrupo.operadores.map((usuario, index) => (
        <tr 
          key={usuario.id} 
          className={`
            hover:bg-gray-50 transition-colors
            ${hoverUsuarioId === usuario.id ? 'highlight-operador-row' : ''}
          `}
        >
          {index === 0 && (
            <td 
              rowSpan={usuariosActivosPorGrupo.operadores.length} 
              className="border border-gray-300 px-1 py-1 text-center align-middle bg-green-50"
            >
              <div className="transform -rotate-90 origin-center whitespace-nowrap font-bold text-green-800">
                Operadores
              </div>
            </td>
          )}
          
          <td className="border border-gray-300 px-2 py-2 text-sm font-medium text-gray-900 whitespace-nowrap min-w-32">
            {usuario.nombres} {usuario.apellidos}
          </td>
          
          {days.map((day) => {
            const turnoObj = turnosMap.get(day.date)?.get(usuario.id);
            const turno = turnoObj ? turnoObj.turno : null;
            const esReten = turnoObj ? turnoObj.es_reten : false;
            
            return (
              <td
                key={`${usuario.id}-${day.date}`}
                className={`
                  border border-gray-300 px-2 py-2 text-center cursor-pointer text-xs font-bold
                  ${getCellColor(turno, esReten)}
                  ${hoverUsuarioId === usuario.id ? 'highlight-operador-cell' : ''}
                  ${hoverFecha === day.date ? 'highlight-column' : ''}
                `}
                onClick={() => handleCellSelect(usuario, day.date)}
                onMouseEnter={() => {
                  setHoverUsuarioId(usuario.id);
                  setHoverFecha(day.date);
                }}
                onMouseLeave={() => {
                  setHoverUsuarioId(null);
                  setHoverFecha(null);
                }}
              >
                {turno || '-'}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  )}

  {/* EMC */}
  {usuariosActivosPorGrupo.emc.length > 0 && (
    <>
      {usuariosActivosPorGrupo.emc.map((usuario, index) => (
        <tr 
          key={usuario.id} 
          className={`
            hover:bg-gray-50 transition-colors
            ${hoverUsuarioId === usuario.id ? 'highlight-emc-row' : ''}
          `}
        >
          {index === 0 && (
            <td 
              rowSpan={usuariosActivosPorGrupo.emc.length} 
              className="border border-gray-300 px-1 py-1 text-center align-middle bg-purple-50"
            >
              <div className="transform -rotate-90 origin-center whitespace-nowrap font-bold text-purple-800">
                EMC
              </div>
            </td>
          )}
          
          <td className="border border-gray-300 px-2 py-2 text-sm font-medium text-gray-900 whitespace-nowrap min-w-32">
            {usuario.nombres} {usuario.apellidos}
          </td>
          
          {days.map((day) => {
            const turnoObj = turnosMap.get(day.date)?.get(usuario.id);
            const turno = turnoObj ? turnoObj.turno : null;
            const esReten = turnoObj ? turnoObj.es_reten : false;
            
            return (
              <td
                key={`${usuario.id}-${day.date}`}
                className={`
                  border border-gray-300 px-2 py-2 text-center cursor-pointer text-xs font-bold
                  ${getCellColor(turno, esReten)}
                  ${hoverUsuarioId === usuario.id ? 'highlight-emc-cell' : ''}
                  ${hoverFecha === day.date ? 'highlight-column' : ''}
                `}
                onClick={() => handleCellSelect(usuario, day.date)}
                onMouseEnter={() => {
                  setHoverUsuarioId(usuario.id);
                  setHoverFecha(day.date);
                }}
                onMouseLeave={() => {
                  setHoverUsuarioId(null);
                  setHoverFecha(null);
                }}
              >
                {turno || '-'}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  )}
</tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && selectedUsuario && (
        <CellSelectorModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          usuario={selectedUsuario}
          fechasSeleccionadas={selectedFechas}
        />
      )}
    </div>
  );
};

export default TurnosExcelView;