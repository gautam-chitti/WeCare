from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # "patient", "doctor"
    name: Optional[str] = None
    licenseNumber: Optional[str] = None
    specialization: Optional[str] = None
    location: Optional[str] = None
    isGeneralPractitioner: bool = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    name: Optional[str]
    verificationStatus: Optional[str] = None # For doctors
    age: Optional[int] = None
    sex: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    profilePicture: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    # Doctor specific
    bio: Optional[str] = None
    experience: Optional[int] = None
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime # Added for ReviewResponse

# Assuming UserProfile is a Pydantic model, if it's not defined elsewhere,
# you might need to define a basic one or import it from another module.
# For the purpose of making the file syntactically correct, we'll assume
# it's a simple BaseModel or similar structure.
# If UserProfile is meant to be UserResponse from this file, adjust accordingly.
class UserProfile(BaseModel):
    id: int
    name: Optional[str] = None
    email: Optional[str] = None # Assuming email might be part of a profile
    # Add other relevant fields for a user profile

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # "patient", "doctor"
    name: Optional[str] = None
    licenseNumber: Optional[str] = None
    specialization: Optional[str] = None
    location: Optional[str] = None
    isGeneralPractitioner: bool = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    name: Optional[str]
    verificationStatus: Optional[str] = None # For doctors

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    # Doctor specific
    bio: Optional[str] = None
    experience: Optional[int] = None
    location: Optional[str] = None
    specialization: Optional[str] = None


class AppointmentCreate(BaseModel):
    doctorId: int
    date: str # ISO format datetime string
    reason: Optional[str] = None
    familyMemberId: Optional[int] = None

class AppointmentStatusUpdate(BaseModel):
    status: str # "confirmed", "cancelled", "completed"

class ReviewCreate(BaseModel):
    doctorId: int
    rating: int
    comment: str

class ReviewResponse(BaseModel):
    id: int
    rating: int
    comment: str
    createdAt: datetime
    patient: UserProfile
    doctor: UserProfile

class MessageCreate(BaseModel):
    receiverId: int
    message: str
    familyMemberId: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    senderId: int
    receiverId: int
    message: str
    timestamp: datetime
    isRead: bool
    familyMemberId: Optional[int] = None
    sender: UserProfile
    receiver: UserProfile


class FamilyMemberCreate(BaseModel):
    name: str
    relation: str
    age: int
    sex: str
    username: Optional[str] = None
    password: Optional[str] = None
    allowLogin: bool = False

class FamilyLoginRequest(BaseModel):
    username: str
    password: str

class FamilyMemberResponse(BaseModel):
    id: int
    name: str
    relation: str
    age: int
    sex: str
    profilePicture: Optional[str] = None
    guardianId: int
    username: Optional[str] = None
    allowLogin: bool = False
