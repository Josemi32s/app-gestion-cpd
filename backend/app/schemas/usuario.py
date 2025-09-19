# backend/app/schemas/usuario.py
from pydantic import BaseModel
from datetime import date
from typing import Optional

class UsuarioBase(BaseModel):
    nombres: str
    apellidos: str
    usuario: str
    cumple_anios: Optional[date] = None
    telefono: Optional[str] = None
    fecha_ingreso: date
    fecha_salida: Optional[date] = None
    estado: str = "activo"
    rol_id: int

class UsuarioCreate(UsuarioBase):
    pass

class Usuario(UsuarioBase):
    id: int

    class Config:
        from_attributes = True  # orm_mode fue renombrado en Pydantic V2