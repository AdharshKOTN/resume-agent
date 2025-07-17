from flask import Blueprint, request, jsonify
from app.service import transcribe_audio

transcribe_blueprint = Blueprint('transcribe', __name__)

@transcribe_blueprint.route("/transcribe", methods=["POST"])
def transcribe():
    file = request.files.get("audio")
    if not file:
        return jsonify({"error": "No audio file provided"}), 400
    
    text = transcribe_audio(file)
    return jsonify({"text": text})
