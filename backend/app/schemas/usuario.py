# backend/app/schemas/usuario.py
from pydantic import BaseModel
from datetime import date
from typing import Optional

class UsuarioBase(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    usuario: Optional[str] = None
    cumple_anios: Optional[date] = None
    telefono: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    fecha_salida: Optional[date] = None
    estado: Optional[str] = None
    rol_id: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    nombres: str
    apellidos: str
    usuario: str
    fecha_ingreso: date

class UsuarioUpdate(UsuarioBase):
    pass  # Todos los campos son opcionales para actualizaciones parciales

class Usuario(UsuarioBase):
    id: int

    class Config:
        from_attributes = True