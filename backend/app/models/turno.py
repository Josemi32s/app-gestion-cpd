# backend/app/models/turno.py
from sqlalchemy import Column, Integer, Date, String, Boolean, ForeignKey, TIMESTAMP, func, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base

class Turno(Base):
    __tablename__ = "turnos_asignados"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    turno = Column(String(10), nullable=False)
    generado_automático = Column(Boolean, default=False)
    modificado_manual = Column(Boolean, default=False)
    es_reten = Column(Boolean, default=False)
    estado = Column(String(20), default="activo")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    usuario = relationship("Usuario")

    # ✅ ¡AGREGA ESTA LÍNEA!
    __table_args__ = (UniqueConstraint('usuario_id', 'fecha', name='uq_usuario_fecha'),)