# backend/app/schemas/festivo.py
from pydantic import BaseModel, field_validator
from typing import Optional

class FestivoBase(BaseModel):
    dia_mes: str  # Formato: "DD/MM"
    descripcion: str
    tipo: str  # "Nacional" o "Madrid"
    estado: Optional[str] = "activo"
    
    @field_validator('dia_mes')
    def validate_dia_mes(cls, v):
        if not v or len(v) != 5 or v[2] != '/':
            raise ValueError('Formato de fecha debe ser DD/MM')
        dia, mes = v.split('/')
        if not (dia.isdigit() and mes.isdigit()):
            raise ValueError('Día y mes deben ser números')
        if not (1 <= int(dia) <= 31 and 1 <= int(mes) <= 12):
            raise ValueError('Día o mes fuera de rango válido')
        return v
    
    @field_validator('tipo')
    def validate_tipo(cls, v):
        if v not in ['Nacional', 'Madrid']:
            raise ValueError('Tipo debe ser "Nacional" o "Madrid"')
        return v

class FestivoCreate(FestivoBase):
    pass

class FestivoUpdate(BaseModel):
    dia_mes: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    estado: Optional[str] = None

class Festivo(FestivoBase):
    id: int

    class Config:
        from_attributes = True