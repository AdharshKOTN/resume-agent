from flask import Flask
from .routes import transcribe_blueprint# for flask microservices, import the routes that need to be registered

# PORT: 5002

def create_app(): # standard function init required for flask apps
    app = Flask(__name__) # init Flask constructor, it takes the __name__ variable, in this case since we run this with a run file then it should adopt __main__, unsure
    app.register_blueprint(transcribe_blueprint) # register the process to the application
    return app