import psycopg2
from psycopg2 import pool, errors
from contextlib import contextmanager
from app.core.config import settings
from app.utils.security import get_password_hash
import logging

logger = logging.getLogger(__name__)

connection_pool = pool.SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    host=settings.DB_HOST,
    database=settings.DB_NAME,
    user=settings.DB_USER,
    password=settings.DB_PASSWORD
)

@contextmanager
def get_db():
    conn = connection_pool.getconn()
    try:
        yield conn
    finally:
        connection_pool.putconn(conn)

def init_db():
    """Создание таблиц и тестовых данных при старте"""
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    is_verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS verification_tokens (
                    id SERIAL PRIMARY KEY,
                    user_email VARCHAR(255) NOT NULL,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS hackathons (
                    id SERIAL PRIMARY KEY,
                    organizer_id INT NOT NULL REFERENCES users(id),
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    start_date TIMESTAMP NOT NULL,
                    end_date TIMESTAMP NOT NULL,
                    location VARCHAR(255) NOT NULL,
                    registration_start TIMESTAMP NOT NULL,
                    image_url TEXT,
                    max_participants INT NOT NULL,
                    current_participants INT DEFAULT 0,
                    status VARCHAR(50) DEFAULT 'planned'
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS hackathon_participants (
                    hackathon_id INT REFERENCES hackathons(id) ON DELETE CASCADE,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    registration_date TIMESTAMP DEFAULT NOW(),
                    PRIMARY KEY (hackathon_id, user_id)
                )
            """)

            cur.execute("SELECT id FROM users WHERE email = %s", (settings.MAIL1,))
            if not cur.fetchone():
                hashed_password = get_password_hash(settings.PASSWORD1)
                cur.execute(
                    """INSERT INTO users (email, username, hashed_password, is_verified)
                    VALUES (%s, %s, %s, %s)""",
                    (settings.MAIL1, settings.NAME1, hashed_password, True)
                )
                logger.info("Test user created successfully")

            cur.execute("SELECT COUNT(*) FROM hackathons")
            if cur.fetchone()[0] == 0:
                cur.execute("SELECT id FROM users WHERE email = %s", (settings.MAIL1,))
                user_id = cur.fetchone()[0]

                cur.execute("""
                    INSERT INTO hackathons (
                        organizer_id, title, description,
                        start_date, end_date, location,
                        registration_start,
                        image_url, max_participants, status
                    ) VALUES (
                        %s, %s, %s, %s,
                        %s, %s, %s,
                        %s, %s, %s
                    )
                """, (
                    user_id,
                    "Тестовый хакатон 2025",
                    "Это тестовый хакатон для проверки работы системы",
                    "2025-06-01 10:00:00",  # start_date
                    "2090-06-03 18:00:00",  # end_date
                    "Онлайн",
                    "2025-05-20 00:00:00",  # registration_start
                    "https://upload.wikimedia.org/wikipedia/commons/c/c7/Microsoft_Bob_Logo.png",
                    100,
                    0
                ))
                logger.info("Test hackathon created successfully")

            conn.commit()

        except errors.UniqueViolation as e:
            conn.rollback()
            logger.warning(f"User already exists: {e}")
        except Exception as e:
            conn.rollback()
            logger.error(f"Database initialization failed: {str(e)}")
            raise
        finally:
            cur.close()