// src/utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  rol_id: number;
}

interface Turno {
  fecha: string;
  turno: string;
  es_reten: boolean;
}

interface ExportData {
  year: number;
  month: number;
  usuarios: Usuario[];
  turnos: Map<string, Map<number, Turno>>;
  festivos: Set<string>; // ✅ Agregado: conjunto de fechas festivas
}

export const exportToExcel = async (data: ExportData) => {
  const { year, month, usuarios, turnos, festivos } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Turnos");

  // 🔹 Obtener días del mes
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 🔹 Configurar anchos
  worksheet.getColumn(1).width = 15; // Rol
  worksheet.getColumn(2).width = 25; // Usuario
  days.forEach((_, index) => {
    worksheet.getColumn(index + 3).width = 4; // Días más estrechos
  });

  // 🔹 Primera fila: nombre del mes
  const monthName = new Date(year, month).toLocaleString("es-ES", {
    month: "long",
  });
  const titleRow = worksheet.addRow([` ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`]);

  worksheet.mergeCells(1, 1, 1, days.length + 2);
  titleRow.getCell(1).style = {
    font: { bold: true, size: 14, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF666666" } },
    alignment: { horizontal: "center", vertical: "middle" },
  };

  // 🔹 Encabezado con días
  const headerRow = worksheet.addRow(["Rol", "Usuario / Día", ...days]);
  headerRow.eachCell((cell, colNumber) => {
    const baseStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FF444444" },
      },
      alignment: { horizontal: "center" as const, vertical: "middle" as const },
      border: getFullBorder(),
    };

    if (colNumber >= 3) {
      const dayIndex = colNumber - 3;
      const day = days[dayIndex];
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayOfWeek = new Date(dateStr).getDay();

      // ✅ Verificar si es festivo
      const esFestivo = festivos.has(dateStr);

      if (esFestivo) {
        // Fondo verde para festivos (prioridad sobre fin de semana)
        cell.style = {
          ...baseStyle,
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "90EE90" }, // Verde claro
          },
        };
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Fondo rojo para fines de semana
        cell.style = {
          ...baseStyle,
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F86363" }, // Rojo
          },
        };
      } else {
        cell.style = baseStyle;
      }
    } else {
      cell.style = baseStyle;
    }
  });

  // 🔹 Usuarios ordenados por rol
  const jefes = usuarios.filter((u) => u.rol_id === 1);
  const operadores = usuarios.filter((u) => u.rol_id === 2);
  const emc = usuarios.filter((u) => u.rol_id === 3);

  const roles = [
    { name: "Jefe de Turno", color: "E7F8FE", users: jefes },
    { name: "Operador", color: "E7FEEC", users: operadores },
    { name: "EMC", color: "F9E7FE", users: emc },
  ];

  let currentRow = 3; // 🔹 Empezamos debajo del encabezado

  roles.forEach((rol) => {
    if (rol.users.length === 0) return;

    const startRow = currentRow;

    rol.users.forEach((usuario) => {
      const rowData = [
        rol.name, // se sobrescribirá con merge después
        `${usuario.nombres} ${usuario.apellidos}`,
      ];

      days.forEach((day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
        const turno = turnos.get(dateStr)?.get(usuario.id);
        rowData.push(turno ? turno.turno : "");
      });

      const row = worksheet.addRow(rowData);

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = getFullBorder();

        if (colNumber === 2) {
          // Usuario
          cell.font = { bold: true, color: { argb: "FF000000" } };
        } else if (colNumber >= 3) {
          // Turnos
          const dayIndex = colNumber - 3;
          const day = days[dayIndex];
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}`;
          const turno = turnos.get(dateStr)?.get(usuario.id);
          const esFestivo = festivos.has(dateStr); // ✅ Verificar festivo

          if (turno) {
            if (turno.turno === "d") {
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFA9A9A9" }, // gris
              };
            } else {
              cell.font = { bold: true, color: { argb: "FF000000" } };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: getFillColor(turno.turno, turno.es_reten) },
              };
            }
          }

          // ✅ Si es festivo, aplicar fondo verde SOBRE cualquier otro color
          if (esFestivo) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "90EE90" }, // Verde claro
            };
            cell.font = { bold: true, color: { argb: "FF000000" } };
          }
        }
      });

      currentRow++;
    });

    // 🔹 Fusionar celda de Rol en vertical
    const endRow = currentRow - 1;
    worksheet.mergeCells(startRow, 1, endRow, 1);

    const rolCell = worksheet.getCell(startRow, 1);
    rolCell.value = rol.name;
    rolCell.alignment = { horizontal: "center", vertical: "middle", textRotation: 90 };
    rolCell.font = { bold: true, color: { argb: "FF000000" } };
    rolCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: rol.color },
    };
    rolCell.border = getFullBorder();
  });

  // 🔹 Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `Turnos_${monthName}_${year}.xlsx`);
};

// 🔹 Funciones auxiliares
const getFillColor = (turno: string, esReten: boolean) => {
  if (esReten) return "FFADD8E6"; // Celeste (reten)
  if (turno === "v" || turno === "c") return "FFFFFF00"; // Amarillo
  if (turno === "b") return "FFFF0000"; // Rojo
  if (["FM1", "FM2"].includes(turno)) return "FFFFA500"; // Naranja
  if (["FN1", "FN2"].includes(turno)) return "FFDA70D6"; // Morado
  return "FFFFFFFF"; // Blanco
};

const getFullBorder = () => ({
  top: { style: "thin" as const, color: { argb: "FF000000" } },
  left: { style: "thin" as const, color: { argb: "FF000000" } },
  bottom: { style: "thin" as const, color: { argb: "FF000000" } },
  right: { style: "thin" as const, color: { argb: "FF000000" } },
});