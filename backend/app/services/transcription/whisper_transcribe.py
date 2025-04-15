from flask import Blueprint, request, jsonify
import whisper

import logging
logger = logging.getLogger(__name__)

transcribe_bp = Blueprint('transcribe', __name__)

# Load Whisper model once at startup
model = whisper.load_model("base")

def transcribe():
    try:
        return 'Success', 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
