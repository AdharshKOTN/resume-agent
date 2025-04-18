from flask import Flask
from flask_cors import CORS
import logging
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins='http://localhost:3000')

def create_app():
    app = Flask(__name__)
    
    # Setup logging
    logging.basicConfig(
        level=logging.DEBUG,  # Or INFO in production
        # format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        format='%(asctime)s %(levelname)s: %(message)s'
    )
    app.logger.setLevel(logging.DEBUG)

    CORS(app, origins=["http://localhost:3000"]) 

    # Load configuration
    from .routes import socket_handlers

    socketio.init_app(app)

    return app
