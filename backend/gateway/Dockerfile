FROM python:3.10-slim

COPY app .
COPY run.py .
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
# RUN pip install git+https://github.com/myshell-ai/MeloTTS.git
# RUN python -m unidic download

EXPOSE 5000

CMD ["python", "run.py"]