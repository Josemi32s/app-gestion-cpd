from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from app import database
from app.models import usuario as models_usuario
from app.models.turno import Turno as TurnoModel
from app.models.festivo import FestivoMadrid as FestivoModel
from app.schemas.reporte import (
    ReporteTrabajado, ReporteTurnos, ReporteFestivos, 
    ReporteVacaciones, ReporteRequest
)

router = APIRouter(prefix="/reportes", tags=["reportes"])

@router.get("/years", response_model=list[int])
def obtener_years_disponibles(db: Session = Depends(database.get_db)):
    """Devuelve los años distintos en los que existen turnos asignados (y opcionalmente festivos)."""
    years_turnos = db.query(func.extract('year', TurnoModel.fecha).label('y')).distinct().all()
    years = sorted({int(r.y) for r in years_turnos if r.y is not None})
    return years

def get_festivos_mes(year: int, month: int, db: Session):
    """Obtiene festivos activos para un mes/año específico"""
    festivos = db.query(FestivoModel).filter(
        FestivoModel.estado == "activo"
    ).all()
    
    festivos_fechas = set()
    for festivo in festivos:
        dia, mes = map(int, festivo.dia_mes.split('/'))
        if mes == month:
            try:
                fecha_festivo = date(year, mes, dia)
                festivos_fechas.add(fecha_festivo)
            except ValueError:
                continue
    
    return festivos_fechas

def calcular_horas_turno(turno_codigo: str) -> int:
    """Calcula horas según el tipo de turno"""
    if turno_codigo in ['M', 'T', 'N']:
        return 8
    elif turno_codigo in ['FM1', 'FM2', 'FN1', 'FN2']:
        return 12
    return 0

TURNOS_CONTABLES = {'M','T','N','FM1','FM2','FN1','FN2'}

@router.post("/trabajados", response_model=List[ReporteTrabajado])
def reporte_dias_trabajados(request: ReporteRequest, db: Session = Depends(database.get_db)):
    # Construir rango de fechas
    if request.month:
        start_date = date(request.year, request.month, 1)
        if request.month == 12:
            end_date = date(request.year + 1, 1, 1)
        else:
            end_date = date(request.year, request.month + 1, 1)
    else:
        start_date = date(request.year, 1, 1)
        end_date = date(request.year + 1, 1, 1)
    
    # Obtener festivos si es reporte mensual
    festivos_set = set()
    if request.month:
        festivos_set = get_festivos_mes(request.year, request.month, db)
    
    # Determinar usuarios a consultar
    if request.usuario_id is not None:
        usuarios = db.query(models_usuario.Usuario).filter(
            models_usuario.Usuario.id == request.usuario_id,
            models_usuario.Usuario.estado == "activo",
            models_usuario.Usuario.rol_id.in_([1, 2])
        ).all()
    else:
        usuarios = db.query(models_usuario.Usuario).filter(
            models_usuario.Usuario.estado == "activo",
            models_usuario.Usuario.rol_id.in_([1, 2])
        ).all()
    
    if not usuarios:
        raise HTTPException(status_code=404, detail="No se encontraron usuarios válidos")
    
    reporte = []
    for usuario in usuarios:
        turnos = db.query(TurnoModel).filter(
            TurnoModel.usuario_id == usuario.id,
            TurnoModel.fecha >= start_date,
            TurnoModel.fecha < end_date
        ).all()

        horas_trabajadas_raw = 0  # suma directa por registro
        festivos_visitados = set()
        dias_unicos = set()
        codigos: dict[str,int] = {}
        dias_detalle: dict[str, list[str]] = {}
        for turno in turnos:
            if turno.turno in TURNOS_CONTABLES:
                horas_trabajadas_raw += calcular_horas_turno(turno.turno)
                dias_unicos.add(turno.fecha)
                codigos[turno.turno] = codigos.get(turno.turno,0)+1
                key = turno.fecha.isoformat()
                dias_detalle.setdefault(key, []).append(turno.turno)
                if request.month and turno.fecha in festivos_set:
                    festivos_visitados.add(turno.fecha)

        # Consolidar horas: por cada fecha tomar el máximo de las horas de sus códigos (evita doble conteo si hubo dos turnos en el mismo día accidentalmente)
        horas_trabajadas = 0
        for fecha_iso, cods in dias_detalle.items():
            max_dia = 0
            for c in cods:
                h = calcular_horas_turno(c)
                if h > max_dia:
                    max_dia = h
            horas_trabajadas += max_dia

        total_dias = len(dias_unicos)
        festivos_count = len(festivos_visitados)
        reporte.append(ReporteTrabajado(
            usuario_id=usuario.id,
            nombres=usuario.nombres,
            apellidos=usuario.apellidos,
            rol="Jefe de Turno" if usuario.rol_id == 1 else "Operador",
            dias_trabajados=total_dias,
            dias_festivos=festivos_count,
            dias_trabajados_no_festivo=total_dias - festivos_count,
            horas_trabajadas=horas_trabajadas,
            horas_trabajadas_raw=horas_trabajadas_raw,
            turnos_codigos=codigos,
            dias_detalle=dias_detalle
        ))
    
    return reporte

@router.post("/turnos", response_model=List[ReporteTurnos])
def reporte_turnos_por_tipo(request: ReporteRequest, db: Session = Depends(database.get_db)):
    if request.month:
        start_date = date(request.year, request.month, 1)
        if request.month == 12:
            end_date = date(request.year + 1, 1, 1)
        else:
            end_date = date(request.year, request.month + 1, 1)
    else:
        start_date = date(request.year, 1, 1)
        end_date = date(request.year + 1, 1, 1)
    
    if request.usuario_id is not None:
        usuarios = db.query(models_usuario.Usuario).filter(
            models_usuario.Usuario.id == request.usuario_id,
            models_usuario.Usuario.estado == "activo",
            models_usuario.Usuario.rol_id.in_([1, 2])
        ).all()
    else:
        usuarios = db.query(models_usuario.Usuario).filter(
            models_usuario.Usuario.estado == "activo",
            models_usuario.Usuario.rol_id.in_([1, 2])
        ).all()
    
    if not usuarios:
        raise HTTPException(status_code=404, detail="No se encontraron usuarios válidos")
    
    reporte = []
    for usuario in usuarios:
        turnos = db.query(TurnoModel).filter(
            TurnoModel.usuario_id == usuario.id,
            TurnoModel.fecha >= start_date,
            TurnoModel.fecha < end_date
        ).all()
        mañana = tarde = noche = 0
        horas_trabajadas = 0
        codigos: dict[str,int] = {}
        for turno in turnos:
            t = turno.turno
            if t in TURNOS_CONTABLES:
                horas_trabajadas += calcular_horas_turno(t)
                codigos[t] = codigos.get(t,0)+1
                if t in ['M','FM1','FM2']:
                    mañana += 1
                elif t == 'T':
                    tarde += 1
                elif t in ['N','FN1','FN2']:
                    noche += 1
        reporte.append(ReporteTurnos(
            usuario_id=usuario.id,
            nombres=usuario.nombres,
            apellidos=usuario.apellidos,
            rol="Jefe de Turno" if usuario.rol_id == 1 else "Operador",
            mañana=mañana,
            tarde=tarde,
            noche=noche,
            total=mañana + tarde + noche,
            horas_trabajadas=horas_trabajadas,
            turnos_codigos=codigos
        ))
    
    return reporte

@router.post("/festivos", response_model=List[ReporteFestivos])
def reporte_festivos_trabajados(request: ReporteRequest, db: Session = Depends(database.get_db)):
    if not request.month:
        raise HTTPException(status_code=400, detail="Este reporte solo está disponible por mes")
    
    start_date = date(request.year, request.month, 1)
    if request.month == 12:
        end_date = date(request.year + 1, 1, 1)
    else:
        end_date = date(request.year, request.month + 1, 1)
    
    festivos_set = get_festivos_mes(request.year, request.month, db)
    
    if request.usuario_id is not None:
        # Vista individual
        usuarios = db.query(models_usuario.Usuario).filter(
            models_usuario.Usuario.id == request.usuario_id,
            models_usuario.Usuario.estado == "activo",
            models_usuario.Usuario.rol_id.in_([1, 2])
        ).all()
        if not usuarios:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        reporte = []
        for usuario in usuarios:
            turnos_festivos = []
            turnos = db.query(TurnoModel).filter(
                TurnoModel.usuario_id == usuario.id,
                TurnoModel.fecha >= start_date,
                TurnoModel.fecha < end_date,
                TurnoModel.turno.in_(TURNOS_CONTABLES)
            ).all()
            for turno in turnos:
                if turno.fecha in festivos_set:
                    turnos_festivos.append(turno.fecha)
            
            reporte.append(ReporteFestivos(
                usuario_id=usuario.id,
                nombres=usuario.nombres,
                apellidos=usuario.apellidos,
                rol="Jefe de Turno" if usuario.rol_id == 1 else "Operador",
                festivos_trabajados=sorted(turnos_festivos),
                festivos_detalle_dia=None,
                festivos_fechas=None
            ))
        return reporte
    
    else:
        # Vista global
        usuarios = db.query(models_usuario.Usuario).filter(
            models_usuario.Usuario.estado == "activo",
            models_usuario.Usuario.rol_id.in_([1, 2])
        ).all()
        if not usuarios:
            raise HTTPException(status_code=404, detail="No se encontraron usuarios válidos")
        
        # festivos_por_dia: día(int) -> lista de strings "Nombre Apellido (CódigoTurno)"
        festivos_por_dia: dict[int, list[str]] = {}
        todas_fechas_festivas = set()

        for usuario in usuarios:
            turnos = db.query(TurnoModel).filter(
                TurnoModel.usuario_id == usuario.id,
                TurnoModel.fecha >= start_date,
                TurnoModel.fecha < end_date,
                TurnoModel.turno.in_(TURNOS_CONTABLES)
            ).all()
            for turno in turnos:
                if turno.fecha in festivos_set:
                    todas_fechas_festivas.add(turno.fecha)
                    dia = turno.fecha.day
                    # Incluir el código de turno trabajado ese día para mostrarlo en el detalle
                    nombre_usuario = f"{usuario.nombres} {usuario.apellidos} ({turno.turno})"
                    if dia not in festivos_por_dia:
                        festivos_por_dia[dia] = []
                    festivos_por_dia[dia].append(nombre_usuario)

        return [ReporteFestivos(
            usuario_id=0,
            nombres="Todos",
            apellidos="los usuarios",
            rol="Global",
            festivos_trabajados=[],
            festivos_detalle_dia=festivos_por_dia,
            festivos_fechas=sorted(list(todas_fechas_festivas))
        )]

@router.post("/vacaciones", response_model=List[ReporteVacaciones])
def reporte_vacaciones(request: ReporteRequest, db: Session = Depends(database.get_db)):
    if request.month:
        start_date = date(request.year, request.month, 1)
        if request.month == 12:
            end_date = date(request.year + 1, 1, 1)
        else:
            end_date = date(request.year, request.month + 1, 1)
    else:
        start_date = date(request.year, 1, 1)
        end_date = date(request.year + 1, 1, 1)
    
    if request.usuario_id is not None:
        usuarios = db.query(models_usuario.Usuario).filter(
            models_usuario.Usuario.id == request.usuario_id,
            models_usuario.Usuario.estado == "activo",
            models_usuario.Usuario.rol_id.in_([1, 2])
        ).all()
    else:
        usuarios = db.query(models_usuario.Usuario).filter(
            models_usuario.Usuario.estado == "activo",
            models_usuario.Usuario.rol_id.in_([1, 2])
        ).all()
    
    if not usuarios:
        raise HTTPException(status_code=404, detail="No se encontraron usuarios válidos")
    
    reporte = []
    for usuario in usuarios:
        vacaciones = db.query(TurnoModel).filter(
            TurnoModel.usuario_id == usuario.id,
            TurnoModel.fecha >= start_date,
            TurnoModel.fecha < end_date,
            TurnoModel.turno == 'v'
        ).count()
        
        cumple_tomado = False
        if usuario.cumple_anios:
            cumple_fecha = date(request.year, usuario.cumple_anios.month, usuario.cumple_anios.day)
            if start_date <= cumple_fecha < end_date:
                turno_cumple = db.query(TurnoModel).filter(
                    TurnoModel.usuario_id == usuario.id,
                    TurnoModel.fecha == cumple_fecha,
                    TurnoModel.turno == 'c'
                ).first()
                cumple_tomado = turno_cumple is not None
        
        total_dias = 31
        dias_usados = vacaciones + (1 if cumple_tomado else 0)
        dias_restantes = max(0, total_dias - dias_usados)
        
        reporte.append(ReporteVacaciones(
            usuario_id=usuario.id,
            nombres=usuario.nombres,
            apellidos=usuario.apellidos,
            rol="Jefe de Turno" if usuario.rol_id == 1 else "Operador",
            vacaciones_tomadas=vacaciones,
            cumpleaños_tomado=cumple_tomado,
            dias_restantes=dias_restantes
        ))
    
    return reporte