import logging
import os
from datetime import timedelta

from controllers.auth_controller import auth_bp
from controllers.dashboard_controller import dashboard_bp
from controllers.payment_controller import payment_bp
from controllers.scenario_controller import scenario_bp
from controllers.settings_controller import settings_controller
from data.db import DB_PATH, init_db
from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from llm_services.llm_proxy_controller import llm_proxy

# Load environment variables (if any)
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")

# Configure logging to only show errors
if not app.debug:
    # Disable werkzeug request logging in production
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    
# Set Flask app logging to WARNING level to reduce noise
app.logger.setLevel(logging.WARNING)

# Configure JWT
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "default-dev-secret-key")  # Change in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=365)  # 1 year token expiry

# Initialize extensions
jwt = JWTManager(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Configure CORS for API endpoints

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(scenario_bp)
app.register_blueprint(llm_proxy)
app.register_blueprint(settings_controller)

# Initialize DB on app startup
if not os.path.exists(DB_PATH):
    print("Initializing database...")
    init_db()

# Static file routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'database': 'connected'}), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
