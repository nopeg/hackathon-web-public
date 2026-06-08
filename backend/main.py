from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth, hackathon, editor
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os


def updated_app() -> FastAPI:
    app = FastAPI()

    # ИСПРАВЛЕНО: конкретные домены вместо "*"
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://hackathon-web-public.onrender.com",  # ваш фронтенд
            "http://localhost:3000",                       # локальная разработка
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(hackathon.router)
    app.include_router(editor.router)

    app.mount("/static", StaticFiles(directory="static"), name="static")

    return app


app = updated_app()


@app.get("/static/uploads/{filename}")
async def get_image(filename: str):
    file_path = f"static/uploads/{filename}"
    
    # Проверка существования файла
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Определение MIME-типа по расширению файла
    if filename.lower().endswith((".jpg", ".jpeg")):
        media_type = "image/jpeg"
    elif filename.lower().endswith(".png"):
        media_type = "image/png"
    else:
        media_type = "application/octet-stream"
    
    # Отправка файла с правильным Content-Type
    return FileResponse(
        file_path,
        media_type=media_type,
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/")
async def root():
    return {"message": "API работает!"}