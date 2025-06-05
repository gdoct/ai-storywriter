import os
from datetime import timedelta

# Import controllers
from auth_controller import auth_bp
from db import init_db
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from scenario_controller import scenario_bp

# Load environment variables (if any)
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")

# Configure JWT
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "default-dev-secret-key")  # Change in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=365)  # 1 year token expiry

# Initialize extensions
jwt = JWTManager(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Configure CORS for API endpoints

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(scenario_bp)

# Initialize DB on app startup
init_db()

# Static file routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
