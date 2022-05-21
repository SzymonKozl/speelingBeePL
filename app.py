import json

from flask import Flask, render_template, request, make_response

from game_backend import load_rules_config, initialize_game_random_pangram

app = Flask(__name__)

rules = load_rules_config()
game_data = initialize_game_random_pangram(rules)


@app.route('/')
def home_page():
    return render_template('index.html')


@app.route('/secret_words/', methods=['GET'])
def wordlist():
    enc = json.JSONEncoder()
    return enc.encode(game_data)


if __name__ == '__main__':
    app.run()
