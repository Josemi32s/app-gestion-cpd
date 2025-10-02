import { api } from './api';

interface ReporteRequest {
  year: number;
  month?: number;
}

export const getReporteTrabajados = (data: ReporteRequest) => {
  return api.post('/reportes/trabajados', data);
};

export const getReporteTurnos = (data: ReporteRequest) => {
  return api.post('/reportes/turnos', data);
};

export const getReporteFestivos = (data: ReporteRequest) => {
  return api.post('/reportes/festivos', data);
};

export const getReporteVacaciones = (data: ReporteRequest) => {
  return api.post('/reportes/vacaciones', data);
};

export const getReporteYears = () => {
  return api.get<number[]>('/reportes/years');
};
