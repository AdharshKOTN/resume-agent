from flask import Flask
from flask_cors import CORS
from app.routes.transcribe import transcribe_bp
import logging
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins='http://localhost:3000')

def create_app():
    app = Flask(__name__)
    
    # Setup logging
    logging.basicConfig(
        level=logging.DEBUG,  # Or INFO in production
        format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    )
    app.logger.setLevel(logging.DEBUG)

    CORS(app, origins=["http://localhost:3000"]) 

    # Register Blueprints
    app.register_blueprint(transcribe_bp)

    # You can add more config, extensions, or error handlers here later
    from .routes import socket_handlers

    socketio.init_app(app)

    return app
