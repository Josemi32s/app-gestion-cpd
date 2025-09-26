# backend/app/routers/turnos.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.turno import Turno as TurnoModel  # Modelo de SQLAlchemy
from app.schemas.turno import Turno, TurnoCreate, TurnoUpdate # Esquemas Pydantic
from app.models import usuario as models
from typing import List
from app import database
from datetime import date

router = APIRouter(prefix="/turnos", tags=["turnos"])

@router.get("/mes/{year}/{month}", response_model=List[Turno])
def get_turnos_por_mes(
    year: int,
    month: int,
    db: Session = Depends(database.get_db)
):
    start_date = date(year, month + 1, 1)
    if month + 1 == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 2, 1)
    
    return db.query(TurnoModel).filter(
        TurnoModel.fecha >= start_date,
        TurnoModel.fecha < end_date
    ).all()

# ✅ CREAR UN NUEVO TURNO
@router.post("/", response_model=Turno)
def crear_turno(turno: TurnoCreate, db: Session = Depends(database.get_db)):
    db_turno = TurnoModel(**turno.model_dump())
    db.add(db_turno)
    db.commit()
    db.refresh(db_turno)
    return db_turno

# ✅ ACTUALIZAR UN TURNO EXISTENTE
@router.patch("/{turno_id}", response_model=Turno)
def actualizar_turno(turno_id: int, turno: TurnoUpdate, db: Session = Depends(database.get_db)):
    db_turno = db.query(TurnoModel).filter(TurnoModel.id == turno_id).first()
    if db_turno is None:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    for key, value in turno.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(db_turno, key, value)
    
    db.commit()
    db.refresh(db_turno)
    return db_turno

@router.post("/cumpleanos/mes/{year}/{month}")
def asignar_cumpleanos_mes(year: int, month: int, db: Session = Depends(database.get_db)):
    # Obtener todos los usuarios activos con cumpleaños definido
    usuarios = db.query(models.Usuario).filter(
        models.Usuario.estado == "activo",
        models.Usuario.cumple_anios.isnot(None)
    ).all()
    
    turnos_creados = 0
    
    for usuario in usuarios:
        # Extraer día y mes del cumpleaños del usuario
        cumple_dia = usuario.cumple_anios.day
        cumple_mes = usuario.cumple_anios.month
        
        # Verificar si el cumpleaños cae en el mes que estamos procesando
        if cumple_mes == month + 1:  # Frontend usa 0-11, BD usa 1-12
            fecha_cumple = date(year, cumple_mes, cumple_dia)
            
            # Verificar si ya existe un turno para este día
            turno_existente = db.query(TurnoModel).filter(
                TurnoModel.usuario_id == usuario.id,
                TurnoModel.fecha == fecha_cumple
            ).first()
            
            # Solo crear si no existe
            if not turno_existente:
                nuevo_turno = TurnoModel(
                    usuario_id=usuario.id,
                    fecha=fecha_cumple,
                    turno='c',
                    es_reten=False,
                    generado_automático=True,
                    modificado_manual=False,
                    estado="activo"
                )
                db.add(nuevo_turno)
                turnos_creados += 1
    
    db.commit()
    return {"mensaje": f"Cumpleaños asignados: {turnos_creados}"}