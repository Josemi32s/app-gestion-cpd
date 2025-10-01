# # backend/app/routers/ausencias.py
# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from app.models.ausencia import Ausencia as AusenciaModel
# from app.models.turno import Turno as TurnoModel  # ← Importar modelo de Turno
# from app.schemas.ausencia import Ausencia, AusenciaCreate
# from app import database
# from datetime import timedelta

# router = APIRouter(prefix="/ausencias", tags=["ausencias"])

# @router.post("/", response_model=Ausencia)
# def crear_ausencia(ausencia: AusenciaCreate, db: Session = Depends(database.get_db)):
#     # ✅ SOLO crea el registro de ausencia, NUNCA toca turnos_asignados
#     db_ausencia = AusenciaModel(**ausencia.model_dump())
#     db.add(db_ausencia)
#     db.commit()
#     db.refresh(db_ausencia)
#     return db_ausencia