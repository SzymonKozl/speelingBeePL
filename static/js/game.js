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
let gameDate;

document.onkeydown = function (e) {
    let keyLower = e.key.toLowerCase();
    if (e.key === "Enter") handleGuess();
    else if (e.key === "Backspace") delChar();
    else if (letters.includes(keyLower)) clickHex(letters.indexOf(keyLower) + 1);
    else if (keyLower === centralLetter) clickHex(7);
}

function initialize(gameDataArg, mobile) {
    _gameData = JSON.parse(gameDataArg)
    gameDate = new Date(_gameData["date"]);
    if (!mobile) document.getElementById("date_today").innerText = _gameData["date"];
    else document.getElementById("date_today").innerText = _gameData["date"].substr(2);
    const letters_temp = _gameData["game_data"]["letters"];
    centralLetter = _gameData["game_data"]["central_letter"];
    document.getElementById("letter_slot_7").innerText = centralLetter.toUpperCase();
    let slot = 1;
    for (let i in letters_temp) {
        if (letters_temp[i] !== centralLetter) {
            letters.push(letters_temp[i])
            document.getElementById("letter_slot_" + slot).innerText = letters_temp[i].toUpperCase();
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
    document.getElementById("new_word").innerText = currentGuess.toUpperCase();
}

async function scheduleTask(callable, delay = 1000) {
    await new Promise(r => setTimeout(r, delay));
    callable();
}

function clickHex(num) {
    if (currentGuess.length === _gameData['wb_meta']['max_length']) displayMiddlePopup("maksymalna długość słowa");
    else {
        if (num === 7) {
            currentGuess += centralLetter;
        } else {
            currentGuess += letters[num - 1];
        }
        updateGuess();
    }
}

function reward(word) {
    return sha256(word).then(
        function (hash) {
            if (!(_allWords.includes(hash)) || discovered.includes(word)) return 0;
            let r;
            if (_gameData["rules"]["custom_rewards"][word.length.toString()] !== undefined) r = _gameData["rules"]["custom_rewards"][word.length.toString()];
            else r = word.length;
            if ((new Set(word)).size === 7) r += 7;
            return r;
        }
    );
}

function handleGuess() {
    const word = currentGuess;
    reward(word).then(
        function (r) {
            if (parseInt(r) !== 0) {
                discovered.push(word);
                points += r;
            } else {
                if (discovered.includes(word)) displayMiddlePopup("słowo już odkryte");
                else if (!currentGuess.includes(centralLetter)) displayMiddlePopup("brakuje centralnej litery");
                else if (currentGuess.length < _gameData["rules"]["minimal_guess_length"]) displayMiddlePopup("słowo zbyt krótkie");
                else displayMiddlePopup("słowa nie ma na liście");
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

function displayMiddlePopup(content) {
    document.getElementById("mistake_popup").innerText = content;
    playCSSAnimation("mistake_popup", "v2AnimHoldMiddlePopup", true);
}

function updateRankFrame() {
    for (let i = 1; i <= 5; i++) {
        if (i <= rank) document.getElementById("rank_dot_" + i).style.background = "black";
        else document.getElementById("rank_dot_" + i).style.background = "#f2f3f2";
        document.getElementById("rank_label").style.top = (rank * 75 - 50) + "px";
        document.getElementById("rank_label").innerText = rankDesc;
        document.getElementById("counter").innerText = "PUNKTY: " + points;
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
    const expirationDate = new Date(new Date(Date.now()).toLocaleDateString("en-US"));
    if (expirationDate.getTime() === gameDate.getTime()) {
        const jObj = {};
        jObj["score"] = points;
        jObj["words"] = discovered
        expirationDate.setDate(expirationDate.getDate() + 1);
        const s = expirationDate.toString();
        document.cookie = "gameData=" + JSON.stringify(jObj) + "; expires=" + s.replace("Z", "CET");
    } else console.warn("progress is not saved as you are playing on yesterday's data")
}

function loadGame() {
    const cookies = Object.assign({}, ...document.cookie.split('; ').map((entry) => ({
        [entry.split('=')[0]]: entry.split('=')[1]
    })))
    if (cookies['gameData'] !== undefined) {
        const data = JSON.parse(cookies['gameData']);
        discovered = data.words;
        points = data.score;
        evaluateRank();
        updateRankFrame();
        updateWordList();
    }
    if (cookies['cookies'] === undefined) {
        playCSSAnimation("bottom_popup", "v2AnimHoldPopupBottomShow")
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
    let cont = document.getElementById("discovered_words_container");
    cont.scrollTop = cont.scrollHeight;
}

function openInfoPopup() {
    document.getElementById("info_popup").style.visibility = "visible";
    document.getElementById("info_popup_shadow").style.visibility = "visible";
}

function closeInfoPopup() {
    document.getElementById("info_popup").style.visibility = "hidden";
    document.getElementById("info_popup_shadow").style.visibility = "hidden";
}

function playCSSAnimation(objectID, CSSAnimationName, removeClass = false) {
    // plays CSS keyframes animation by adding CSS class
    let obj = document.getElementById(objectID)
    // removing previous animations
    let to_remove = [...obj.classList].filter((name) => name.startsWith("animHold"));
    if (to_remove.length > 0) obj.classList.remove(to_remove);
    obj.classList.add(CSSAnimationName);
    let duration = getComputedStyle(obj).animationDuration;
    duration = parseFloat(duration) * 1000;
    if (removeClass) {
        scheduleTask(
            () => {
                obj.classList.remove(CSSAnimationName);
            }, duration
        );
    }
}

function acceptCookies() {
    const jsonObj = {};
    jsonObj["accepted_cookies"] = true;
    const expirationDate = new Date(2200, 1, 1);
    document.cookie = "cookies=" + JSON.stringify(jsonObj) + "; expires=" + expirationDate;
    playCSSAnimation("bottom_popup", "v2AnimHoldPopupBottomHide")
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