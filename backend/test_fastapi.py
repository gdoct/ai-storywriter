import pytest
from fastapi.testclient import TestClient
from main import app

# Create a test client
client = TestClient(app)

def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["framework"] == "FastAPI"

def test_api_docs_accessible():
    """Test that API documentation is accessible"""
    response = client.get("/api/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

def test_openapi_json():
    """Test that OpenAPI JSON schema is accessible"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert data["info"]["title"] == "StoryWriter API"

def test_auth_signup_validation():
    """Test auth signup endpoint validation"""
    # Test missing required fields
    response = client.post("/api/signup", json={})
    assert response.status_code == 422  # Validation error
    
    # Test with invalid email
    response = client.post("/api/signup", json={
        "username": "test",
        "email": "invalid-email",
        "password": "testpass123"
    })
    assert response.status_code == 422  # Validation error

def test_auth_login_validation():
    """Test auth login endpoint validation"""
    # Test missing required fields
    response = client.post("/api/login", json={})
    assert response.status_code == 422  # Validation error
    
    # Test with invalid email
    response = client.post("/api/login", json={
        "email": "invalid-email",
        "password": "testpass"
    })
    assert response.status_code == 422  # Validation error

if __name__ == "__main__":
    pytest.main([__file__, "-v"])