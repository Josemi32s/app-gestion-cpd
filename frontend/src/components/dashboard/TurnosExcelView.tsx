// src/components/dashboard/TurnosExcelView.tsx
import { useState, useMemo } from 'react';
import { useUsuarios } from '../../hooks/useUsuarios';
import { useTurnosPorMes } from '../../hooks/useTurnos'; // ← NUEVO
import CellSelectorModal from '../calendar/CellSelectorModal';
import type { Usuario, Turno } from '../../types'; // ← Añadido Turno

// ✅ Solo los días del mes actual (sin días de otros meses)
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

// ✅ Obtener nombre del día de la semana (en español, empezando por lunes)
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
  
  // Solo 2025 por ahora (hasta que haya datos en otros años)
  const availableYears = [2025];
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // ✅ Cargar turnos del mes
  const { turnos, loading: loadingTurnos, refetch: refetchTurnos } = useTurnosPorMes(selectedYear, selectedMonth);

  // ✅ Crear mapa: fecha → usuarioId → turno
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

  // ✅ Callback para actualizar la vista después de asignar un turno
  const handleSuccess = () => {
    handleCloseModal();
    refetchTurnos(); // Recargar turnos
  };

  const getCellColor = (turno: string | null, isWeekend: boolean) => {
    if (!turno) return 'bg-white border border-gray-300';

    if (turno === 'v' || turno === 'c') return 'bg-yellow-100 border border-yellow-300';
    if (turno === 'd' || turno === 'b') return 'bg-gray-200 border border-gray-400';
    if (['FM1', 'FM2', 'FN1', 'FN2'].includes(turno)) return 'bg-orange-100 border border-orange-300';
    if (isWeekend) return 'bg-red-100 border border-red-300';
    
    return 'bg-white border border-gray-300';
  };

  const days = getDaysOfMonth(selectedYear, selectedMonth);
  const usuariosActivos = usuarios.filter(u => u.estado === 'activo');

  // Manejar navegación de meses
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
      {/* Selector de año y mes + navegación */}
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
                  {/* Números de día */}
                  <th scope="col" className="border border-gray-300 px-2 py-2 bg-gray-100"></th>
                  {days.map((day, index) => (
                    <th key={`num-${index}`} scope="col" className="border border-gray-300 px-2 py-2 bg-gray-100 text-center w-12">
                      {day.day}
                    </th>
                  ))}
                </tr>
                <tr>
                  {/* Nombres de día */}
                  <th scope="col" className="border border-gray-300 px-2 py-2 bg-gray-100 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  {days.map((day, index) => (
                    <th key={`name-${index}`} scope="col" className="border border-gray-300 px-2 py-2 bg-gray-100 text-center w-12">
                      <div className="text-xs font-medium text-gray-500">{getDayName(day.date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosActivos.map(usuario => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {usuario.nombres} {usuario.apellidos}
                    </td>
                    {days.map((day) => {
                      // ✅ Obtener turno real del mapa
                      const turnoObj = turnosMap.get(day.date)?.get(usuario.id);
                      const turno = turnoObj ? turnoObj.turno : null;
                      
                      return (
                        <td
                          key={`${usuario.id}-${day.date}`}
                          className={`border border-gray-300 px-2 py-2 text-center cursor-pointer text-xs font-bold ${getCellColor(turno, day.isWeekend)}`}
                          onClick={() => handleCellSelect(usuario, day.date)}
                        >
                          {turno || '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && selectedUsuario && (
        <CellSelectorModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess} // ← Añadido
          usuario={selectedUsuario}
          fechasSeleccionadas={selectedFechas}
        />
      )}
    </div>
  );
};

export default TurnosExcelView;