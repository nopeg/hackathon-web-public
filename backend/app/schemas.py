from pydantic import BaseModel, EmailStr, Field, ConfigDict, HttpUrl, validator
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel
from enum import Enum

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=32, description="Пароль должен быть 6-32 символа")

class UserInDB(UserBase):
    id: int
    username: str
    hashed_password: str
    is_verified: bool = False
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserPublic(UserBase):
    id: int
    username: str
    created_at: datetime
    is_verified: bool
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int

class TokenData(BaseModel):
    email: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    data: Optional[Token] = None
    error: Optional[str] = None
    status: Optional[int] = None

class HackathonBase(BaseModel):
    title: str = Field(..., max_length=32)
    description: str = Field(..., max_length=500)
    
class HackathonStatus(int, Enum):
    PLANNED = 0
    REGISTRATION = 1
    ACTIVE = 2
    COMPLETED = 3

class HackathonCreate(BaseModel):
    organizer_id: int = 0
    title: str = ""
    description: str = ""
    start_date: str
    end_date: str
    location: str
    registration_start: str
    image_url: str = ""
    max_participants: int = 0
    status: HackathonStatus = HackathonStatus.PLANNED
    current_participants: int = 0

    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' not in values:
            raise ValueError('start_date is required')
            
        if v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

class HackathonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    end_date: Optional[datetime] = None
    image_url: Optional[HttpUrl] = None

class HackathonPublic(BaseModel):
    id: int
    organizer_id: int
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    location: str
    registration_start: datetime
    image_url: str
    max_participants: int 
    status: HackathonStatus
    current_participants: int

    @validator('start_date', 'end_date', 'registration_start', pre=True)
    def parse_dates(cls, value):
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value)
            except ValueError:
                raise ValueError("Invalid date format")
        return value

class ParticipantBase(BaseModel):
    user_id: int
    hackathon_id: int

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantPublic(ParticipantBase):
    registration_date: datetime

    model_config = ConfigDict(from_attributes=True)

class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    status: Optional[int] = None

class HackathonListResponse(ApiResponse):
    data: Optional[List[HackathonPublic]] = None

class ErrorResponse(ApiResponse):
    success: bool = False
    error: str
    status: int = 400