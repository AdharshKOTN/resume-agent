from flask import Flask, request, jsonify
import tempfile
import os
from flask import Blueprint, request, jsonify
import logging
logger = logging.getLogger(__name__)

forecast_bp = Blueprint('forecast', __name__)

@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        return 'Success', 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
