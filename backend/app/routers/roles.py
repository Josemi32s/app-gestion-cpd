# backend/app/routers/roles.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.schemas import rol as schemas
from app.models import rol as models
from app import database

router = APIRouter(prefix="/roles", tags=["roles"])

@router.get("/", response_model=List[schemas.Rol])
def listar_roles(db: Session = Depends(database.get_db)):
    return db.query(models.Rol).all()