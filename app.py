import json

from flask import Flask, render_template

from flask_mobility.decorators import mobile_template
from flask_mobility import Mobility

from game_backend import prepare_game_data

# some constants
WORDBASE_PATH = 'words.txt'
WB_METADATA_PATH = 'wordbase_metadata.json'
RULES_PATH = 'rules.json'
PANGRAMS_PATH = 'pangrams_rare.txt'

app = Flask(__name__, instance_relative_config=True)
Mobility(app)

game_data = prepare_game_data(RULES_PATH, WB_METADATA_PATH, WORDBASE_PATH, pangrams_path=PANGRAMS_PATH)


@app.route('/', methods=['GET'])
@mobile_template('{mobile/}main.html')
def home_page(template):
    enc = json.JSONEncoder()
    return render_template(template, game_data=enc.encode(game_data))


if __name__ == '__main__':
    app.run(ssl_context=('cert.pem', 'key.pem'))
