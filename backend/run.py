from app import create_app

# from app.services.voice.setup_nltk import setup_nltk


# setup_nltk()

from dotenv import load_dotenv

load_dotenv()

app, socketio = create_app()

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)