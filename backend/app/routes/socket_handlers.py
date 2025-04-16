from flask_socketio import emit
from app import socketio
from app.services.transcribe import WhisperStream

streamers = {}

@socketio.on("start_stream")
def handle_start_stream(data):
    session_id = data["session_id"]
    streamers[session_id] = WhisperStream()
    print(f"🟢 Started stream: {session_id}")

@socketio.on("audio_chunk")
def handle_audio_chunk(data):
    session_id = data["session_id"]
    chunk = data["chunk"]

    if session_id not in streamers:
        return

    streamer = streamers[session_id]
    streamer.write_chunk(chunk)

    if streamer.should_transcribe(every_n=3):
        text = streamer.transcribe_and_reset()
        print(f"📤 Emitting transcript for {session_id}: {text}")  # ⬅️ STEP 2
        emit("transcript", {"session_id": session_id, "text": text})

@socketio.on("end_stream")
def handle_end_stream(data):
    session_id = data["session_id"]
    if session_id in streamers:
        text = streamers[session_id].transcribe_and_reset()
        emit("transcript", {"session_id": session_id, "text": text})
        del streamers[session_id]
        print(f"🛑 End stream: {session_id}")
