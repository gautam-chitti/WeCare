from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from ml_service import model_manager, extract_features
import shutil
import os
import base64
from db import prisma
from auth import get_current_user

router = APIRouter()

from typing import Optional

@router.post("/predict")
async def predict_disease(
    file: UploadFile = File(...),
    disease_type: str = Form(...), # 'fracture' or 'tb'
    family_member_id: Optional[int] = Form(None),
    user = Depends(get_current_user)
):
    if disease_type not in ['fracture', 'tb']:
        raise HTTPException(status_code=400, detail="Invalid disease type")

    contents = await file.read()
    features, explanations, processed_image = extract_features(contents, disease_type)
    
    if features is None:
        raise HTTPException(status_code=400, detail="Could not process image")

    prediction = model_manager.predict(features, disease_type)
    
    if prediction is None:
        raise HTTPException(status_code=500, detail="Model not loaded or prediction failed")

    # Convert numpy types to python types for JSON serialization
    result = "Positive" if prediction == 1 else "Negative"
    
    # Save images to disk
    upload_dir = "uploads/xrays"
    os.makedirs(upload_dir, exist_ok=True)
    
    filename = f"{user.id}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as f:
        f.write(contents)
        
    heatmap_path = None
    if processed_image:
        heatmap_filename = f"{user.id}_heatmap_{file.filename}.png"
        heatmap_path = os.path.join(upload_dir, heatmap_filename)
        with open(heatmap_path, "wb") as f:
            f.write(base64.b64decode(processed_image))

    # Save to DB
    if not prisma.is_connected():
        await prisma.connect()
        
    data = {
        "type": disease_type,
        "prediction": result,
        "confidence": "High",
        "imagePath": file_path,
        "heatmapPath": heatmap_path,
        "features": str(explanations),
        "patientId": user.id
    }
    
    if family_member_id:
        data["familyMemberId"] = family_member_id
        
    await prisma.xrayreport.create(data=data)
    
    return {
        "disease_type": disease_type,
        "prediction": result,
        "confidence": "High", 
        "features": explanations,
        "processed_image": processed_image
    }

@router.get("/xrays/my")
async def get_my_xrays(
    family_member_id: Optional[int] = None,
    user = Depends(get_current_user)
):
    if not prisma.is_connected():
        await prisma.connect()
        
    where = {"patientId": user.id}
    
    if family_member_id:
        where["familyMemberId"] = family_member_id
    else:
        where["familyMemberId"] = None
        
    reports = await prisma.xrayreport.find_many(
        where=where,
        order={"createdAt": "desc"}
    )
    
    return reports
