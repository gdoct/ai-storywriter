import logging
import os
from datetime import timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from data.db import init_db
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
if not os.getenv("DEBUG"):
    logging.getLogger('uvicorn.access').setLevel(logging.ERROR)

# Initialize FastAPI app
app = FastAPI(
    title="StoryWriter API",
    description="API for creating, editing, and managing scenarios for AI story generation",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure more restrictively in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "default-dev-secret-key")
JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=365)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "framework": "FastAPI"}

# Import and register routers
from routers import (
    auth, scenario, chat, llm_proxy, settings, dashboard, marketplace, 
    image, character_photo, scenario_image, payment, moderation, role
)
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(scenario.router, prefix="/api", tags=["scenarios"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(llm_proxy.router, prefix="/api", tags=["llm"])
app.include_router(settings.router, prefix="/api", tags=["settings"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(marketplace.router, prefix="/api", tags=["marketplace"])
app.include_router(image.router, prefix="/api", tags=["images"])
app.include_router(character_photo.router, prefix="/api", tags=["character_photos"])
app.include_router(scenario_image.router, prefix="/api", tags=["scenario_images"])
app.include_router(payment.router, prefix="/api", tags=["payment"])
app.include_router(moderation.router, prefix="/api", tags=["moderation"])
app.include_router(role.router, prefix="/api", tags=["roles"])

# Serve React frontend static files (after API routes are registered)
frontend_build_path = Path(__file__).parent.parent / "frontend" / "build"
if frontend_build_path.exists():
    # Mount ALL static directories that React uses
    static_dirs = [
        ("static", "static"),  # Traditional React static folder
        ("assets", "assets"),  # Vite assets folder
        ("images", "images"),  # Custom images folder
    ]
    
    for url_path, dir_name in static_dirs:
        static_path = frontend_build_path / dir_name
        if static_path.exists():
            app.mount(f"/{url_path}", StaticFiles(directory=str(static_path)), name=f"static_{dir_name}")
    
    # Mount uploads directory for user-provided content
    uploads_path = Path(__file__).parent / "uploads"
    if uploads_path.exists():
        app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")
    
    # Serve specific root-level static files (avoiding the broad catch-all)
    @app.get("/favicon.ico")
    async def serve_favicon():
        file_path = frontend_build_path / "favicon.ico"
        if file_path.exists():
            return FileResponse(str(file_path), media_type="image/x-icon")
        raise HTTPException(status_code=404)
    
    @app.get("/manifest.json")
    async def serve_manifest():
        file_path = frontend_build_path / "manifest.json"
        if file_path.exists():
            return FileResponse(str(file_path), media_type="application/json")
        raise HTTPException(status_code=404)
    
    @app.get("/robots.txt")
    async def serve_robots():
        file_path = frontend_build_path / "robots.txt"
        if file_path.exists():
            return FileResponse(str(file_path), media_type="text/plain")
        raise HTTPException(status_code=404)
    
    # Serve specific logo files
    @app.get("/logo192.png")
    async def serve_logo192():
        file_path = frontend_build_path / "logo192.png"
        if file_path.exists():
            return FileResponse(str(file_path), media_type="image/png")
        raise HTTPException(status_code=404)
    
    @app.get("/logo512.png")
    async def serve_logo512():
        file_path = frontend_build_path / "logo512.png"
        if file_path.exists():
            return FileResponse(str(file_path), media_type="image/png")
        raise HTTPException(status_code=404)
    
    @app.get("/storywriter-logo.png")
    async def serve_storywriter_logo():
        file_path = frontend_build_path / "storywriter-logo.png"
        if file_path.exists():
            return FileResponse(str(file_path), media_type="image/png")
        raise HTTPException(status_code=404)
    
    @app.get("/storywriter-logo-32.png")
    async def serve_storywriter_logo32():
        file_path = frontend_build_path / "storywriter-logo-32.png"
        if file_path.exists():
            return FileResponse(str(file_path), media_type="image/png")
        raise HTTPException(status_code=404)
    
    @app.get("/storywriter-logo-48.png")
    async def serve_storywriter_logo48():
        file_path = frontend_build_path / "storywriter-logo-48.png"
        if file_path.exists():
            return FileResponse(str(file_path), media_type="image/png")
        raise HTTPException(status_code=404)
    
    @app.get("/storywriter-logo-64.png")
    async def serve_storywriter_logo64():
        file_path = frontend_build_path / "storywriter-logo-64.png"
        if file_path.exists():
            return FileResponse(str(file_path), media_type="image/png")
        raise HTTPException(status_code=404)
    
    # Serve React app at root
    @app.get("/")
    async def serve_frontend():
        index_path = frontend_build_path / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path), media_type="text/html")
        raise HTTPException(status_code=404, detail="Frontend not found")
    
    # Catch-all for React SPA routing (must be last)
    @app.get("/{full_path:path}")
    async def serve_spa_routes(full_path: str):
        # Don't serve frontend for API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # Don't serve frontend for mounted static paths (they should be handled by mounts)
        if full_path.startswith(("assets/", "static/", "images/", "uploads/")):
            raise HTTPException(status_code=404, detail="Static file not found")
        
        # Serve React app for all other routes (SPA routing)
        index_path = frontend_build_path / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path), media_type="text/html")
        
        raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level="info"
    )