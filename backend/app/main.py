# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import usuarios, roles,turnos,ausencias
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # o ["*"] para permitir todos los orígenes (no recomendado en producción)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios.router)
app.include_router(roles.router)
app.include_router(turnos.router)
app.include_router(ausencias.router)

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido al Gestor de Turnos - Backend"}