from flask_socketio import emit
from app import socketio
import whisper
import traceback

import tempfile
import os

import time

from app.services.llm import generate_response
from app.services.voice.voice import voice_conversion

streamers = {}
model = whisper.load_model("base")

@socketio.on("start_stream")
def handle_start_stream(data):
    session_id = data["session_id"]
    print(f"🟢 Started stream: {session_id}")

@socketio.on("end_stream")
def handle_end_stream(data):
    session_id = data["session_id"]
    audio_bytes = data["blob"]

    start = time.time()

    try:
        print(type(audio_bytes), len(audio_bytes))
        print(audio_bytes[:16])

        byte_list = list(audio_bytes[:8])
        print("🧪 Backend bytes preview:", byte_list)
        print("📏 Backend audio_bytes length:", len(audio_bytes))

        # 1. Save the raw blob as a .webm temp file
        with tempfile.NamedTemporaryFile(mode="+wb",suffix=".webm", delete=False) as tmp_webm:
            tmp_webm.write(audio_bytes)
            tmp_webm_path = tmp_webm.name

        # # write to real file for testing
        # with open("test.webm", "wb") as f:
        #     f.write(audio_bytes)
        # print(f"🟢 Saved temp file: {tmp_webm_path}")

        # 3. Transcribe the MP3 with Whisper
        result = model.transcribe(tmp_webm_path, language="en", fp16=False)
        text = result["text"].strip()

        print(f"🧠 Transcribed ({session_id}): {text}")
        emit("transcript", {"session_id": session_id, "text": text})

        # return LLM response
        llm_response = generate_response(text)
        duration = round(time.time() - start, 2)
        print(f"⏱️ LLM response time: {duration:.2f} seconds")
        print(f"🤖 LLM response ({session_id}): {llm_response}, datatype: {type(llm_response)}")
        emit("agent_response", {"session_id": session_id, "text": llm_response, "duration": duration})

        # generate voice
        voice_conversion(llm_response)
        print(f"Generated voice response for session {session_id}")
        # send voice response
        with open("outputs/response.wav", "rb") as f:
            audio_data = f.read()
            emit("voice_response", {"session_id": session_id, "audio": audio_data})



    except Exception as e:
        print(f"❌ Transcription error: {traceback.format_exc()}")
        emit("transcript", {"session_id": session_id, "text": "[ERROR] Unable to transcribe."})

    finally:
        # 4. Clean up temp files
        for path in [tmp_webm_path]:
            if os.path.exists(path):
                os.remove(path)
