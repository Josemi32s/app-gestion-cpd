from fastapi import APIRouter, Depends, HTTPException,requests
from sqlalchemy.orm import Session
from typing import List
from app.schemas import festivo as schemas
from app.models import festivo as models
from app import database


router = APIRouter(prefix="/festivos", tags=["festivos"])

@router.get("/", response_model=List[schemas.Festivo])
def listar_festivos(db: Session = Depends(database.get_db)):
    return db.query(models.FestivoMadrid).all()

@router.post("/", response_model=schemas.Festivo)
def crear_festivo(festivo: schemas.FestivoCreate, db: Session = Depends(database.get_db)):
    # Verificar si ya existe un festivo en esa fecha
    festivo_existente = db.query(models.FestivoMadrid).filter(
        models.FestivoMadrid.dia_mes == festivo.dia_mes,
        models.FestivoMadrid.tipo == festivo.tipo
    ).first()
    
    if festivo_existente:
        raise HTTPException(status_code=400, detail="Ya existe un festivo en esta fecha y tipo")
    
    db_festivo = models.FestivoMadrid(**festivo.dict())
    db.add(db_festivo)
    db.commit()
    db.refresh(db_festivo)
    return db_festivo

@router.get("/{festivo_id}", response_model=schemas.Festivo)
def obtener_festivo(festivo_id: int, db: Session = Depends(database.get_db)):
    festivo = db.query(models.FestivoMadrid).filter(
        models.FestivoMadrid.id == festivo_id
    ).first()
    if festivo is None:
        raise HTTPException(status_code=404, detail="Festivo no encontrado")
    return festivo

@router.patch("/{festivo_id}", response_model=schemas.Festivo)
def actualizar_festivo(festivo_id: int, festivo: schemas.FestivoUpdate, db: Session = Depends(database.get_db)):
    db_festivo = db.query(models.FestivoMadrid).filter(
        models.FestivoMadrid.id == festivo_id
    ).first()
    if db_festivo is None:
        raise HTTPException(status_code=404, detail="Festivo no encontrado")
    
    for key, value in festivo.dict(exclude_unset=True).items():
        if value is not None:
            setattr(db_festivo, key, value)
    
    db.commit()
    db.refresh(db_festivo)
    return db_festivo

