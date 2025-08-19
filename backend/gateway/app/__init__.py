from flask import Flask
from flask_cors import CORS
import logging
from flask_socketio import SocketIO

from app.config import Config

from app.routes.socket_handlers import register_socketio_handlers
from app.routes.health import health_bp

# socketio = SocketIO(cors_allowed_origins=[Config.FRONTEND_ORIGIN])

def create_app():
    app = Flask(__name__)
    
    # Logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s %(levelname)s: %(message)s'
    )
    app.logger.setLevel(logging.DEBUG)

    file_handler = logging.FileHandler("app.log")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s'))
    app.logger.addHandler(file_handler)

    # Load configuration
    # This will load environment variables from .env file
    app.config.from_object(Config)

    app.logger.info(f"APP LOADED WITH CONFIG: {app.config['FRONTEND_ORIGIN']}")

    # Enable CORS for the frontend origin
    # This allows the frontend to make requests to the backend
    # CORS is configured to allow requests from the specified frontend origins
    CORS(app, origins=app.config['FRONTEND_ORIGIN'])

    # Initialize Flask-SocketIO
    # Use eventlet for async mode, allows for long-polling and WebSocket support and is suitable for production
    # Set logger and engineio_logger to True for debugging purposes
    # This will log all events and messages to the console

    app.register_blueprint(health_bp)

    socketio = SocketIO(
        app,
        cors_allowed_origins=app.config['FRONTEND_ORIGIN'],
        async_mode="eventlet",
        logger=True,
        engineio_logger=True
    )

    # pass the socketio instance to the handlers
    # This allows the handlers to emit events
    # and use the socketio instance directly
    register_socketio_handlers(socketio)

    return app, socketio
