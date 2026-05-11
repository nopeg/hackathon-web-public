from fastapi import APIRouter, Depends, HTTPException, UploadFile, Request
from pydantic import ValidationError
from app.schemas import HackathonCreate, HackathonUpdate, HackathonPublic
from app.crud import (
    create_hackathon,
    update_hackathon,
    delete_hackathon,
    get_hackathons_by_organizer,
    get_current_user
)
from app.database import get_db
from app.core.config import settings
from typing import List
import os
import uuid
import logging
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/api/editor", tags=["editor"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/hackathons", response_model=HackathonPublic)
async def create_hackathon_endpoint(
    hackathon: HackathonCreate,
    token: str = Depends(oauth2_scheme)
):
    try:
        user = get_current_user(token)
        return create_hackathon(hackathon, user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hackathons", response_model=List[HackathonPublic])
async def get_all_hackathons():
    """Получение списка всех хакатонов"""
    with get_db() as conn, conn.cursor() as cur:
        try:
            cur.execute("""
                SELECT id, organizer_id, title, description,
                    start_date, end_date, location,
                    registration_start,
                    image_url, max_participants, current_participants, status
                FROM hackathons
                ORDER BY start_date DESC
            """)
            
            columns = [
                'id', 'organizer_id', 'title', 'description',
                'start_date', 'end_date', 'location', 'registration_start',
                'image_url', 'max_participants', 'current_participants', 'status'
            ]
            
            return [HackathonPublic(**dict(zip(columns, row))) for row in cur.fetchall()]
            
        except Exception as e:
            logger.error(f"Database error in get_all_hackathons: {str(e)}")
            raise HTTPException(500, "Could not fetch hackathons")

@router.put("/hackathons/{hackathon_id}", response_model=HackathonPublic)
async def update_hackathon_endpoint(
    hackathon_id: int,
    hackathon: HackathonUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Обновление данных хакатона"""
    try:
        return update_hackathon(hackathon_id, hackathon, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating hackathon: {str(e)}")
        raise HTTPException(500, "Failed to update hackathon")

@router.delete("/hackathons/{hackathon_id}")
async def delete_hackathon_endpoint(
    hackathon_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Удаление хакатона"""
    try:
        delete_hackathon(hackathon_id, current_user.id)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting hackathon: {str(e)}")
        raise HTTPException(500, "Failed to delete hackathon")

@router.post("/upload-image")
async def upload_image(file: UploadFile, request: Request):
    """Загрузка изображения для хакатона"""
    try:
        logger.info(f"Received file: {file.filename}")
        
        if not file.content_type.startswith("image/"):
            raise HTTPException(400, "Only images allowed")

        UPLOAD_DIR = "/app/static/uploads"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        file_ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        image_url = f"/static/uploads/{filename}"
        logger.info(f"Generated URL: {image_url}")
        return {"url": image_url}
        
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(500, "Image upload failed")