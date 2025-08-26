from gunicorn.app.wsgiapp import run
import os, sys

sys.argv = [
    "gunicorn",
    "app:create_app()",
    "-b", "0.0.0.0:5002",
    "-w", os.getenv("WEB_CONCURRENCY", "2"),
    "-k", "gthread",
    "-t", os.getenv("TIMEOUT", "60"),
    "--access-logfile", "-",
    "--error-logfile", "-",
]

run()
