# backend/app/routers/ausencias.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.ausencia import Ausencia as AusenciaModel
from app.models.turno import Turno as TurnoModel  # ← Importar modelo de Turno
from app.schemas.ausencia import Ausencia, AusenciaCreate
from app import database
from datetime import timedelta

router = APIRouter(prefix="/ausencias", tags=["ausencias"])

@router.post("/", response_model=Ausencia)
def crear_ausencia(ausencia: AusenciaCreate, db: Session = Depends(database.get_db)):
    # 1. Crear el registro de ausencia
    db_ausencia = AusenciaModel(**ausencia.model_dump())
    db.add(db_ausencia)
    db.commit()
    db.refresh(db_ausencia)
    
    # 2. Crear turnos individuales para cada día del rango
    start_date = ausencia.fecha_inicio
    end_date = ausencia.fecha_fin
    
    current_date = start_date
    while current_date <= end_date:
        # Verificar si ya existe un turno para este día
        existing_turno = db.query(TurnoModel).filter(
            TurnoModel.usuario_id == ausencia.usuario_id,
            TurnoModel.fecha == current_date
        ).first()
        
        if existing_turno:
            # Actualizar el turno existente
            existing_turno.turno = ausencia.tipo
            existing_turno.modificado_manual = True
        else:
            # Crear nuevo turno
            nuevo_turno = TurnoModel(
                usuario_id=ausencia.usuario_id,
                fecha=current_date,
                turno=ausencia.tipo,
                es_reten=False,
                generado_automático=False,
                modificado_manual=True,
                estado="activo"
            )
            db.add(nuevo_turno)
        
        current_date += timedelta(days=1)
    
    db.commit()
    return db_ausencia