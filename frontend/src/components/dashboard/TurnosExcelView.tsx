// src/components/dashboard/TurnosExcelView.tsx
import { useState, useMemo, useEffect } from "react";
import { useUsuarios } from "../../hooks/useUsuarios";
import { useTurnosPorMes } from "../../hooks/useTurnos";
import CellSelectorModal from "../calendar/CellSelectorModal";
import { asignarCumpleanosMes } from "../../services/turnosApi";
import type { Usuario, Turno } from "../../types";
import { exportToExcel } from "../../utils/exportToExcel";
import { getFestivos } from "../../services/festivosApi";

const getDaysOfMonth = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { day: number; date: string; isWeekend: boolean }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const isWeekend =
      new Date(year, month, day).getDay() === 0 ||
      new Date(year, month, day).getDay() === 6;
    days.push({ day, date: dateStr, isWeekend });
  }

  return days;
};

const getDayName = (dateString: string) => {
  const dayIndex = new Date(dateString).getDay();
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
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

  // ✅ Estados para selección de rango
  const [startSelection, setStartSelection] = useState<{
    usuario: Usuario;
    fecha: string;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // ✅ Gestión dinámica de años y navegación entre meses
  const MIN_YEAR = 2025;
  const [selectedYear, setSelectedYear] = useState<number>(MIN_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  // Lista de años disponible: desde MIN_YEAR hasta (selectedYear + 1) para permitir avanzar
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = MIN_YEAR; y <= selectedYear + 1; y++) years.push(y);
    return years;
  }, [selectedYear]);
  const isMinMonth = selectedYear === MIN_YEAR && selectedMonth === 0; // ✅ Enero 2025

  const [festivos, setFestivos] = useState<Set<string>>(new Set());

  const {
    turnos,
    loading: loadingTurnos,
    refetch: refetchTurnos,
  } = useTurnosPorMes(selectedYear, selectedMonth);

  useEffect(() => {
    const cargarFestivos = async () => {
      try {
        const festivosData = await getFestivos();
        const festivosSet = new Set<string>();

        festivosData.forEach((festivo) => {
          // Solo festivos activos
          if (festivo.estado === "activo") {
            // Verificar si el festivo está en el mes actual
            const [dia, mes] = festivo.dia_mes.split("/").map(Number);
            if (mes - 1 === selectedMonth) {
              // mes - 1 porque selectedMonth es 0-11
              // Crear fecha completa para comparar con las fechas de los días
              const fechaCompleta = `${selectedYear}-${String(mes).padStart(
                2,
                "0"
              )}-${String(dia).padStart(2, "0")}`;
              festivosSet.add(fechaCompleta);
            }
          }
        });

        setFestivos(festivosSet);
      } catch (error) {
        console.error("Error al cargar festivos:", error);
      }
    };

    cargarFestivos();
  }, [selectedYear, selectedMonth]);

  // Función para verificar si una fecha es festivo
  const esFestivo = (fecha: string) => {
    return festivos.has(fecha);
  };

  useEffect(() => {
    const aplicarCumpleanosAuto = async () => {
      try {
        await asignarCumpleanosMes(selectedYear, selectedMonth);
        await refetchTurnos();
      } catch (err) {
        console.warn("No se pudieron asignar cumpleaños automáticos");
      }
    };

    aplicarCumpleanosAuto();
  }, [selectedYear, selectedMonth]);

  // ✅ Event listener global para mouse up
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting && selectedFechas.length > 0) {
        setModalOpen(true);
      }
      setIsSelecting(false);
      setStartSelection(null);
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isSelecting, selectedFechas]);

  const turnosMap = useMemo(() => {
    const map = new Map<string, Map<number, Turno>>();
    turnos.forEach((turno) => {
      if (!map.has(turno.fecha)) {
        map.set(turno.fecha, new Map());
      }
      map.get(turno.fecha)!.set(turno.usuario_id, turno);
    });
    return map;
  }, [turnos]);

  const handleCellSelect = (usuario: Usuario, fecha: string) => {
    // Solo para selección simple (clic sin arrastrar)
    if (!isSelecting) {
      setSelectedUsuario(usuario);
      setSelectedFechas([fecha]);
      setModalOpen(true);
    }
  };

  // ✅ Manejadores para selección de rango
  const handleMouseDown = (usuario: Usuario, fecha: string) => {
    setStartSelection({ usuario, fecha });
    setIsSelecting(true);
    setSelectedUsuario(usuario);
    setSelectedFechas([fecha]);
  };

  const handleMouseEnterWhileSelecting = (usuario: Usuario, fecha: string) => {
    if (
      isSelecting &&
      startSelection &&
      startSelection.usuario.id === usuario.id
    ) {
      // Obtener rango de fechas ordenado
      const startDate = new Date(startSelection.fecha);
      const endDate = new Date(fecha);
      const minDate = startDate < endDate ? startDate : endDate;
      const maxDate = startDate > endDate ? startDate : endDate;

      const fechas = [];
      for (
        let date = new Date(minDate);
        date <= maxDate;
        date.setDate(date.getDate() + 1)
      ) {
        fechas.push(date.toISOString().split("T")[0]);
      }

      setSelectedUsuario(usuario);
      setSelectedFechas(fechas);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUsuario(null);
    setSelectedFechas([]);
    setIsSelecting(false);
    setStartSelection(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    refetchTurnos();
  };

  const handleExportToExcel = () => {
    const exportData = {
      year: selectedYear,
      month: selectedMonth,
      usuarios: usuarios.filter((u) => u.estado === "activo"),
      turnos: turnosMap,
      festivos: festivos,
    };

    exportToExcel(exportData);
  };

  const getCellColor = (
    turno: string | null,
    esReten: boolean,
    esFestivo: boolean
  ) => {
    if (esFestivo) {
      return "bg-green-200 border border-green-400";
    }

    if (esReten) return "bg-blue-200 border border-blue-400";
    if (!turno) return "bg-white border border-gray-300";
    if (turno === "v" || turno === "c")
      return "bg-yellow-100 border border-yellow-300";
    if (turno === "d") return "bg-gray-300 border border-gray-500 text-white";
    if (turno === "b") return "bg-red-200 border border-red-400";
    if (["FM1", "FM2"].includes(turno))
      return "bg-orange-100 border border-orange-300";
    if (["FN1", "FN2"].includes(turno))
      return "bg-purple-100 border border-purple-300";
    return "bg-white border border-gray-300";
  };

  const days = getDaysOfMonth(selectedYear, selectedMonth);
  const usuariosActivos = usuarios.filter((u) => u.estado === "activo");

  const usuariosActivosPorGrupo = {
    jefes: usuariosActivos.filter((u) => u.rol_id === 1),
    operadores: usuariosActivos.filter((u) => u.rol_id === 2),
    emc: usuariosActivos.filter((u) => u.rol_id === 3),
  };

  const goToPreviousMonth = () => {
    if (isMinMonth) return; // No ir antes de enero 2025
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => Math.max(MIN_YEAR, prev - 1));
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1); // Incrementa año automáticamente
    } else {
      setSelectedMonth((m) => m + 1);
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
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("es-ES", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            disabled={isMinMonth}
            className={`px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition 
              ${isMinMonth 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"}`}
              
          >
            ◄ Mes anterior
          </button>
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition"
          >
            Mes siguiente ►
          </button>
          <button
            onClick={handleExportToExcel}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Exportar Excel
          </button>
        </div>
      </div>
      <div className="w-full">
        <div className="w-full align-middle">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="border border-gray-300 px-1 py-1 bg-gray-100 text-center w-12"
                    rowSpan={2}
                  >
                    <div className="transform -rotate-90 origin-center text-xs">
                      Rol
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="border border-gray-300 px-1 py-1 bg-gray-100 text-center w-24"
                    rowSpan={2}
                  >
                    <div className="text-xs font-medium">Usuario</div>{" "}
                    {/* ✅ text-xs */}
                  </th>
                  {days.map((day, index) => (
                    <th
                      key={`num-${index}`}
                      scope="col"
                      className={`border border-gray-300 px-0.5 py-1 bg-gray-100 text-center w-[30px] ${
                        /* ✅ Ancho fijo pequeño + padding reducido */
                        hoverFecha === day.date ? "highlight-column-header" : ""
                      }`}
                    >
                      <div className="text-xs font-medium">{day.day}</div>{" "}
                      {/* ✅ text-xs */}
                    </th>
                  ))}
                </tr>
                <tr>
                  {days.map((day, index) => {
                    const isWeekend = day.isWeekend;
                    const esFestivoDia = esFestivo(day.date);
                    const headerColor = esFestivoDia
                      ? "bg-green-200 text-green-800"
                      : isWeekend
                      ? "text-red-600 font-bold"
                      : "text-gray-500";
                    return (
                      <th
                        key={`name-${index}`}
                        scope="col"
                        className={`border border-gray-300 px-0.5 py-1 bg-gray-100 text-center w-[30px] ${
                          isWeekend ? "text-red-600 font-bold" : "text-gray-500"
                        } ${
                          hoverFecha === day.date
                            ? "highlight-column-header"
                            : ""
                        } ${headerColor}`}
                      >
                        <div className="text-[10px] font-medium">
                          {" "}
                          {/* ✅ text-[10px] */}
                          {getDayName(day.date)}
                        </div>
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
            ${hoverUsuarioId === usuario.id ? "highlight-jefe-row" : ""}
          `}
                      >
                        {/* Celda de Rol (solo en la primera fila de cada grupo) */}
                        {index === 0 && (
                          <td
                            rowSpan={usuariosActivosPorGrupo.jefes.length}
                            className="border border-gray-300 px-1 py-1 text-[10px] font-bold text-gray-900 whitespace-nowrap text-center align-middle bg-blue-50"
                          >
                            <div className="transform -rotate-90 origin-center whitespace-nowrap text-blue-800 text-[10px]">
                              Jefes de Turno
                            </div>
                          </td>
                        )}

                        <td className="border border-gray-300 px-1 py-1 text-[10px] font-medium text-gray-900 whitespace-nowrap w-24">
                          {" "}
                          {/* ✅ text-[10px] + w-24 */}
                          {usuario.nombres} {usuario.apellidos}
                        </td>

                        {days.map((day) => {
                          const turnoObj = turnosMap
                            .get(day.date)
                            ?.get(usuario.id);
                          const turno = turnoObj ? turnoObj.turno : null;
                          const esReten = turnoObj ? turnoObj.es_reten : false;
                          const esFestivoDia = esFestivo(day.date);
                          return (
                            <td
                              key={`${usuario.id}-${day.date}`}
                              className={`
                  border border-gray-300 px-0.5 py-1 text-center cursor-pointer text-[10px] font-bold
                  ${getCellColor(turno, esReten, esFestivoDia)}
                  ${hoverUsuarioId === usuario.id ? "highlight-jefe-cell" : ""}
                  ${hoverFecha === day.date ? "highlight-column" : ""}
                `}
                              onClick={() =>
                                handleCellSelect(usuario, day.date)
                              }
                              onMouseDown={() =>
                                handleMouseDown(usuario, day.date)
                              }
                              onMouseEnter={() => {
                                handleMouseEnterWhileSelecting(
                                  usuario,
                                  day.date
                                );
                                setHoverUsuarioId(usuario.id);
                                setHoverFecha(day.date);
                              }}
                              onMouseLeave={() => {
                                setHoverUsuarioId(null);
                                setHoverFecha(null);
                              }}
                            >
                              {turno || "-"}
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
                    {usuariosActivosPorGrupo.operadores.map(
                      (usuario, index) => (
                        <tr
                          key={usuario.id}
                          className={`
            hover:bg-gray-50 transition-colors
            ${hoverUsuarioId === usuario.id ? "highlight-operador-row" : ""}
          `}
                        >
                          {index === 0 && (
                            <td
                              rowSpan={
                                usuariosActivosPorGrupo.operadores.length
                              }
                              className="border border-gray-300 px-1 py-1 text-[10px] text-center align-middle bg-green-50"
                            >
                              <div className="transform -rotate-90 origin-center whitespace-nowrap font-bold text-green-800 text-[10px]">
                                Operadores
                              </div>
                            </td>
                          )}

                          <td className="border border-gray-300 px-1 py-1 text-[10px] font-medium text-gray-900 whitespace-nowrap w-24">
                            {usuario.nombres} {usuario.apellidos}
                          </td>

                          {days.map((day) => {
                            const turnoObj = turnosMap
                              .get(day.date)
                              ?.get(usuario.id);
                            const turno = turnoObj ? turnoObj.turno : null;
                            const esReten = turnoObj
                              ? turnoObj.es_reten
                              : false;
                            const esFestivoDia = esFestivo(day.date);
                            return (
                              <td
                                key={`${usuario.id}-${day.date}`}
                                className={`
                  border border-gray-300 px-0.5 py-1 text-center cursor-pointer text-[10px] font-bold
                  ${getCellColor(turno, esReten, esFestivoDia)}
                  ${
                    hoverUsuarioId === usuario.id
                      ? "highlight-operador-cell"
                      : ""
                  }
                  ${hoverFecha === day.date ? "highlight-column" : ""}
                `}
                                onClick={() =>
                                  handleCellSelect(usuario, day.date)
                                }
                                onMouseDown={() =>
                                  handleMouseDown(usuario, day.date)
                                }
                                onMouseEnter={() => {
                                  handleMouseEnterWhileSelecting(
                                    usuario,
                                    day.date
                                  );
                                  setHoverUsuarioId(usuario.id);
                                  setHoverFecha(day.date);
                                }}
                                onMouseLeave={() => {
                                  setHoverUsuarioId(null);
                                  setHoverFecha(null);
                                }}
                              >
                                {turno || "-"}
                              </td>
                            );
                          })}
                        </tr>
                      )
                    )}
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
            ${hoverUsuarioId === usuario.id ? "highlight-emc-row" : ""}
          `}
                      >
                        {index === 0 && (
                          <td
                            rowSpan={usuariosActivosPorGrupo.emc.length}
                            className="border border-gray-300 px-1 py-1 text-[10px] text-center align-middle bg-purple-50"
                          >
                            <div className="transform -rotate-90 origin-center whitespace-nowrap font-bold text-purple-800 text-[10px]">
                              EMC
                            </div>
                          </td>
                        )}

                        <td className="border border-gray-300 px-1 py-1 text-[10px] font-medium text-gray-900 whitespace-nowrap w-24">
                          {usuario.nombres} {usuario.apellidos}
                        </td>

                        {days.map((day) => {
                          const turnoObj = turnosMap
                            .get(day.date)
                            ?.get(usuario.id);
                          const turno = turnoObj ? turnoObj.turno : null;
                          const esReten = turnoObj ? turnoObj.es_reten : false;
                          const esFestivoDia = esFestivo(day.date);
                          return (
                            <td
                              key={`${usuario.id}-${day.date}`}
                              className={`
                  border border-gray-300 px-0.5 py-1 text-center cursor-pointer text-[10px] font-bold
                  ${getCellColor(turno, esReten, esFestivoDia)}
                  ${hoverUsuarioId === usuario.id ? "highlight-emc-cell" : ""}
                  ${hoverFecha === day.date ? "highlight-column" : ""}
                `}
                              onClick={() =>
                                handleCellSelect(usuario, day.date)
                              }
                              onMouseDown={() =>
                                handleMouseDown(usuario, day.date)
                              }
                              onMouseEnter={() => {
                                handleMouseEnterWhileSelecting(
                                  usuario,
                                  day.date
                                );
                                setHoverUsuarioId(usuario.id);
                                setHoverFecha(day.date);
                              }}
                              onMouseLeave={() => {
                                setHoverUsuarioId(null);
                                setHoverFecha(null);
                              }}
                            >
                              {turno || "-"}
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
