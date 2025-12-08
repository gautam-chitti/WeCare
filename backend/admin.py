from fastapi import APIRouter, Depends, HTTPException, status
from db import prisma
from typing import List, Optional
from pydantic import BaseModel
from auth import get_current_user, get_password_hash
from prisma.models import User, DoctorProfile

router = APIRouter(tags=["admin"])

class DoctorStatusUpdate(BaseModel):
    status: str  # "verified", "banned", "pending"

@router.get("/doctors")
async def get_all_doctors(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not prisma.is_connected():
        await prisma.connect()
        
    where_clause = {"role": "doctor"}
    if status:
        where_clause["doctorProfile"] = {"is": {"verificationStatus": status}}
        
    doctors = await prisma.user.find_many(
        where=where_clause,
        include={"doctorProfile": True},
        order={"createdAt": "desc"}
    )
    
    return doctors

@router.patch("/doctors/{user_id}/status")
async def update_doctor_status(
    user_id: int,
    status_update: DoctorStatusUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    if not prisma.is_connected():
        await prisma.connect()

    # Verify doctor exists
    doctor = await prisma.user.find_unique(
        where={"id": user_id},
        include={"doctorProfile": True}
    )
    
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    # Update status
    updated_profile = await prisma.doctorprofile.update(
        where={"userId": user_id},
        data={"verificationStatus": status_update.status}
    )
    
    return updated_profile

@router.delete("/doctors/{user_id}")
async def delete_doctor(
    user_id: int,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    if not prisma.is_connected():
        await prisma.connect()

    # Delete doctor profile first (cascade should handle this but being safe)
    await prisma.doctorprofile.delete_many(where={"userId": user_id})
    
    # Delete user
    deleted_user = await prisma.user.delete(where={"id": user_id})
    
    return {"message": "Doctor deleted successfully", "id": deleted_user.id}
