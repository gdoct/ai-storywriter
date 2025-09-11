"""
Root app.py for backward compatibility.
This file maintains compatibility with existing scripts and Docker configurations
by importing and running the main FastAPI application from the new api/ directory.
"""

import os
from api.app import app

IS_DEBUG = os.getenv("IS_DEBUG", "False").lower() in ("true", "1", "t")

if __name__ == "__main__":
    import uvicorn
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv()
    
    # Get host and port from environment variables with defaults
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "5000"))
    
    print(f"Starting server on {host}:{port}")
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=IS_DEBUG,
        log_level="info"
    )