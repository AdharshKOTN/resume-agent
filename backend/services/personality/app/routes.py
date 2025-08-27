from flask import Blueprint, request
# import the function defined
# from app.service import transcribe_audio
from app.query import generate_response

personality_blueprint = Blueprint('personality', __name__)

@personality_blueprint.route("/personality-response", methods=["POST"])
def get_response():
    
    user_prompt = request.get_json()["transcript"]

    try:
        text = generate_response(user_prompt=user_prompt)

        return text, 200

    # return the text as the REST response
    except Exception as e:
        print(e)
        return "LLM Error", 500