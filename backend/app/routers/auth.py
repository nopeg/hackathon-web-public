from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.utils.security import create_access_token, verify_password, decode_token
from app.schemas import UserCreate, Token, UserPublic
from app.core.config import settings
from app.crud import get_user_by_email, create_user, verify_user_email, get_verification_token
from app.utils.email_utils import send_verification_email
import logging
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_email(form_data.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
        
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your email."
        )
    
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "email": user.email
    }


@router.post("/register", response_model=UserPublic)
async def register(request: Request, user: UserCreate):
    try:
        existing_user = get_user_by_email(user.email)
        if existing_user:
            if existing_user.is_verified:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered and verified"
                )
            else:
                token = get_verification_token(user.email)
                host = request.headers.get("X-Forwarded-Host", request.url.hostname)
                scheme = "https"
                verification_url = f"{scheme}://{host}/api/auth/verify-email?token={token}"
                await send_verification_email(user.email, verification_url)
                raise HTTPException(
                    status_code=status.HTTP_200_OK,
                    detail="Verification email resent"
                )
        
        new_user = create_user(user)
        token = get_verification_token(user.email)
        
        if token:
            host = request.headers.get("X-Forwarded-Host", request.url.hostname)
            scheme = "https"
            verification_url = f"{scheme}://{host}/api/auth/verify-email?token={token}"
            await send_verification_email(user.email, verification_url)
        
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/verify-email")
async def verify_email(token: str, request: Request):
    try:
        user_email = verify_user_email(token)
        user = get_user_by_email(user_email)
        access_token = create_access_token(data={"sub": user.email})

        params = {
            'access_token': access_token,
            'username': user.username,
            'email': user.email,
            'user_id': user.id,
            'status': 'success'
        }
        
        frontend_url = f"/verify-email?{urlencode(params)}"
        return RedirectResponse(url=frontend_url)
        
    except Exception as e:
        error_params = {'status': 'error', 'message': str(e)}
        error_url = f"/verify-email?{urlencode(error_params)}"
        return RedirectResponse(url=error_url)

@router.get("/me", response_model=UserPublic)
async def read_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    user = get_user_by_email(payload.get("sub"))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    
    return {
        "username": user.username,
        "email": user.email,
        "id": user.id,
        "is_verified": user.is_verified,
        "created_at": user.created_at
    }