# backend/app/models/usuario.py
from sqlalchemy import Column, Integer, String, Date, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from .base import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    usuario = Column(String(50), unique=True, nullable=False)
    cumple_anios = Column(Date)
    telefono = Column(String(20))
    fecha_ingreso = Column(Date, nullable=False)
    fecha_salida = Column(Date, nullable=True)
    estado = Column(String(20), default="activo")
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    rol = relationship("Rol")