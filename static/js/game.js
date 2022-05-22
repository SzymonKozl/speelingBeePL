let discovered = [];
let _allWords = [];
const letters = [];
let centralLetter;
let points = 0;
let currentGuess = "";
const ranks = new Map();
let rank = 1;
let rankDesc = "";
let _gameData;

document.onkeydown = function (e) {
    if (e.key === "Enter") handleGuess();
    else if (e.key === "Backspace") delChar();
    else if (letters.includes(e.key)) clickHex(letters.indexOf(e.key) + 1);
    else if (e.key === centralLetter) clickHex(7);
}
document.getElementById("date_today").innerText = new Date(Date.now()).toLocaleDateString();

function initialize() {
    let i;
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "/secret_words/", false); // false for synchronous request
    xmlHttp.send(null);
    _gameData = JSON.parse(xmlHttp.responseText);
    const letters_temp = _gameData["game_data"]["letters"];
    centralLetter = _gameData["game_data"]["central_letter"];
    document.getElementById("letter_slot_7").innerText = centralLetter;
    let slot = 1;
    for (i in letters_temp) {
        if (letters_temp[i] !== centralLetter) {
            letters.push(letters_temp[i])
            document.getElementById("letter_slot_" + slot).innerText = letters_temp[i];
            slot++;
        }
    }
    const maxPoints = _gameData["game_data"]["max_points"];
    _allWords = _gameData["game_data"]["words"]
    for (const rank_t in _gameData.rules["ranks"]) {
        ranks.set(rank_t, Math.round(_gameData["rules"]["ranks"][rank_t] * maxPoints));
    }
    loadGame();
    evaluateRank();
    updateRankFrame();
}

function updateGuess(new_guess = currentGuess) {
    currentGuess = new_guess;
    document.getElementById("new_word").innerText = currentGuess;
}

async function scheduleTask(callable, delay = 1000) {
    await new Promise(r => setTimeout(r, delay));
    callable();
}

function clickHex(num) {
    if (num === 7) {
        currentGuess += centralLetter;
    } else {
        currentGuess += letters[num - 1];
    }
    updateGuess();
}

function reward(word) {
    return sha256(word).then(
        function (hash) {
            if (!(_allWords.includes(hash)) || discovered.includes(word)) return 0;
            let r;
            if (_gameData["rules"]["custom_rewards"][word.length.toString()] !== undefined) r = _gameData["rules"]["custom_rewards"][word.length.toString()];
            else r = word.length;
            if (new Set(word).length === 7) r += 7;
            return r;
        }
    );
}

function handleGuess() {
    const word = document.getElementById("new_word").innerText;
    reward(word).then(
        function (r) {
            if (r !== 0) {
                discovered.push(word);
                points += r;
            } else {
                if (discovered.includes(word)) displayPopup("słowo już odkryte");
                else if (!currentGuess.includes(centralLetter)) displayPopup("brakuje centralnej litery");
                else if (currentGuess.length < _gameData["rules"]["minimal_guess_length"]) displayPopup("słowo zbyt krótkie");
                else displayPopup("słowa nie ma na liście");
            }
            saveScore();
            evaluateRank();
            updateRankFrame();
            updateGuess("");
            updateWordList();
        }
    );
}

function delChar() {
    if (currentGuess.length === 0) return;
    updateGuess(currentGuess.substr(0, currentGuess.length - 1));
}

function displayPopup(content, force = false) {
    if ("popupAnimation" in document.getElementById("mistake_popup").classList) {
        if (!force) return;
        document.getElementById("mistake_popup").classList.remove("popupAnimation");
    }
    document.getElementById("mistake_popup").innerText = content;
    document.getElementById("mistake_popup").classList.add("popupAnimation");
    scheduleTask(() => {
        document.getElementById("mistake_popup").classList.remove("popupAnimation");
    }, 4000);
}

function updateRankFrame() {
    for (let i = 1; i <= 5; i++) {
        if (i <= rank) document.getElementById("rank_dot_" + i).style.background = "black";
        else document.getElementById("rank_dot_" + i).style.background = "bisque";
        document.getElementById("rank_label").style.top = (-32 + rank * 50) + "px";
        document.getElementById("rank_label").innerText = rankDesc;
        document.getElementById("counter").innerText = "Punkty: " + points;
    }
}

function evaluateRank() {
    let rankRepr = 1;
    ranks.forEach((threshold, name) => {
        if (points >= threshold) {
            rank = rankRepr;
            rankDesc = name;
            rankRepr++;
        }
    });
}

function saveScore() {
    const jObj = {};
    jObj["score"] = points;
    jObj["words"] = discovered
    const expirationDate = new Date(new Date(Date.now()).toLocaleDateString("en-US"));
    expirationDate.setDate(expirationDate.getDate() + 1);
    document.cookie = "gameData=" + JSON.stringify(jObj) + "; expires=" + expirationDate;
}

function loadGame() {
    if (document.cookie.includes("gameData")) {
        const separated = document.cookie.split("=");
        const data = JSON.parse(separated[1]);
        discovered = data.words;
        points = data.score;
        evaluateRank();
        updateRankFrame();
        updateWordList();
    }
}

function updateWordList() {
    let t = document.getElementById("discovered_words");
    while (t.rows.length > 0) t.deleteRow(0);
    for (let i = 0; i < discovered.length; i++) {
        if (i % 3 === 0) {
            t.insertRow(t.rows.length);
            t.rows[t.rows.length - 1].insertCell(0);
            t.rows[t.rows.length - 1].insertCell(1);
            t.rows[t.rows.length - 1].insertCell(2);
        }
        t.rows[t.rows.length - 1].cells[i % 3].innerHTML = discovered[i];
    }
}

function openInfoPopup() {
    document.getElementById("info_popup").style.display = "revert";
    document.getElementById("info_popup_shadow").style.display = "revert";
}

function closeInfoPopup() {
    document.getElementById("info_popup").style.display = "none";
    document.getElementById("info_popup_shadow").style.display = "none";
}


// implementation of sha256
async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string

    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}