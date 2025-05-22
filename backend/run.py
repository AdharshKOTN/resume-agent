from app import create_app, socketio

# from app.services.voice.setup_nltk import setup_nltk


# setup_nltk()

from dotenv import load_dotenv

load_dotenv()

app = create_app()

if __name__ == "__main__":
    socketio.run(app, debug=True)