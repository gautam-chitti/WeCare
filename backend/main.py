from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from db import prisma
from contextlib import asynccontextmanager
import os
from auth import router as auth_router
from admin import router as admin_router
from predict import router as predict_router
from api_expansion import router as expansion_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await prisma.connect()
    yield
    await prisma.disconnect()

app = FastAPI(lifespan=lifespan, title="AuraCare API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])
app.include_router(predict_router, prefix="/api", tags=["Prediction"])
app.include_router(expansion_router, prefix="/api", tags=["Expansion"])

@app.get("/")
async def root():
    return {"message": "Welcome to AuraCare API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
