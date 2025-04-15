from flask_socketio import emit
from app import socketio

# Optional: track chunks per session
chunk_counts = {}

@socketio.on("connect")
def handle_connect():
    print("⚡ Client connected")

@socketio.on("disconnect")
def handle_disconnect():
    print("💤 Client disconnected")

@socketio.on("start_stream")
def handle_start_stream(data):
    session_id = data["session_id"]
    chunk_counts[session_id] = 0
    print(f"🟢 Started stream for session: {session_id}")

@socketio.on("audio_chunk")
def handle_audio_chunk(data):
    session_id = data["session_id"]
    chunk = data["chunk"]  # This should be a Uint8Array from the frontend

    chunk_size = len(chunk)
    chunk_counts[session_id] += 1

    print(
        f"🎧 Chunk #{chunk_counts[session_id]} from {session_id} — {chunk_size} bytes"
    )

    # (You could buffer chunks here in memory for Whisper later)
    # For now, just log them to validate stream timing

@socketio.on("end_stream")
def handle_end_stream(data):
    session_id = data["session_id"]
    print(f"🛑 End stream for session: {session_id}")

    # Cleanup counter for this session
    chunk_counts.pop(session_id, None)
