# backend/app/main.py
from fastapi import FastAPI
from .routers import usuarios
from .database import engine
from .models import base, rol, usuario, ausencia, turno, festivo

# Crear tablas si no existen (solo en desarrollo)
# En producción usar Alembic
base.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Gestor de Turnos - Fase 1",
    description="API para gestión de usuarios, ausencias y turnos.",
    version="0.1.0"
)

app.include_router(usuarios.router)

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido al Gestor de Turnos - Backend"}