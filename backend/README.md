# Backend

This is the backend for the Story Writer app.

- Framework: Python (FastAPI)
- Serves static files from the frontend build directory
- Comprehensive REST API with automatic OpenAPI documentation

## Development

Install dependencies:
```
pip install -r requirements.txt
```

Run the FastAPI backend:
```
python app.py
```

Or using uvicorn directly:
```
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

## API Documentation

Visit http://localhost:5000/api/docs for interactive API documentation.

In release mode, make sure the frontend is built in `../frontend/build`.
