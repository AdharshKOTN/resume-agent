from flask import Flask
from flask_cors import CORS
import logging
from flask_socketio import SocketIO

from app.config import Config

from app.routes.socket_handlers import register_socketio_handlers

# socketio = SocketIO(cors_allowed_origins=[Config.FRONTEND_ORIGIN])

def create_app():
    app = Flask(__name__)
    
    # Logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s %(levelname)s: %(message)s'
    )
    app.logger.setLevel(logging.DEBUG)

    # Load configuration
    # This will load environment variables from .env file
    app.config.from_object(Config)

    print(f"APP LOADED WITH CONFIG: {app.config['FRONTEND_ORIGIN']}")

    # CORS for REST endpoints (optional)
    CORS(app, origins=app.config['FRONTEND_ORIGIN'])

    # SocketIO — INIT WITH APP HERE
    socketio = SocketIO(
        app,
        cors_allowed_origins=app.config['FRONTEND_ORIGIN'],
        async_mode="eventlet",
        logger=True,
        engineio_logger=True
    )

    register_socketio_handlers(socketio)
    return app, socketio
