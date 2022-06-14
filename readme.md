# NYT Spelling Bee clone with Polish words.

* customizable rules
* over 600k words

## Basics

Core mechanics are the same as in original game. Player makes words using only given 7 letters. For each word that is
longer than 4 characters and includes letter placed in central hexagon player gets points.

## Rules.json

* mode: mode for choosing :
    * 0 - letters are being chosen by randomly selecting pangram containing at least one letter from "rare" letter group
    * 1 - letters are chosen randomly by some specific rules regardless number of words can you make with them
    * 2 - custom chosen letters, specified by "fixed_letters_config" field in rules.json file
* minimal_guess_length: minimal acceptable length of guess ( technically can be any positive integer, but in dataset
  there are only words with minimal length 4; numbers greater than 7 might also be incompatible with mode 0)
* custom_rewards:
    * specifies custom number of points player receives for guess with length n (default is n)
    * example: ```"custom_rewards": {
      "4": 1 }```
* letters_groups:
    * groups of letters used in process of choosing 7 letters in some modes.
    * contain groups:
        * "vowels_1"
        * "vowels_2"
        * "consonants_1"
        * "consonants_2"
        * "rare"
    * all of above groups are used in mode 1 and "rare" group is used in mode 0
    * example:
      ```"vowels_1": ["a", "e", "i", "o"],
      "vowels_2": ["ó", "u", "y"],  
      "consonants_1": ["z", "n", "c", "d", "k", "p", "r", "s", "t", "w"],
      "consonants_2": ["b", "f", "g", "h", "j", "l", "ł", "m"],
      "rare": ["ą", "ć", "ę", "ń", "q", "ś", "v", "x", "ź", "ż"]
      ```
* ranks:
    * sets lower bound for ranks player is awarded
    * bound is expressed as fraction
    * example:
        ```"ranks": {
        "początkujący": 0.0,
        "odkrywca": 0.2,
        "średniozaawansowany": 0.4,
        "ekspert": 0.6,
        "królowa pszczół": 0.8
      }
      ```
## Credits:
Special thanks to sjp.pl for making their polish words with formations dataset available (https://sjp.pl/sl/odmiany/)