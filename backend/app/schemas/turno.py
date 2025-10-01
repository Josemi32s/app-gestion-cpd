# backend/app/schemas/turno.py
from pydantic import BaseModel
from datetime import date
from typing import Optional

class TurnoBase(BaseModel):
    usuario_id: int
    fecha: date
    turno: str
    es_reten: bool = False
    generado_automático: bool = False
    estado: str = "activo"

class TurnoCreate(TurnoBase):
    pass

class TurnoUpdate(BaseModel):
    usuario_id: Optional[int] = None
    fecha: Optional[date] = None
    turno: Optional[str] = None
    es_reten: Optional[bool] = None
    generado_automático: Optional[bool] = None
    estado: Optional[str] = None

class Turno(TurnoBase):
    id: int
    modificado_manual: bool
    class Config:
        from_attributes = True  

class TurnoDisplay(BaseModel):
    id: Optional[int] = None
    usuario_id: int
    fecha: date
    turno: str
    es_reten: bool
    generado_automático: bool
    modificado_manual: bool
    estado: str

    class Config:
        from_attributes = True

class AusenciaRangoCreate(BaseModel):
    usuario_id: int
    fecha_inicio: date
    fecha_fin: date
    tipo: str  