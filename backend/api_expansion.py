from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from db import prisma
from auth import get_current_user
from rag_service import extract_text_from_pdf, analyze_report
from symptom_service import symptom_matcher
import shutil
import os
import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from schemas import UserProfileUpdate, AppointmentCreate, AppointmentStatusUpdate, ReviewCreate, ReviewResponse, MessageCreate, MessageResponse, FamilyMemberCreate, FamilyMemberResponse

router = APIRouter()

class SymptomQuery(BaseModel):
    symptoms: str

@router.post("/reports/upload")
async def upload_report(
    title: str = Form(...),
    file: UploadFile = File(...),
    family_member_id: int = Form(None),
    user = Depends(get_current_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Save file
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{user.id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text and analyze
    with open(file_path, "rb") as f:
        text = extract_text_from_pdf(f.read())
    
    summary = analyze_report(text)

    # Save to DB
    if not prisma.is_connected():
        await prisma.connect()
        
    report_data = {
        "title": title,
        "filePath": file_path,
        "summary": summary,
        "patientId": user.id
    }
    
    if family_member_id:
        report_data["familyMemberId"] = family_member_id
        
    report = await prisma.report.create(
        data=report_data
    )
    
    return report

@router.get("/reports/my")
async def get_my_reports(
    family_member_id: int = None,
    user = Depends(get_current_user)
):
    if not prisma.is_connected():
        await prisma.connect()
    
    where_clause = {"patientId": user.id}
    if family_member_id is not None:
         where_clause["familyMemberId"] = family_member_id

    reports = await prisma.report.find_many(
        where=where_clause,
        order={"uploadedAt": "desc"}
    )
    return reports

@router.post("/symptoms/analyze")
async def analyze_symptoms(query: SymptomQuery):
    specialization = symptom_matcher.find_specialization(query.symptoms)
    
    if not prisma.is_connected():
        await prisma.connect()
        
    # Find doctors with this specialization
    doctors = await prisma.user.find_many(
        where={
            "role": "doctor",
            "doctorProfile": {
                "is": {
                    "specialization": specialization,
                    "verificationStatus": "verified"
                }
            }
        },
        include={"doctorProfile": True}
    )
    
    # Format response
    doctor_list = []
    for doc in doctors:
        profile = doc.doctorProfile
        doctor_list.append({
            "id": doc.id,
            "name": doc.name,
            "specialization": profile.specialization,
            "rating": profile.rating,
            "experience": profile.experience
        })
        
    return {
        "specialization": specialization,
        "doctors": doctor_list
    }
    return {
        "specialization": specialization,
        "doctors": doctor_list
    }

@router.get("/doctors/search")
async def search_doctors(
    query: str = "", 
    location: str = "", 
    specialization: str = "",
    include_gp: bool = False
):
    if not prisma.is_connected():
        await prisma.connect()
        
    where_clause = {
        "role": "doctor",
        "doctorProfile": {
            "is": {
                "verificationStatus": "verified"
            }
        }
    }
    
    # Add filters
    if location:
        where_clause["doctorProfile"]["is"]["location"] = {"contains": location}
        
    if specialization:
        where_clause["doctorProfile"]["is"]["specialization"] = specialization
        
    if include_gp:
        # If include_gp is true, we want doctors who match specialization OR are GPs
        # Prisma OR query structure is a bit complex, simplifying for now:
        # If specialization is set, we search for that. GP flag is separate.
        pass

    doctors = await prisma.user.find_many(
        where=where_clause,
        include={"doctorProfile": True},
        order={"doctorProfile": {"rating": "desc"}}
    )
    
    # Manual filtering for GP if needed (since Prisma nested ORs can be tricky)
    if include_gp and specialization:
        # Fetch GPs as well
        gp_doctors = await prisma.user.find_many(
            where={
                "role": "doctor",
                "doctorProfile": {
                    "is": {
                        "verificationStatus": "verified",
                        "isGeneralPractitioner": True,
                        "location": {"contains": location} if location else {}
                    }
                }
            },
            include={"doctorProfile": True}
        )
        # Merge lists unique by ID
        seen_ids = {d.id for d in doctors}
        for doc in gp_doctors:
            if doc.id not in seen_ids:
                doctors.append(doc)

    # Format response
    results = []
    for doc in doctors:
        profile = doc.doctorProfile
        results.append({
            "id": doc.id,
            "name": doc.name,
            "specialization": profile.specialization,
            "location": profile.location,
            "rating": profile.rating,
            "experience": profile.experience,
            "isGeneralPractitioner": profile.isGeneralPractitioner,
            "profilePicture": doc.profilePicture
        })
        
    # Sort again by rating just in case
    results.sort(key=lambda x: x['rating'], reverse=True)
        
    return results

@router.post("/reports/{report_id}/share")
async def share_report(
    report_id: int, 
    doctor_id: int,
    user = Depends(get_current_user)
):
    if not prisma.is_connected():
        await prisma.connect()
        
    # Verify report belongs to user
    report = await prisma.report.find_unique(where={"id": report_id})
    if not report or report.patientId != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Create access
    try:
        await prisma.reportaccess.create(
            data={
                "reportId": report_id,
                "doctorId": doctor_id
            }
        )
    except Exception:
        # Likely already exists
        pass
        
    return {"status": "success"}

@router.post("/reports/{report_id}/revoke")
async def revoke_access(
    report_id: int, 
    doctor_id: int,
    user = Depends(get_current_user)
):
    if not prisma.is_connected():
        await prisma.connect()
        
    # Verify report belongs to user
    report = await prisma.report.find_unique(where={"id": report_id})
    if not report or report.patientId != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Delete access
    await prisma.reportaccess.delete_many(
        where={
            "reportId": report_id,
            "doctorId": doctor_id
        }
    )
        
    return {"status": "success"}

@router.get("/doctors/shared-reports")
async def get_shared_reports(user = Depends(get_current_user)):
    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view shared reports")
        
    if not prisma.is_connected():
        await prisma.connect()
        
    # Get reports shared with this doctor
    access_entries = await prisma.reportaccess.find_many(
        where={"doctorId": user.id},
        include={
            "report": {
                "include": {
                    "patient": True
                }
            }
        },
        order={"grantedAt": "desc"}
    )
    
    # Flatten structure for easier frontend consumption
    reports = []
    for entry in access_entries:
        if entry.report:
            reports.append({
                "id": entry.report.id,
                "title": entry.report.title,
                "summary": entry.report.summary,
                "filePath": entry.report.filePath,
                "uploadedAt": entry.report.uploadedAt,
                "patient": {
                    "name": entry.report.patient.name,
                    "email": entry.report.patient.email,
                    "id": entry.report.patient.id
                }
            })
            
    return reports

from schemas import UserProfileUpdate

@router.put("/users/profile")
async def update_profile(
    profile_data: UserProfileUpdate,
    user = Depends(get_current_user)
):
    if not prisma.is_connected():
        await prisma.connect()
        
    # Update base user fields
    user_update_data = {}
    if profile_data.name is not None: user_update_data["name"] = profile_data.name
    if profile_data.age is not None: user_update_data["age"] = profile_data.age
    if profile_data.sex is not None: user_update_data["sex"] = profile_data.sex
    if profile_data.phone is not None: user_update_data["phone"] = profile_data.phone
    if profile_data.address is not None: user_update_data["address"] = profile_data.address
    
    if user_update_data:
        await prisma.user.update(
            where={"id": user.id},
            data=user_update_data
        )
        
    # Update doctor profile if applicable
    if user.role == "doctor":
        doctor_update_data = {}
        if profile_data.bio is not None: doctor_update_data["bio"] = profile_data.bio
        if profile_data.experience is not None: doctor_update_data["experience"] = profile_data.experience
        if profile_data.location is not None: doctor_update_data["location"] = profile_data.location
        if profile_data.specialization is not None: doctor_update_data["specialization"] = profile_data.specialization
        
        if doctor_update_data:
            await prisma.doctorprofile.update(
                where={"userId": user.id},
                data=doctor_update_data
            )
            
    # Fetch updated user to return
    updated_user = await prisma.user.find_unique(
        where={"id": user.id},
        include={"doctorProfile": True}
    )
    
    return updated_user

@router.post("/users/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    # Save file
    upload_dir = "uploads/profiles"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.split('.')[-1]
    filename = f"{user.id}_{int(datetime.now().timestamp())}.{ext}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update user profile
    # Store relative path for frontend access
    relative_path = f"/uploads/profiles/{filename}"
    
    if not prisma.is_connected():
        await prisma.connect()
        
    await prisma.user.update(
        where={"id": user.id},
        data={"profilePicture": relative_path}
    )
    
    return {"filePath": relative_path}


@router.post("/xrays/{xray_id}/share")
async def share_xray(
    xray_id: int, 
    doctor_id: int,
    user = Depends(get_current_user)
):
    if not prisma.is_connected():
        await prisma.connect()
        
    # Verify xray belongs to user
    xray = await prisma.xrayreport.find_unique(where={"id": xray_id})
    if not xray or xray.patientId != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Create access
    try:
        await prisma.xrayaccess.create(
            data={
                "xrayId": xray_id,
                "doctorId": doctor_id
            }
        )
    except Exception:
        # Likely already exists
        pass
        
    return {"status": "success"}

@router.get("/doctors/shared-xrays")
async def get_shared_xrays(user = Depends(get_current_user)):
    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view shared x-rays")
        
    if not prisma.is_connected():
        await prisma.connect()
        
    # Get xrays shared with this doctor
    access_entries = await prisma.xrayaccess.find_many(
        where={"doctorId": user.id},
        include={
            "xray": {
                "include": {
                    "patient": True
                }
            }
        },
        order={"grantedAt": "desc"}
    )
    
    # Flatten structure
    xrays = []
    for entry in access_entries:
        if entry.xray:
            xrays.append({
                "id": entry.xray.id,
                "type": entry.xray.type,
                "prediction": entry.xray.prediction,
                "confidence": entry.xray.confidence,
                "imagePath": entry.xray.imagePath,
                "heatmapPath": entry.xray.heatmapPath,
                "createdAt": entry.xray.createdAt,
                "patient": {
                    "name": entry.xray.patient.name,
                    "email": entry.xray.patient.email,
                    "id": entry.xray.patient.id
                }
            })
            
    return xrays


@router.post("/xrays/{xray_id}/revoke")
async def revoke_xray_access(
    xray_id: int, 
    doctor_id: int,
    user = Depends(get_current_user)
):
    if not prisma.is_connected():
        await prisma.connect()
        
    # Verify xray belongs to user
    xray = await prisma.xrayreport.find_unique(where={"id": xray_id})
    if not xray or xray.patientId != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Delete access
    await prisma.xrayaccess.delete_many(
        where={
            "xrayId": xray_id,
            "doctorId": doctor_id
        }
    )
        
    return {"status": "success"}

@router.delete("/doctors/shared-reports/{report_id}")
async def remove_shared_report(
    report_id: int,
    user = Depends(get_current_user)
):
    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can remove shared reports")
        
    if not prisma.is_connected():
        await prisma.connect()
        
    # Delete access for this doctor and report
    await prisma.reportaccess.delete_many(
        where={
            "reportId": report_id,
            "doctorId": user.id
        }
    )
    
    return {"status": "success"}

@router.delete("/doctors/shared-xrays/{xray_id}")
async def remove_shared_xray(
    xray_id: int,
    user = Depends(get_current_user)
):
    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can remove shared x-rays")
        
    if not prisma.is_connected():
        await prisma.connect()
        
    # Delete access for this doctor and xray
    await prisma.xrayaccess.delete_many(
        where={
            "xrayId": xray_id,
            "doctorId": user.id
        }
    )
    
    return {"status": "success"}


# --- Appointment Endpoints ---

@router.post("/appointments/book")
async def book_appointment(
    appointment: AppointmentCreate,
    user = Depends(get_current_user)
):
    if user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can book appointments")
        
    if not prisma.is_connected():
        await prisma.connect()
        
    # Parse date
    try:
        appt_date = datetime.fromisoformat(appointment.date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
        
    # Create appointment
    new_appt = await prisma.appointment.create(
        data={
            "date": appt_date,
            "reason": appointment.reason,
            "patientId": user.id,
            "doctorId": appointment.doctorId,
            "familyMemberId": appointment.familyMemberId,
            "status": "pending"
        }
    )
    
    return new_appt

@router.get("/appointments/my")
async def get_my_appointments(
    family_member_id: int = None,
    user = Depends(get_current_user)
):
    if not prisma.is_connected():
        await prisma.connect()
        
    if user.role == "patient":
        where_clause = {"patientId": user.id}
        if family_member_id is not None:
             # If specific ID provided, filter by it. 
             # Note: Frontend should pass a special value (e.g. -1 or pure null logic) for "Main User Only" if needed.
             # For now, if we pass nothing, we see ALL.
             # If we pass an ID, we see that member's. 
             where_clause["familyMemberId"] = family_member_id

        appointments = await prisma.appointment.find_many(
            where=where_clause,
            include={"doctor": True, "familyMember": True},
            order={"date": "asc"}
        )
    elif user.role == "doctor":
        appointments = await prisma.appointment.find_many(
            where={"doctorId": user.id},
            include={"patient": True, "familyMember": True},
            order={"date": "asc"}
        )
    else:
        return []
        
    # Transform for frontend if needed, or return as is (Prisma returns dict-like objects)
    # We might want to flatten the doctor/patient details
    return appointments

@router.put("/appointments/{id}/status")
async def update_appointment_status(
    id: int,
    status_update: AppointmentStatusUpdate,
    user = Depends(get_current_user)
):
    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update status")
        
    if not prisma.is_connected():
        await prisma.connect()
        
    # Verify appointment belongs to doctor
    appt = await prisma.appointment.find_unique(where={"id": id})
    if not appt or appt.doctorId != user.id:
        raise HTTPException(status_code=404, detail="Appointment not found or not authorized")
        
    updated_appt = await prisma.appointment.update(
        where={"id": id},
        data={"status": status_update.status}
    )
    
    return updated_appt

@router.delete("/appointments/{id}")
async def cancel_appointment(
    id: int,
    user = Depends(get_current_user)
):
    if not prisma.is_connected():
        await prisma.connect()
        
    appt = await prisma.appointment.find_unique(where={"id": id})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    # Patient can cancel if pending
    if user.role == "patient":
        if appt.patientId != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if appt.status != "pending":
            raise HTTPException(status_code=400, detail="Cannot cancel non-pending appointment")
            
    # Doctor can cancel (reject) anytime via status update, but DELETE is mostly for removal
    # Let's allow doctor to delete if they want, or restrict to patient cancellation
    elif user.role == "doctor":
        if appt.doctorId != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
    await prisma.appointment.delete(where={"id": id})
    
    return {"status": "success"}

from schemas import ReviewCreate, ReviewResponse

@router.post("/reviews", response_model=ReviewResponse)
async def create_review(
    review: ReviewCreate,
    user = Depends(get_current_user)
):
    if user.role != 'patient':
        raise HTTPException(status_code=403, detail="Only patients can write reviews")
    
    # Check if patient has a completed appointment with this doctor
    appointment = await prisma.appointment.find_first(
        where={
            'patientId': user.id,
            'doctorId': review.doctorId,
            'status': 'completed'
        }
    )
    
    if not appointment:
        raise HTTPException(status_code=400, detail="You can only review doctors you have completed an appointment with.")

    # Check if already reviewed
    existing_review = await prisma.review.find_first(
        where={
            'patientId': user.id,
            'doctorId': review.doctorId
        }
    )
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this doctor.")

    new_review = await prisma.review.create(
        data={
            'rating': review.rating,
            'comment': review.comment,
            'patientId': user.id,
            'doctorId': review.doctorId
        },
        include={
            'patient': True,
            'doctor': True
        }
    )
    
    # Update Doctor Stats
    # Recalculate average rating
    reviews = await prisma.review.find_many(where={'doctorId': review.doctorId})
    total_rating = sum(r.rating for r in reviews)
    avg_rating = total_rating / len(reviews)
    
    await prisma.doctorprofile.update(
        where={'userId': review.doctorId},
        data={
            'rating': avg_rating,
            'reviewCount': len(reviews)
        }
    )
    
    return new_review

@router.get("/doctors/{doctor_id}/reviews", response_model=List[ReviewResponse])
async def get_doctor_reviews(doctor_id: int):
    reviews = await prisma.review.find_many(
        where={'doctorId': doctor_id},
        include={
            'patient': True,
            'doctor': True
        },
        order={'createdAt': 'desc'}
    )
    return reviews

@router.get("/doctors/stats")
async def get_doctor_stats(user: dict = Depends(get_current_user)):
    if user.role != 'doctor':
        raise HTTPException(status_code=403, detail="Only doctors can view stats")
        
    # Get Doctor Profile for rating/reviews
    profile = await prisma.doctorprofile.find_unique(where={'userId': user.id})
    
    # Count Active Patients (Unique patients with appointments)
    appointments = await prisma.appointment.find_many(
        where={'doctorId': user.id},
        distinct=['patientId']
    )
    patient_count = len(appointments)
    
    # Count Today's Appointments
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
    
    today_appointments = await prisma.appointment.count(
        where={
            'doctorId': user.id,
            'date': {
                'gte': today_start,
                'lte': today_end
            }
        }
    )
    
    return {
        "rating": profile.rating if profile else 0,
        "reviews": profile.reviewCount if profile else 0,
        "patients": patient_count,
        "todayAppointments": today_appointments
    }

@router.get("/doctors/patients")
async def get_my_patients(user = Depends(get_current_user)):
    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view patients")
    
    if not prisma.is_connected():
        await prisma.connect()

    # Get patients from appointments
    appointments = await prisma.appointment.find_many(
        where={"doctorId": user.id},
        include={"patient": True},
        distinct=["patientId"]
    )
    
    patients = []
    for appt in appointments:
        if appt.patient:
            patients.append(appt.patient)
            
    return patients

@router.get("/patients/stats")
async def get_patient_stats(user = Depends(get_current_user)):
    if user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can view stats")
        
    if not prisma.is_connected():
        await prisma.connect()
        
    # Next Appointment
    next_appt = await prisma.appointment.find_first(
        where={
            "patientId": user.id,
            "date": {"gte": datetime.now()},
            "status": {"in": ["pending", "confirmed"]}
        },
        order={"date": "asc"}
    )
    
    # Report Count
    report_count = await prisma.report.count(where={"patientId": user.id})
    
    return {
        "nextAppointment": next_appt,
        "reportCount": report_count,
        "healthScore": 98
    }

from schemas import MessageCreate, MessageResponse

@router.post("/messages", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    user = Depends(get_current_user)
):
    # Check if receiver exists
    receiver = await prisma.user.find_unique(where={'id': message.receiverId})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    data = {
        'message': message.message,
        'senderId': user.id,
        'receiverId': message.receiverId,
        'isRead': False
    }
    
    if message.familyMemberId:
        data['familyMemberId'] = message.familyMemberId

    new_message = await prisma.chat.create(
        data=data,
        include={
            'sender': True,
            'receiver': True
        }
    )
    return new_message

@router.get("/messages/conversations")
async def get_conversations(
    family_member_id: int = None,
    user = Depends(get_current_user)
):
    # Base filter: User involved
    where = {
        'OR': [
            {'senderId': user.id},
            {'receiverId': user.id}
        ]
    }
    
    if family_member_id:
        where['familyMemberId'] = family_member_id
    else:
        where['familyMemberId'] = None

    # Get messages
    messages = await prisma.chat.find_many(
        where=where,
        include={
            'sender': True,
            'receiver': True
        },
        order={'timestamp': 'desc'}
    )
    
    # Group by other user
    conversations = {}
    for msg in messages:
        other_user = msg.receiver if msg.senderId == user.id else msg.sender
        if other_user.id not in conversations:
            conversations[other_user.id] = {
                'user': other_user,
                'lastMessage': msg
            }
            
    return list(conversations.values())

@router.get("/messages/unread-count")
async def get_unread_count(
    family_member_id: int = None,
    user = Depends(get_current_user)
):
    where = {
        'receiverId': user.id,
        'isRead': False
    }
    
    if family_member_id:
        where['familyMemberId'] = family_member_id
    else:
        where['familyMemberId'] = None

    count = await prisma.chat.count(where=where)
    return {"count": count}

@router.get("/messages/{other_user_id}", response_model=List[MessageResponse])
async def get_chat_history(
    other_user_id: int,
    family_member_id: int = None,
    user = Depends(get_current_user)
):
    where = {
        'OR': [
            {'senderId': user.id, 'receiverId': other_user_id},
            {'senderId': other_user_id, 'receiverId': user.id}
        ]
    }

    if family_member_id:
        where['familyMemberId'] = family_member_id
    else:
        where['familyMemberId'] = None

    messages = await prisma.chat.find_many(
        where=where,
        include={
            'sender': True,
            'receiver': True
        },
        order={'timestamp': 'asc'}
    )
    
    # Mark read
    await prisma.chat.update_many(
        where={
            'senderId': other_user_id,
            'receiverId': user.id,
            'isRead': False,
            'familyMemberId': family_member_id if family_member_id else None
        },
        data={'isRead': True}
    )
    
    return messages
    # Check if receiver exists
    receiver = await prisma.user.find_unique(where={'id': message.receiverId})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    data = {
        'message': message.message,
        'senderId': user.id,
        'receiverId': message.receiverId,
        'isRead': False
    }
    
    if message.familyMemberId:
        data['familyMemberId'] = message.familyMemberId

    new_message = await prisma.chat.create(
        data=data,
        include={
            'sender': True,
            'receiver': True
        }
    )
    return new_message

@router.get("/messages/conversations")
async def get_conversations(
    family_member_id: int = None,
    user = Depends(get_current_user)
):
    # Base filter: User involved
    where = {
        'OR': [
            {'senderId': user.id},
            {'receiverId': user.id}
        ]
    }
    
    if family_member_id:
        where['familyMemberId'] = family_member_id
    else:
        where['familyMemberId'] = None

    # Get messages
    messages = await prisma.chat.find_many(
        where=where,
        include={
            'sender': True,
            'receiver': True
        },
        order={'timestamp': 'desc'}
    )
    
    # Group by other user
    conversations = {}
    for msg in messages:
        other_user = msg.receiver if msg.senderId == user.id else msg.sender
        if other_user.id not in conversations:
            conversations[other_user.id] = {
                'user': other_user,
                'lastMessage': msg
            }
            
    return list(conversations.values())

@router.get("/messages/unread-count")
async def get_unread_count(
    family_member_id: int = None,
    user = Depends(get_current_user)
):
    where = {
        'receiverId': user.id,
        'isRead': False
    }
    
    if family_member_id:
        where['familyMemberId'] = family_member_id
    else:
        where['familyMemberId'] = None

    count = await prisma.chat.count(where=where)
    return {"count": count}

@router.get("/messages/{other_user_id}", response_model=List[MessageResponse])
async def get_chat_history(
    other_user_id: int,
    family_member_id: int = None,
    user = Depends(get_current_user)
):
    where = {
        'OR': [
            {'senderId': user.id, 'receiverId': other_user_id},
            {'senderId': other_user_id, 'receiverId': user.id}
        ]
    }

    if family_member_id:
        where['familyMemberId'] = family_member_id
    else:
        where['familyMemberId'] = None

    messages = await prisma.chat.find_many(
        where=where,
        include={
            'sender': True,
            'receiver': True
        },
        order={'timestamp': 'asc'}
    )
    
    # Mark read
    await prisma.chat.update_many(
        where={
            'senderId': other_user_id,
            'receiverId': user.id,
            'isRead': False,
            'familyMemberId': family_member_id if family_member_id else None
        },
        data={'isRead': True}
    )
    
    return messages
# --- Family Profile Endpoints ---

@router.post("/family/members", response_model=FamilyMemberResponse)
async def create_family_member(
    member: FamilyMemberCreate,
    user = Depends(get_current_user)
):
    if user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can create family members")

    if not prisma.is_connected():
        await prisma.connect()

    new_member = await prisma.familymember.create(
        data={
            "name": member.name,
            "relation": member.relation,
            "age": member.age,
            "sex": member.sex,
            "guardianId": user.id,
            "username": member.username,
            "password": member.password,
            "allowLogin": member.allowLogin
        }
    )
    return new_member

@router.get("/family/members", response_model=List[FamilyMemberResponse])
async def get_family_members(user = Depends(get_current_user)):
    if user.role != "patient":
        return []

    if not prisma.is_connected():
        await prisma.connect()

    members = await prisma.familymember.find_many(
        where={"guardianId": user.id}
    )
    return members

@router.post("/family/members/{id}/profile-picture")
async def upload_family_profile_picture(
    id: int,
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    if not prisma.is_connected():
        await prisma.connect()
    
    # Verify ownership
    member = await prisma.familymember.find_unique(where={"id": id})
    if not member or member.guardianId != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Save file
    upload_dir = "uploads/family_profiles"
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = file.filename.split('.')[-1]
    filename = f"fam_{id}_{int(datetime.now().timestamp())}.{ext}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    relative_path = f"/uploads/family_profiles/{filename}"
    
    await prisma.familymember.update(
        where={"id": id},
        data={"profilePicture": relative_path}
    )
    
    return {"filePath": relative_path}

# --- Prescription & Patient Endpoints ---

class PrescriptionItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str

class PrescriptionCreate(BaseModel):
    patientId: int
    medicines: List[PrescriptionItem]
    pharmacyName: str
    diagnosis: str

class PatientSearchResponse(BaseModel):
    id: int
    name: str
    age: Optional[int]
    sex: Optional[str]

@router.get("/patients/search", response_model=List[PatientSearchResponse])
async def search_patients(
    query: str,
    user = Depends(get_current_user)
):
    if user.role != 'doctor':
        return []
        
    try:
        # Search for patients by name
        patients = await prisma.user.find_many(
            where={
                'role': 'patient',
                'name': {'contains': query}
            },
            take=5
        )
        return patients
    except Exception as e:
        print(f"Error researching patients: {str(e)}")
        return []

@router.post("/prescriptions")
async def create_prescription(
    data: PrescriptionCreate,
    user = Depends(get_current_user)
):
    if user.role != 'doctor':
        raise HTTPException(status_code=403, detail="Only doctors can prescribe")
        
    try:
        prescription = await prisma.prescription.create(
            data={
                'medicines': json.dumps([m.dict() for m in data.medicines]),
                'pharmacyName': data.pharmacyName,
                'diagnosis': data.diagnosis,
                'status': 'pending',
                'doctorId': user.id,
                'patientId': data.patientId
            }
        )
        return prescription
    except Exception as e:
        print(f"Error creating prescription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prescriptions")
async def get_my_prescriptions(
    user = Depends(get_current_user)
):
    try:
        # If doctor, show prescriptions written by them
        if user.role == 'doctor':
             prescriptions = await prisma.prescription.find_many(
                where={'doctorId': user.id},
                include={'doctor': True, 'patient': True},
                order={'createdAt': 'desc'}
            )
        else:
            # If patient, show prescriptions received
            active_id = user.id
            prescriptions = await prisma.prescription.find_many(
                where={'patientId': active_id},
                include={'doctor': True, 'patient': True},
                order={'createdAt': 'desc'}
            )
            
        # Parse JSON medicines
        for p in prescriptions:
            if isinstance(p.medicines, str):
                p.medicines = json.loads(p.medicines)
                
        return prescriptions
    except Exception as e:
        print(f"Error fetching prescriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/prescriptions/{id}/order")
async def order_prescription(
    id: int,
    user = Depends(get_current_user)
):
    try:
        await prisma.prescription.update(
            where={'id': id},
            data={'status': 'ordered'}
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# --- Prescription Endpoints ---

class PrescriptionItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str

class PrescriptionCreate(BaseModel):
    patientId: int
    medicines: List[PrescriptionItem]
    pharmacyName: str
    diagnosis: str

@router.post("/prescriptions")
async def create_prescription(
    data: PrescriptionCreate,
    user = Depends(get_current_user)
):
    if user.role != 'doctor':
        raise HTTPException(status_code=403, detail="Only doctors can prescribe")
        
    try:
        prescription = await prisma.prescription.create(
            data={
                'medicines': json.dumps([m.dict() for m in data.medicines]),
                'pharmacyName': data.pharmacyName,
                'diagnosis': data.diagnosis,
                'status': 'pending',
                'doctorId': user.id,
                'patientId': data.patientId
            }
        )
        return prescription
    except Exception as e:
        print(f"Error creating prescription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prescriptions")
async def get_my_prescriptions(
    user = Depends(get_current_user)
):
    try:
        # If doctor, show prescriptions written by them
        if user.role == 'doctor':
             prescriptions = await prisma.prescription.find_many(
                where={'doctorId': user.id},
                include={'doctor': True, 'patient': True},
                order={'createdAt': 'desc'}
            )
        else:
            # If patient, show prescriptions received
            active_id = user.id
            # NOTE: Ideally we would filter by familyMemberId if we added it to Prescription model, 
            # but for now we simplify to just user ID or we could assume family shares same account.
            # To strictly follow the "Independent Access" feature, we should check `is_family_session`.
            # However, for this demo we'll return prescriptions for the User ID.
            
            prescriptions = await prisma.prescription.find_many(
                where={'patientId': active_id},
                include={'doctor': True, 'patient': True},
                order={'createdAt': 'desc'}
            )
            
        # Parse JSON medicines
        for p in prescriptions:
            if isinstance(p.medicines, str):
                p.medicines = json.loads(p.medicines)
                
        return prescriptions
    except Exception as e:
        print(f"Error fetching prescriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/prescriptions/{id}/order")
async def order_prescription(
    id: int,
    user = Depends(get_current_user)
):
    try:
        await prisma.prescription.update(
            where={'id': id},
            data={'status': 'ordered'}
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



