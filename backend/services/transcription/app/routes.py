from flask import Blueprint, request, jsonify
from app.service import transcribe_audio

transcribe_blueprint = Blueprint('transcribe', __name__)

@transcribe_blueprint.route("/transcribe", methods=["POST"])
def transcribe():
    
    audio_bytes = request.files["audio_file"].read()
    
    try:
        text = transcribe_audio(audio_bytes=audio_bytes)

        return text, 200

    # return the text as the REST response
    except Exception as e:
        return "Transcription Error", 500