from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date

class ReporteTrabajado(BaseModel):
    usuario_id: int
    nombres: str
    apellidos: str
    rol: str
    dias_trabajados: int
    dias_festivos: int
    dias_trabajados_no_festivo: int
    horas_trabajadas: int  # Horas consolidadas por día (máximo por fecha)
    horas_trabajadas_raw: Optional[int] = None  # Suma directa de cada registro (para depurar diferencias)
    turnos_codigos: Optional[Dict[str, int]] = None
    dias_detalle: Optional[Dict[str, List[str]]] = None  # fecha ISO -> lista de códigos asignados

class ReporteTurnos(BaseModel):
    usuario_id: int
    nombres: str
    apellidos: str
    rol: str
    mañana: int
    tarde: int
    noche: int
    total: int
    horas_trabajadas: int
    turnos_codigos: Optional[Dict[str, int]] = None

class ReporteFestivos(BaseModel):
    usuario_id: int
    nombres: str
    apellidos: str
    rol: str
    festivos_trabajados: List[date]
    festivos_detalle_dia: Optional[Dict[int, List[str]]] = None
    festivos_fechas: Optional[List[date]] = None

class ReporteVacaciones(BaseModel):
    usuario_id: int
    nombres: str
    apellidos: str
    rol: str
    vacaciones_tomadas: int
    cumpleaños_tomado: bool
    dias_restantes: int

class ReporteRequest(BaseModel):
    year: int
    month: Optional[int] = None
    usuario_id: Optional[int] = None