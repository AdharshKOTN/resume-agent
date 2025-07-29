from flask_socketio import emit
import whisper
import traceback

import tempfile
import requests
import os

import time

from app.services.llm import generate_response
# from app.services.voice.voice import voice_conversion

# import sys
import os
from pathlib import Path
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

import logging
logger = logging.getLogger(__name__)

def register_socketio_handlers(socketio):

    @socketio.on("start_stream")
    def handle_start_stream(data):
        session_id = data["session_id"]
        logging.debug(f"🟢 Started stream: {session_id}")

    @socketio.on("end_stream")
    def handle_end_stream(data):
        session_id = data["session_id"]
        audio_bytes = data["blob"]

        start = time.time()

        try:
            # Transcription from audio bytes
            logger.debug(f"🔊 Handling stream end: {session_id}, blob size: {len(audio_bytes)}")

            # TODO: update to REST call to microservice
            # text = transcribe_audio(audio_bytes)
            text = requests.post("http://localhost:5002/transcribe", data=audio_bytes)

            logging.debug(f"🧠 Transcribed ({session_id}): {text}")
            emit("transcript", {"session_id": session_id, "text": text})

            # return LLM response
            llm_response = generate_response(text)
            duration = round(time.time() - start, 2)
            logging.debug(f"⏱️ LLM response time: {duration:.2f} seconds")
            logging.debug(f"🤖 LLM response ({session_id}): {llm_response}, datatype: {type(llm_response)}")
            emit("agent_response", {"session_id": session_id, "text": llm_response, "duration": duration})

        except Exception as e:
            logging.exception(f"❌ Transcription error: {traceback.format_exc()}")
            emit("transcript", {"session_id": session_id, "text": "[ERROR] Unable to transcribe."})
