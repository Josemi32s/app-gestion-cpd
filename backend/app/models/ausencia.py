# # backend/app/models/ausencia.py
# from sqlalchemy import Column, Integer, Date, String, Text, ForeignKey, TIMESTAMP, func
# from sqlalchemy.orm import relationship
# from .base import Base

# class Ausencia(Base):
#     __tablename__ = "ausencias"

#     id = Column(Integer, primary_key=True, index=True)
#     usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
#     fecha_inicio = Column(Date, nullable=False)
#     fecha_fin = Column(Date, nullable=False)
#     tipo = Column(String(50), nullable=False)  # v, b, c, etc.
#     descripcion = Column(Text)
#     created_at = Column(TIMESTAMP, server_default=func.now())
#     usuario = relationship("Usuario")