from flask_socketio import emit
from app import socketio
from app.services.transcribe import WhisperStream
import io
from whisper.audio import load_audio, log_mel_spectrogram
import whisper
from whisper import DecodingOptions, decode

import tempfile
import subprocess
import os

streamers = {}
model = whisper.load_model("base")

# @socketio.on("start_stream")
# def handle_start_stream(data):
#     session_id = data["session_id"]
#     streamers[session_id] = WhisperStream()
#     print(f"🟢 Started stream: {session_id}")

# @socketio.on("audio_chunk")
# def handle_audio_chunk(data):
#     session_id = data["session_id"]
#     chunk = data["chunk"]

#     if session_id not in streamers:
#         return

#     streamer = streamers[session_id]
#     streamer.write_chunk(chunk)

#     if streamer.should_transcribe(every_n=3):
#         text = streamer.transcribe_and_reset()
#         print(f"📤 Emitting transcript for {session_id}: {text}")  # ⬅️ STEP 2
#         emit("transcript", {"session_id": session_id, "text": text})


@socketio.on("end_stream")
def handle_end_stream(data):
    session_id = data["session_id"]
    audio_bytes = data["blob"]

    # buffer = io.BytesIO(audio_bytes)

    try:
        # 1. Save the raw blob as a .webm temp file
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_webm:
            tmp_webm.write(audio_bytes)
            tmp_webm_path = tmp_webm.name

        # 2. Convert .webm to .mp3 using FFmpeg
        tmp_mp3_path = tmp_webm_path.replace(".webm", ".mp3")
        subprocess.run([
            "ffmpeg", "-y", "-i", tmp_webm_path,
            "-ar", "16000", "-ac", "1", "-b:a", "128k", tmp_mp3_path
        ], check=True)

        # 3. Transcribe the MP3 with Whisper
        result = model.transcribe(tmp_mp3_path, language="en", fp16=False)
        text = result["text"].strip()

        print(f"🧠 Transcribed ({session_id}): {text}")
        emit("transcript", {"session_id": session_id, "text": text})

    except Exception as e:
        print(f"❌ Transcription error: {e.with_traceback()}")
        emit("transcript", {"session_id": session_id, "text": "[ERROR] Unable to transcribe."})

    finally:
        # 4. Clean up temp files
        for path in [tmp_webm_path, tmp_mp3_path]:
            if os.path.exists(path):
                os.remove(path)
