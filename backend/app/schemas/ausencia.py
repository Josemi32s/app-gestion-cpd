# # backend/app/schemas/ausencia.py
# from pydantic import BaseModel
# from datetime import date
# from typing import Optional

# class AusenciaBase(BaseModel):
#     usuario_id: int
#     fecha_inicio: date
#     fecha_fin: date
#     tipo: str  # 'v', 'b', 'c'
#     descripcion: Optional[str] = None

# class AusenciaCreate(AusenciaBase):
#     pass

# class Ausencia(AusenciaBase):
#     id: int

#     class Config:
#         from_attributes = True