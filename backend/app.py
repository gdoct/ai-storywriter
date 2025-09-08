"""
Root app.py for backward compatibility.
This file maintains compatibility with existing scripts and Docker configurations
by importing and running the main FastAPI application from the new api/ directory.
"""

from api.app import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)