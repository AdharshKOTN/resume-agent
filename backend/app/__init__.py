from flask import Flask
from flask_cors import CORS
import logging
from flask_socketio import SocketIO

# import os
# import sys

# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

socketio = SocketIO(cors_allowed_origins='http://localhost:3000')

def create_app():
    app = Flask(__name__)
    
    # Setup logging
    logging.basicConfig(
        level=logging.DEBUG,  # Or INFO in production
        # format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        format='%(asctime)s %(levelname)s: %(message)s'
    )

    # logging.getLogger("numba").setLevel(logging.WARNING)
    # logging.getLogger("transformers").setLevel(logging.WARNING)
    # logging.getLogger("matplotlib").setLevel(logging.WARNING)
    # logging.getLogger("librosa").setLevel(logging.WARNING)
    # logging.getLogger("openvoice").setLevel(logging.WARNING)
    app.logger.setLevel(logging.DEBUG)

    CORS(app, origins=["http://localhost:3000"]) 

    from .routes import socket_handlers

    socketio.init_app(app)

    return app
