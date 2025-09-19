# backend/app/models/festivo.py
from sqlalchemy import Column, Integer, Date, String, TIMESTAMP, func
from .base import Base

class FestivoMadrid(Base):
    __tablename__ = "festivos_madrid_espana"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, unique=True, nullable=False)
    descripcion = Column(String(255), nullable=False)
    estado = Column(String(20), default="activo")
    created_at = Column(TIMESTAMP, server_default=func.now())