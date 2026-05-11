import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from jose import jwt
from app.core.config import settings

def generate_verification_token(email: str, expire_delta: timedelta | None = None) -> str:
    
    if expire_delta:
        expire = datetime.utcnow() + expire_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": email,
        "exp": expire,
        "type": "verification"
    }
    
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

async def send_verification_email(email_to: str, verification_url: str):
    subject = "Подтверждение регистрации"
    
    body = f"""
    <html>
        <body>
            <p>Для подтверждения email перейдите по ссылке:</p>
            <p><a href="{verification_url}">Подтвердить email</a></p>
            <p>Ссылка действительна 1 час.</p>
        </body>
    </html>
    """
    
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = email_to
    
    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return False