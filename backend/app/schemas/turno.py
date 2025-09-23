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
    modificado_manual: bool = False
    estado: str = "activo"

class TurnoCreate(TurnoBase):
    pass

class TurnoUpdate(BaseModel):
    usuario_id: Optional[int] = None
    fecha: Optional[date] = None
    turno: Optional[str] = None
    es_reten: Optional[bool] = None
    generado_automático: Optional[bool] = None
    modificado_manual: Optional[bool] = None
    estado: Optional[str] = None

class Turno(TurnoBase):
    id: int

    class Config:
        from_attributes = True  # orm_mode fue renombrado en Pydantic V2