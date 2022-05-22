import json
import random
from typing import List, Set
from random import randrange, sample, choice
from hashlib import sha256


def load_rules_config(path: str = 'rules.json') -> dict:
    """
    loads game rules from json
    :param path: json path
    :return: rules as dict
    """
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def filter_words(letters: Set[str], central_letter: str, rules: dict, path: str = 'words.txt') -> List[str]:
    final_list = []
    with open(path, 'r', encoding='ANSI') as f_in:
        for line in f_in.readlines():
            w = line[:-1] if line.endswith('\n') else line
            if central_letter in w and set(w).issubset(letters) and len(w) >= rules["minimal_guess_length"]:
                final_list.append(w)
    return final_list


def make_game_data(letters: List[str], central_letter: str, rules: dict) -> dict:
    words = filter_words(set(letters), central_letter, rules)
    letters.remove(central_letter)
    game_data = {
        "game_data": {
            "central_letter": central_letter,
            "letters": letters,
            "words": [sha256(bytearray(w, 'utf-8')).hexdigest() for w in words]
        },
        "rules": rules
    }
    game_data["game_data"]["max_points"] = calc_max_points(words, game_data)
    return game_data


def initialize_game_random(rules: dict) -> dict:
    v1 = rules["letter_groups"]["vowels_1"][:]
    v2 = rules["letter_groups"]["vowels_2"][:]
    c1 = rules["letter_groups"]["consonants_1"][:]
    c2 = rules["letter_groups"]["consonants_2"][:]
    r = rules["letter_groups"]["rare"][:]
    letters = [v1.pop(randrange(4))]
    t = v1 + v2
    letters.append(t.pop(randrange(6)))
    letters.append(c1.pop(randrange(10)))
    letters += sample(c1 + c2 + t, 3)
    letters.append(r.pop(randrange(10)))
    cl = choice(letters)
    while cl not in rules["letter_groups"]["vowels_1"] and cl not in \
            rules["letter_groups"]["consonants_1"]:
        cl = choice(letters)
    return make_game_data(letters, cl, rules)


def initialize_game_random_pangram(rules: dict, pangrams_path: str = "pangrams_rare.txt") -> dict:
    central_candidates = set(rules["letter_groups"]["vowels_1"] + rules["letter_groups"]["consonants_1"])
    with open(pangrams_path, 'r') as pangrams:
        w = [p[:-1] if p.endswith('\n') else p for p in pangrams]
    central_letter = None
    letters = None
    while central_letter is None:
        pg = random.choice(w)
        letters = set(pg)
        candidates = letters.intersection(central_candidates)
        if len(candidates) > 0:
            central_letter = random.choice(list(candidates))
    return make_game_data(list(letters), central_letter, rules)


def initialize_game_custom(rules: dict) -> dict:
    letters = rules["fixed_letters_config"]["letters"]
    cl = rules["fixed_letters_config"]["central_letter"]
    return make_game_data(letters + [cl], cl, rules)


def value_word(word: str, game_data: dict) -> int:
    """
    return points rewarded by guessing word
    :param word: word as string
    :param game_data: set of game rules and game context
    :return: reward
    """

    if str(len(word)) in game_data["rules"]["custom_rewards"].keys():
        return game_data["rules"]["custom_rewards"][str(len(word))]
    return len(word)


def calc_max_points(words: List[str], game_data: dict) -> int:
    return sum([value_word(word, game_data) for word in words])
