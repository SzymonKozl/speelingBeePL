let discovered = [];
let _allWords = [];
const letters = [];
let centralLetter;
let points = 0;
let currentGuess = "";
const ranks = new Map();
let rank = 1;
let rankDesc = "";
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
    const jsonObj = JSON.parse(xmlHttp.responseText);
    const letters_temp = jsonObj["game_data"]["letters"];
    centralLetter = jsonObj["game_data"]["central_letter"];
    document.getElementById("letter_slot_7").innerText = centralLetter;
    let slot = 1;
    for (i in letters_temp) {
        if (letters_temp[i] !== centralLetter) {
            letters.push(letters_temp[i])
            document.getElementById("letter_slot_" + slot).innerText = letters_temp[i];
            slot++;
        }
    }
    const maxPoints = jsonObj["game_data"]["max_points"];
    _allWords = jsonObj["game_data"]["words"]
    for (const rank_t in jsonObj.rules["ranks"]) {
        ranks.set(rank_t, Math.round(jsonObj.rules["ranks"][rank_t] * maxPoints));
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
            console.log("hash for word " + word + " is " + hash)
            console.log(!(_allWords.includes(hash)) + " " + discovered.includes(word))
            if (!(_allWords.includes(hash)) || discovered.includes(word)) return 0;
            if (new Set(word).size === 7) return 7 + word.length;
            if (word.length === 4) return 1;
            return word.length;
        }
    );
}

function handleGuess() {
    const word = document.getElementById("new_word").innerText;
    reward(word).then(
        function (r) {
            console.log("reward for word " + word + " is " + r)
            if (r !== 0) {
                discovered.push(word);
                points += r;
            } else {
                if (discovered.includes(word)) displayPopup("słowo już odkryte");
                else if (!currentGuess.includes(centralLetter)) displayPopup("brakuje centralnej litery");
                else if (currentGuess.length < 4) displayPopup("słowo zbyt krótkie");
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