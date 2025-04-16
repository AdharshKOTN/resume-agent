import io
import whisper

model = whisper.load_model("base")

class WhisperStream:
    def __init__(self):
        self.buffer = io.BytesIO()
        self.chunk_count = 0

    def write_chunk(self, chunk: bytes):
        self.buffer.write(chunk)
        self.chunk_count += 1

    def should_transcribe(self, every_n=3):
        return self.chunk_count % every_n == 0

    def transcribe_and_reset(self) -> str:
        self.buffer.seek(0)
        try:
            print("🌀 Running Whisper transcription...")
            result = model.transcribe(self.buffer, language="en", fp16=False)
            print("🧠 Whisper result:", result["text"].strip())
            return result["text"].strip()
        except Exception as e:
            print("❌ Whisper error:", e)
            return f"[ERROR] {e}"
        finally:
            self.buffer = io.BytesIO()

