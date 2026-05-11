from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from app.schemas import HackathonPublic, UserPublic
from app.database import get_db
from app.crud import (
    get_current_user,
    add_participant
)
from fastapi.security import OAuth2PasswordBearer
import logging
import psycopg2

router = APIRouter(prefix="/api", tags=["hackathons"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("/hackathons", response_model=List[HackathonPublic])
async def get_all_hackathons():
    """Получение списка всех хакатонов с подробным логированием"""
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                logger.info("Executing SQL query to fetch hackathons")

                cur.execute("""
                    SELECT 
                        id, organizer_id, title, description,
                        start_date, end_date, location,
                        registration_start,
                        image_url, max_participants, current_participants, status
                    FROM hackathons
                    ORDER BY start_date DESC
                """)
                
                columns = [desc[0] for desc in cur.description]
                results = cur.fetchall()

                logger.info(f"Found {len(results)} hackathons in database")
                
                if not results:
                    logger.info("No hackathons found in database")
                    return []

                hackathons = []
                for row in results:
                    try:
                        row_dict = dict(zip(columns, row))
                        hackathon = HackathonPublic(**row_dict)
                        hackathons.append(hackathon)
                    except Exception as convert_error:
                        logger.error(f"Error converting row: {convert_error}")
                        continue
                
                return hackathons
                
    except psycopg2.OperationalError as op_err:
        logger.error(f"Database connection error: {op_err}")
        raise HTTPException(500, "Database connection failed")
    except psycopg2.Error as db_err:
        logger.error(f"Database error: {db_err}")
        raise HTTPException(500, "Database operation failed")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(500, "Could not fetch hackathons")
    
@router.get("/hackathons/{hackathon_id}", response_model=HackathonPublic)
async def get_hackathon_by_id(hackathon_id: int):
    """Получение конкретного хакатона по ID"""
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        id, organizer_id, title, description,
                        start_date, end_date, location,
                        registration_start, image_url,
                        max_participants, current_participants, status
                    FROM hackathons
                    WHERE id = %s
                """, (hackathon_id,))
                
                result = cur.fetchone()
                if not result:
                    raise HTTPException(status_code=404, detail="Hackathon not found")
                
                columns = [desc[0] for desc in cur.description]
                return HackathonPublic(**dict(zip(columns, result)))
                
    except psycopg2.Error as db_err:
        logger.error(f"Database error: {db_err}")
        raise HTTPException(500, "Database operation failed")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(500, "Could not fetch hackathon")
    
@router.post("/hackathons/{hackathon_id}/join", response_model=HackathonPublic)
async def join_hackathon(
    hackathon_id: int,
    token: str = Depends(oauth2_scheme)
):
    """Присоединение к хакатону (требуется Authorization header)"""
    try:
        current_user = get_current_user(token)
        with get_db() as conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    id, organizer_id, title, description,
                    start_date, end_date, location, registration_start,
                    image_url, max_participants, current_participants, status
                FROM hackathons 
                WHERE id = %s
                FOR UPDATE""",
                (hackathon_id,)
            )
            hackathon_row = cur.fetchone()
            
            if not hackathon_row:
                raise HTTPException(status_code=404, detail="Хакатон не найден")

            columns = [
                'id', 'organizer_id', 'title', 'description',
                'start_date', 'end_date', 'location', 'registration_start',
                'image_url', 'max_participants', 'current_participants', 'status'
            ]
            hackathon = dict(zip(columns, hackathon_row))

            now = datetime.utcnow()
            registration_start = hackathon['registration_start']
            start_date = hackathon['start_date']
            current_p = int(hackathon['current_participants'])
            max_p = int(hackathon['max_participants'])

            if now < registration_start:
                raise HTTPException(400, "Регистрация еще не началась")
            if now >= start_date:
                raise HTTPException(400, "Хакатон уже начался")
            if current_p >= max_p:
                raise HTTPException(400, "Достигнут лимит участников")

            cur.execute("""
                INSERT INTO hackathon_participants (hackathon_id, user_id)
                VALUES (%s, %s)
                ON CONFLICT (hackathon_id, user_id) DO NOTHING
                RETURNING 1""",
                (hackathon_id, current_user.id)
            )
            if not cur.fetchone():
                raise HTTPException(400, "Вы уже участвуете")

            cur.execute("""
                UPDATE hackathons 
                SET current_participants = current_participants + 1 
                WHERE id = %s
                RETURNING 
                    id, organizer_id, title, description,
                    start_date, end_date, location, registration_start,
                    image_url, max_participants, current_participants, status""",
                (hackathon_id,)
            )
            
            updated_row = cur.fetchone()
            conn.commit()

            return HackathonPublic(**dict(zip(columns, updated_row)))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка: {str(e)}", exc_info=True)
        raise HTTPException(500, "Внутренняя ошибка сервера")
    