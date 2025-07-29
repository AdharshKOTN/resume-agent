import whisper
import logging
import tempfile
# from pathlib import Path
from os import path, remove
logger = logging.getLogger(__name__)
# BASE_DIR = Path(__file__).resolve().parent.parent
# GENERATED_AUD_FILE = BASE_DIR / 'services' / 'voice' / 'outputs' / 'response.wav'

model = whisper.load_model("tiny.en")

def transcribe_audio(audio_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(mode="+wb", suffix=".webm", delete=False) as tmp_webm:
        tmp_webm.write(audio_bytes)
        tmp_webm_path = tmp_webm.name
 
    try:
        result = model.transcribe(tmp_webm_path, language="en")
        return str(result["text"]).strip()
    except Exception as e:
        logger.error(e)
        return "An error occured while transcribing"
    finally:
        if path.exists(tmp_webm_path):
            remove(tmp_webm_path)