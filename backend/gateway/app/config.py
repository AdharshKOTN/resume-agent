# config.py
import os
from dotenv import load_dotenv

# Load .env file once, early in the app
load_dotenv()

class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "production")
    FRONTEND_ORIGIN = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",             
    "http://172.17.151.178:3000",              
    "http://192.168.0.26",     
    "https://resume.adharsh.dev",
    ]
    PORT = int(os.getenv("PORT", 5000))