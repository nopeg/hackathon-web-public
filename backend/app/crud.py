from app.database import get_db
from app.schemas import (
    UserCreate, 
    UserInDB, 
    UserPublic, 
    HackathonCreate, 
    HackathonPublic, 
    HackathonUpdate, 
    ParticipantPublic,
    HackathonStatus
    )
from datetime import datetime, timedelta
from app.utils.security import get_password_hash
from app.utils.email_utils import generate_verification_token
import logging
from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.core.config import settings
from typing import List

logger = logging.getLogger(__name__)

def create_user(user: UserCreate) -> UserPublic:
    try:
        with get_db() as conn, conn.cursor() as cur:
            hashed_password = get_password_hash(user.password)
            username = user.email.split('@')[0]
            
            cur.execute(
                """INSERT INTO users 
                (email, hashed_password, username, is_verified)
                VALUES (%s, %s, %s, %s)
                RETURNING id, email, username, is_verified, created_at""",
                (user.email, hashed_password, username, False)
            )
            
            result = cur.fetchone()
            if not result:
                raise ValueError("User creation failed - no data returned")
            
            verification_token = generate_verification_token(user.email)
            expires_at = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            
            cur.execute(
                """INSERT INTO verification_tokens 
                (user_email, token, expires_at)
                VALUES (%s, %s, %s)""",
                (user.email, verification_token, expires_at)
            )
            
            conn.commit()
            
            return UserPublic(
                id=result[0],
                email=result[1],
                username=result[2],
                is_verified=result[3],
                created_at=result[4]
            )
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error in create_user: {str(e)}")
        raise

def verify_user_email(token: str) -> str:
    try:
        with get_db() as conn, conn.cursor() as cur:
            cur.execute(
                """SELECT user_email FROM verification_tokens 
                WHERE token = %s AND expires_at > NOW()""",
                (token,)
            )
            result = cur.fetchone()
            
            if not result:
                return None
                
            user_email = result[0]

            cur.execute(
                "UPDATE users SET is_verified = TRUE WHERE email = %s",
                (user_email,)
            )
            
            cur.execute(
                "DELETE FROM verification_tokens WHERE token = %s",
                (token,)
            )
            
            conn.commit()
            return user_email
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error in verify_user_email: {str(e)}")
        raise

def get_verification_token(email: str) -> str | None:
    try:
        with get_db() as conn, conn.cursor() as cur:
            cur.execute(
                """SELECT token FROM verification_tokens 
                WHERE user_email = %s AND expires_at > NOW()""",
                (email,)
            )
            result = cur.fetchone()
            return result[0] if result else None
    except Exception as e:
        logger.error(f"Database error in get_verification_token: {str(e)}")
        raise

def get_user_by_email(email: str) -> UserInDB | None:
    try:
        with get_db() as conn, conn.cursor() as cur:
            cur.execute(
                """SELECT id, email, hashed_password, username, is_verified, created_at 
                FROM users WHERE email = %s""",
                (email,)
            )
            result = cur.fetchone()
            
            if not result:
                return None
                
            return UserInDB(
                id=result[0],
                email=result[1],
                hashed_password=result[2],
                username=result[3],
                is_verified=result[4],
                created_at=result[5]
            )
    except Exception as e:
        logger.error(f"Database error in get_user_by_email: {str(e)}")
        raise
    
def get_current_user(token: str):
    """Получаем пользователя по токену"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        return user
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
   
def create_hackathon(hackathon: HackathonCreate, organizer_id: int) -> HackathonPublic:
    with get_db() as conn, conn.cursor() as cur:
        try:
            now = datetime.utcnow()
            start_date = datetime.fromisoformat(hackathon.start_date)
            end_date = datetime.fromisoformat(hackathon.end_date)
            reg_start = datetime.fromisoformat(hackathon.registration_start)
            
            if start_date <= now:
                raise HTTPException(
                    status_code=400,
                    detail="Дата начала должна быть в будущем"
                )
            if end_date <= start_date:
                raise HTTPException(
                    status_code=400,
                    detail="Дата окончания должна быть после даты начала"
                )
            if reg_start >= start_date:
                raise HTTPException(
                    status_code=400,
                    detail="Регистрация должна начинаться до начала хакатона"
                )
            
            status = HackathonStatus.PLANNED
            if now >= reg_start:
                status = HackathonStatus.REGISTRATION
            if now >= start_date:
                status = HackathonStatus.ACTIVE
            if now > end_date:
                status = HackathonStatus.COMPLETED
                
            cur.execute("""
                INSERT INTO hackathons (
                    organizer_id, title, description,
                    start_date, end_date, location,
                    registration_start, image_url,
                    max_participants, current_participants, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING 
                    id, organizer_id, title, description,
                    start_date, end_date, location,
                    registration_start, image_url,
                    max_participants, current_participants, status
            """, (
                organizer_id,
                hackathon.title,
                hackathon.description,
                hackathon.start_date,
                hackathon.end_date,
                hackathon.location,
                hackathon.registration_start,
                hackathon.image_url,
                hackathon.max_participants, 
                0,
                status.value
            ))

            row = cur.fetchone()
            conn.commit()

            columns = [
                'id', 'organizer_id', 'title', 'description',
                'start_date', 'end_date', 'location',
                'registration_start', 'image_url',
                'max_participants', 'current_participants', 'status'
            ]
            return HackathonPublic(**dict(zip(columns, row)))   
        except Exception as e:
            conn.rollback()
            print(f"[ERROR] Database error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create hackathon")



def update_hackathon(hackathon_id: int, data: HackathonUpdate, organizer_id: int) -> HackathonPublic:
    """Обновление данных хакатона"""
    with get_db() as conn, conn.cursor() as cur:
        try:
            cur.execute(
                """
                UPDATE hackathons
                SET 
                    title = COALESCE(%s, title),
                    description = COALESCE(%s, description),
                    end_date = COALESCE(%s, end_date),
                    image_url = COALESCE(%s, image_url)
                WHERE id = %s AND organizer_id = %s
                RETURNING *
                """,
                (
                    data.title,
                    data.description,
                    data.end_date,
                    data.image_url,
                    hackathon_id,
                    organizer_id
                )
            )
            result = cur.fetchone()
            if not result:
                raise HTTPException(404, "Hackathon not found")
            conn.commit()
            return HackathonPublic(**dict(zip([
                'id', 'organizer_id', 'title', 'description',
                'start_date', 'end_date', 'location', 'registration_start', 
                'image_url', 'max_participants', 'status', 'current_participants'
            ], result)))
        except Exception as e:
            conn.rollback()
            logger.error(f"Error updating hackathon: {str(e)}")
            raise HTTPException(500, "Database error")

def delete_hackathon(hackathon_id: int, organizer_id: int) -> bool:
    """Удаление хакатона"""
    with get_db() as conn, conn.cursor() as cur:
        try:
            cur.execute(
                "DELETE FROM hackathons WHERE id = %s AND organizer_id = %s",
                (hackathon_id, organizer_id)
            )
            if cur.rowcount == 0:
                raise HTTPException(404, "Hackathon not found")
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            logger.error(f"Error deleting hackathon: {str(e)}")
            raise HTTPException(500, "Database error")

def get_hackathons_by_organizer(organizer_id: int) -> List[HackathonPublic]:
    """Получение хакатонов организатора"""
    with get_db() as conn, conn.cursor() as cur:
        try:
            cur.execute(
                "SELECT * FROM hackathons WHERE organizer_id = %s",
                (organizer_id,)
            )
            results = cur.fetchall()
            return [
                HackathonPublic(**dict(zip([
                    'id', 'organizer_id', 'title', 'description',
                    'start_date', 'end_date', 'location', 'registration_start', 
                    'image_url', 'max_participants', 'status', 'current_participants'
                ], row))) for row in results
            ]
        except Exception as e:
            logger.error(f"Error fetching hackathons: {str(e)}")
            raise HTTPException(500, "Database error")
        
        
        
        
def add_participant(hackathon_id: int, user_id: int) -> ParticipantPublic:
    """Добавление участника в хакатон"""
    with get_db() as conn, conn.cursor() as cur:
        try:
            cur.execute(
                "SELECT current_participants, max_participants FROM hackathons WHERE id = %s",
                (hackathon_id,)
            )
            result = cur.fetchone()
            if not result:
                raise HTTPException(404, "Hackathon not found")
            current, max_p = result

            if current >= max_p:
                raise HTTPException(400, "Hackathon is full")

            cur.execute(
                """
                INSERT INTO hackathon_participants (hackathon_id, user_id)
                VALUES (%s, %s)
                RETURNING hackathon_id, user_id, registration_date
                """,
                (hackathon_id, user_id)
            )
            result = cur.fetchone()

            cur.execute(
                "UPDATE hackathons SET current_participants = current_participants + 1 WHERE id = %s",
                (hackathon_id,)
            )
            conn.commit()
            return ParticipantPublic(**dict(zip(
                ['hackathon_id', 'user_id', 'registration_date'],
                result
            )))
        except Exception as e:
            conn.rollback()
            logger.error(f"Error adding participant: {str(e)}")
            raise HTTPException(500, "Database error")

def remove_participant(hackathon_id: int, user_id: int) -> bool:
    """Удаление участника"""
    with get_db() as conn, conn.cursor() as cur:
        try:
            cur.execute(
                "DELETE FROM hackathon_participants WHERE hackathon_id = %s AND user_id = %s",
                (hackathon_id, user_id)
            )
            if cur.rowcount == 0:
                raise HTTPException(404, "Participant not found")

            cur.execute(
                "UPDATE hackathons SET current_participants = current_participants - 1 WHERE id = %s",
                (hackathon_id,)
            )
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            logger.error(f"Error removing participant: {str(e)}")
            raise HTTPException(500, "Database error")

def get_participants(hackathon_id: int) -> List[ParticipantPublic]:
    """Получение списка участников"""
    with get_db() as conn, conn.cursor() as cur:
        try:
            cur.execute(
                "SELECT * FROM hackathon_participants WHERE hackathon_id = %s",
                (hackathon_id,)
            )
            results = cur.fetchall()
            return [
                ParticipantPublic(**dict(zip(
                    ['hackathon_id', 'user_id', 'registration_date'],
                    row
                ))) for row in results
            ]
        except Exception as e:
            logger.error(f"Error fetching participants: {str(e)}")
            raise HTTPException(500, "Database error")