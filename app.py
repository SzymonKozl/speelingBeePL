import json

from flask import Flask, render_template

from game_backend import load_rules_config, initialize_game_random_pangram, initialize_game_random, \
    initialize_game_custom

app = Flask(__name__)

rules = load_rules_config()
match rules["mode"]:
    case 0:
        game_data = initialize_game_random_pangram(rules)
    case 1:
        game_data = initialize_game_random(rules)
    case 2:
        game_data = initialize_game_custom(rules)
    case _ as x:
        raise ValueError(
            f"invalid value of \"mode\" field in rules.json (Value is set to {x}, should be 0, 1 or 2)")


@app.route('/')
def home_page():
    return render_template('index.html')


@app.route('/secret_words/', methods=['GET'])
def wordlist():
    enc = json.JSONEncoder()
    return enc.encode(game_data)


if __name__ == '__main__':
    app.run()
