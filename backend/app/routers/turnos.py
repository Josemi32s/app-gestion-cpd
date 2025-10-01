# backend/app/routers/turnos.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.turno import Turno as TurnoModel
from app.schemas.turno import Turno, TurnoCreate, TurnoUpdate,AusenciaRangoCreate,TurnoDisplay
from app.models import usuario as models
#from app.models.ausencia import Ausencia as AusenciaModel
from typing import List
from app import database
from datetime import date,timedelta

router = APIRouter(prefix="/turnos", tags=["turnos"])

@router.get("/mes/{year}/{month}", response_model=List[TurnoDisplay])
def get_turnos_por_mes(year: int, month: int, db: Session = Depends(database.get_db)):
    start_date = date(year, month, 1)
    end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    
    # ✅ Solo cargar turnos_asignados
    return db.query(TurnoModel).filter(
        TurnoModel.fecha >= start_date,
        TurnoModel.fecha < end_date
    ).all()

# ✅ CREAR UN NUEVO TURNO (solo si no existe)
@router.post("/", response_model=Turno)
def crear_turno(turno: TurnoCreate, db: Session = Depends(database.get_db)):
    db_turno = TurnoModel(**turno.model_dump())
    db.add(db_turno)
    db.commit()
    db.refresh(db_turno)
    return db_turno

# ✅ ACTUALIZAR UN TURNO EXISTENTE POR ID
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

# ✅ UPSERT: Crea o actualiza un turno basado en usuario_id + fecha
@router.post("/asignar", response_model=Turno)
def asignar_turno(turno: TurnoCreate, db: Session = Depends(database.get_db)):
    # Buscar turno existente para este usuario en esta fecha
    db_turno = db.query(TurnoModel).filter(
        TurnoModel.usuario_id == turno.usuario_id,
        TurnoModel.fecha == turno.fecha
    ).first()
    
    if db_turno:
        # Actualizar el turno existente
        update_data = turno.model_dump()
        for key, value in update_data.items():
            if value is not None:
                setattr(db_turno, key, value)
        # Marcar como modificado manualmente
        db_turno.modificado_manual = True
        db.commit()
        db.refresh(db_turno)
        return db_turno
    else:
        # Crear nuevo turno
        nuevo_turno = TurnoModel(
            **turno.model_dump(),
            modificado_manual=True  # Cualquier asignación manual se marca así
        )
        db.add(nuevo_turno)
        try:
            db.commit()
            db.refresh(nuevo_turno)
            return nuevo_turno
        except IntegrityError:
            # En caso muy raro de carrera, reintentar
            db.rollback()
            db_turno = db.query(TurnoModel).filter(
                TurnoModel.usuario_id == turno.usuario_id,
                TurnoModel.fecha == turno.fecha
            ).first()
            if db_turno:
                update_data = turno.model_dump()
                for key, value in update_data.items():
                    if value is not None:
                        setattr(db_turno, key, value)
                db_turno.modificado_manual = True
                db.commit()
                db.refresh(db_turno)
                return db_turno
            raise HTTPException(status_code=400, detail="Error al asignar turno: conflicto inesperado")

# ✅ Asignar cumpleaños (sin cambios, pero corregido el mes)
@router.post("/cumpleanos/mes/{year}/{month}")
def asignar_cumpleanos_mes(year: int, month: int, db: Session = Depends(database.get_db)):
    usuarios = db.query(models.Usuario).filter(
        models.Usuario.estado == "activo",
        models.Usuario.cumple_anios.isnot(None)
    ).all()
    
    turnos_creados = 0
    for usuario in usuarios:
        if usuario.cumple_anios.month == month:
            fecha_cumple = date(year, month, usuario.cumple_anios.day)
            
            # Verificar si YA EXISTE un turno (y no es 'c')
            turno_existente = db.query(TurnoModel).filter(
                TurnoModel.usuario_id == usuario.id,
                TurnoModel.fecha == fecha_cumple
            ).first()
            
            # Solo asignar 'c' si NO hay turno o si ya es 'c'
            if not turno_existente or turno_existente.turno == 'c':
                if turno_existente:
                    # Actualizar a 'c'
                    turno_existente.turno = 'c'
                    turno_existente.generado_automático = True
                    turno_existente.modificado_manual = False
                else:
                    # Crear nuevo
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

@router.post("/ausencia/rango")
def asignar_ausencia_rango(
    ausencia: AusenciaRangoCreate,
    db: Session = Depends(database.get_db)
):
    if ausencia.fecha_inicio > ausencia.fecha_fin:
        raise HTTPException(status_code=400, detail="Fecha inicio no puede ser mayor que fecha fin")
    
    if ausencia.tipo not in ['v', 'b', 'c']:
        raise HTTPException(status_code=400, detail="Tipo de ausencia no válido. Use: 'v', 'b', 'c'")
    
    current = ausencia.fecha_inicio
    turnos_actualizados = 0
    turnos_creados = 0
    
    while current <= ausencia.fecha_fin:
        turno_existente = db.query(TurnoModel).filter(
            TurnoModel.usuario_id == ausencia.usuario_id,
            TurnoModel.fecha == current
        ).first()
        
        if turno_existente:
            # ✅ SIEMPRE actualizar con ausencia (incluso si es manual)
            turno_existente.turno = ausencia.tipo
            turno_existente.generado_automático = False  # ← No es automático
            turno_existente.modificado_manual = True     # ← Es una modificación manual explícita
            turnos_actualizados += 1
        else:
            # Crear nuevo turno de ausencia
            nuevo_turno = TurnoModel(
                usuario_id=ausencia.usuario_id,
                fecha=current,
                turno=ausencia.tipo,
                es_reten=False,
                generado_automático=False,
                modificado_manual=True,  # ← Es manual
                estado="activo"
            )
            db.add(nuevo_turno)
            turnos_creados += 1
        
        current += timedelta(days=1)
    
    db.commit()
    return {
        "mensaje": f"Ausencia '{ausencia.tipo}' asignada del {ausencia.fecha_inicio} al {ausencia.fecha_fin}",
        "turnos_actualizados": turnos_actualizados,
        "turnos_creados": turnos_creados
    }