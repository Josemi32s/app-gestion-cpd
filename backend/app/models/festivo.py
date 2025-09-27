# backend/app/models/festivo.py
from sqlalchemy import Column, Integer, String, TIMESTAMP, func

from .base import Base

class FestivoMadrid(Base):
    __tablename__ = "festivos_madrid_espana"

    id = Column(Integer, primary_key=True, index=True)
    dia_mes = Column(String(5), nullable=False)  # Formato: "01/01"
    descripcion = Column(String(255), nullable=False)
    tipo = Column(String(20), nullable=False)  # "Nacional" o "Madrid"
    estado = Column(String(20), default="activo")
    created_at = Column(TIMESTAMP, server_default=func.now())