from fastapi import APIRouter, HTTPException, Depends, status
from db import prisma
from schemas import UserCreate, UserLogin, Token, UserResponse
from utils import get_password_hash, verify_password
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()

# JWT Configuration
SECRET_KEY = "your-secret-key-keep-it-secret" # In production, use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    if not prisma.is_connected():
        await prisma.connect()
        
    user = await prisma.user.find_unique(where={"email": email}, include={"doctorProfile": True})
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    if not prisma.is_connected():
        await prisma.connect()

    existing_user = await prisma.user.find_unique(where={"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    
    # Create user
    new_user = await prisma.user.create(
        data={
            "email": user.email,
            "password": hashed_password,
            "role": user.role,
            "name": user.name
        }
    )
    
    # If doctor, create profile
    if user.role == "doctor":
        await prisma.doctorprofile.create(
            data={
                "userId": new_user.id,
                "licenseNumber": user.licenseNumber or "PENDING",
                "specialization": user.specialization or "General",
                "location": user.location,
                "isGeneralPractitioner": user.isGeneralPractitioner,
                "verificationStatus": "pending"
            }
        )

    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "name": new_user.name,
            "profilePicture": new_user.profilePicture,
            "age": new_user.age,
            "sex": new_user.sex,
            "phone": new_user.phone,
            "address": new_user.address,
            "doctorProfile": new_user.doctorProfile # Include full doctor profile if exists
        }
    }

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    if not prisma.is_connected():
        await prisma.connect()

    user = await prisma.user.find_unique(
        where={"email": user_data.email},
        include={"doctorProfile": True}
    )

    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    verification_status = None
    if user.doctorProfile:
        verification_status = user.doctorProfile.verificationStatus

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name,
            "profilePicture": user.profilePicture,
            "verificationStatus": verification_status,
            "age": user.age,
            "sex": user.sex,
            "phone": user.phone,
            "address": user.address,
            "doctorProfile": user.doctorProfile # Include full doctor profile
        }
    }

from schemas import FamilyLoginRequest

@router.post("/family/login")
async def login_family_member(request: FamilyLoginRequest):
    if not prisma.is_connected():
        await prisma.connect()

    # Find family member
    member = await prisma.familymember.find_unique(
        where={'username': request.username},
        include={'guardian': True}
    )

    if not member or not member.allowLogin:
        raise HTTPException(status_code=401, detail="Invalid credentials or login not enabled")
    
    # Verify password (simple check for now)
    if member.password != request.password:
         raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate Token
    # Use Guardian's ID as sub but add family claims
    access_token_expires = timedelta(minutes=60 * 24)
    access_token = create_access_token(
        data={
            "sub": str(member.guardian.email), 
            "id": member.guardian.id,
            "role": member.guardian.role,
            "family_member_id": member.id,
            "is_family_session": True
        }
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": member.guardian.id,
            "name": member.guardian.name,
            "email": member.guardian.email,
            "role": member.guardian.role,
            "profilePicture": member.guardian.profilePicture
        },
        "activeProfile": {
            "id": member.id,
            "name": member.name,
            "type": "family",
            "profilePicture": member.profilePicture
        }
    }
