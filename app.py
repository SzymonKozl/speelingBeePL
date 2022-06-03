import json

from flask import Flask, render_template

from game_backend import prepare_game_data


# some constants
WORDBASE_PATH = 'words.txt'
WB_METADATA_PATH = 'wordbase_metadata.json'
RULES_PATH = 'rules.json'
PANGRAMS_PATH = 'pangrams_rare.txt'

app = Flask(__name__)

game_data = prepare_game_data(RULES_PATH, WB_METADATA_PATH, WORDBASE_PATH, pangrams_path=PANGRAMS_PATH)


@app.route('/')
def home_page():
    return render_template('index.html')


@app.route('/secret_words/', methods=['GET'])
def wordlist():
    enc = json.JSONEncoder()
    return enc.encode(game_data)


if __name__ == '__main__':
    app.run()
