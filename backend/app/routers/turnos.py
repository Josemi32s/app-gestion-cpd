# backend/app/routers/turnos.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.turno import Turno as TurnoModel  # Modelo de SQLAlchemy
from app.schemas.turno import Turno, TurnoCreate, TurnoUpdate  # Esquemas Pydantic
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