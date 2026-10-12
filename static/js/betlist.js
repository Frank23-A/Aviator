
/* =========================================
   RANDOM LIVE BETS
========================================= */

const betsList =
    document.getElementById("liveBetsList");

const allBetsCount =
    document.getElementById("allBetsCount");


/* =========================================
   PREVIOUS ROUND STORAGE
========================================= */

window.previousRoundBets =
    window.previousRoundBets || [];


/* =========================================
   CURRENT LIVE ROUND STORAGE
========================================= */

window.currentLiveBets =
    window.currentLiveBets || [];


/* =========================================
   SYNCHRONIZED AVIATOR MULTIPLIER
========================================= */

window.currentAviatorMultiplier =
    Number(window.currentAviatorMultiplier) || 1;

let liveRoundActive = false;
let winnerTimer = null;


/* =========================================
   RANDOM DATA
========================================= */

const betIcons = [
    "🎲",
    "🟣",
    "⚫",
    "🔵",
    "🟤",
    "⚪"
];

const playerDigits = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9"
];


/* =========================================
   RANDOM ITEM
========================================= */

function randomItem(array) {

    return array[
        Math.floor(
            Math.random() * array.length
        )
    ];

}


/* =========================================
   RANDOM PLAYER
========================================= */

function randomPlayer() {

    return `d***${randomItem(playerDigits)}`;

}


/* =========================================
   RANDOM TOTAL BETS
   MINIMUM = 500
   MAXIMUM = 1500
========================================= */

function randomTotalBets() {

    return Math.floor(
        Math.random() * (1500 - 500 + 1)
    ) + 500;

}


/* =========================================
   RANDOM BET AMOUNT
   HIGHEST ≈ 3000
   LOWEST = 100
========================================= */

function randomBetAmount(index, totalBets) {

    const maxAmount = 3000;
    const minAmount = 100;

    const progress =
        totalBets > 1
            ? index / (totalBets - 1)
            : 0;

    let amount =
        maxAmount -
        (maxAmount - minAmount) * progress;

    const randomFactor =
        0.75 + Math.random() * 0.25;

    amount *= randomFactor;

    amount = Math.max(minAmount, amount);

    return amount.toFixed(2);

}


/* =========================================
   CREATE ONE BET
========================================= */

function createBetRow(index, totalBets) {

    const row =
        document.createElement("div");

    row.className = "bet-row";

    const player = randomPlayer();
    const icon = randomItem(betIcons);

    const amount =
        randomBetAmount(index, totalBets);

    row.innerHTML = `

        <span class="player-name">
            <i>${icon}</i>
            ${player}
        </span>

        <span>${amount}</span>

        <span class="multiplier-value"></span>

        <span></span>

    `;

    return row;

}


/* =========================================
   SAVE PREVIOUS ROUND
========================================= */

function savePreviousRound() {

    if (!betsList) {
        return;
    }

    const rows =
        Array.from(
            betsList.querySelectorAll(".bet-row")
        );

    if (rows.length === 0) {
        return;
    }

    window.previousRoundBets =
        rows.map(row => {

            const playerElement =
                row.querySelector(".player-name");

            const multiplierElement =
                row.querySelector(".multiplier-value");

            const player =
                playerElement
                    ? playerElement.textContent.trim()
                    : "";

            const amount =
                row.children[1]
                    ? row.children[1].textContent.trim()
                    : "";

            const winnings =
                row.children[3]
                    ? row.children[3].textContent.trim()
                    : "";

            return {

                player: player,

                amount: amount,

                multiplier:
                    multiplierElement
                        ? multiplierElement.textContent.trim()
                        : "",

                winnings: winnings,

                winner:
                    row.classList.contains("winner")

            };

        });

}


/* =========================================
   SAVE LIVE BET DOM
   BEFORE SWITCHING TABS
========================================= */

function saveCurrentLiveBets() {

    if (!betsList) {
        return;
    }

    window.currentLiveBets =
        Array.from(
            betsList.querySelectorAll(".bet-row")
        ).map(row => row.cloneNode(true));

}


/* =========================================
   RESTORE LIVE BET DOM
========================================= */

function restoreCurrentLiveBets() {

    if (!betsList) {
        return;
    }

    betsList.innerHTML = "";

    if (
        !window.currentLiveBets ||
        window.currentLiveBets.length === 0
    ) {
        return;
    }

    window.currentLiveBets.forEach(row => {

        betsList.appendChild(
            row.cloneNode(true)
        );

    });

}


/* =========================================
   GENERATE ALL BETS
========================================= */

function generateBets() {

    if (!betsList) {
        return;
    }

    betsList.innerHTML = "";

    const totalBets =
        randomTotalBets();

    if (allBetsCount) {
        allBetsCount.textContent = totalBets;
    }

    for (
        let i = 0;
        i < totalBets;
        i++
    ) {

        betsList.appendChild(
            createBetRow(i, totalBets)
        );

    }

    saveCurrentLiveBets();

}


/* =========================================
   SYNCHRONIZED LIVE WINNERS
========================================= */

function addRandomWinner() {

    // Stop if the round is no longer active.
    if (!liveRoundActive || !betsList) {
        return;
    }

    const rows =
        Array.from(
            betsList.querySelectorAll(".bet-row")
        );

    const nonGreenRows =
        rows.filter(
            row =>
                !row.classList.contains("winner")
        );

    if (nonGreenRows.length === 0) {
        return;
    }

    const selectedRow =
        nonGreenRows[
            Math.floor(
                Math.random() * nonGreenRows.length
            )
        ];

    /*
       USE THE CURRENT AVIATOR MULTIPLIER.
       DO NOT GENERATE A RANDOM MULTIPLIER.
    */

    const multiplier =
        Number(window.currentAviatorMultiplier);

    if (
        !Number.isFinite(multiplier) ||
        multiplier < 1
    ) {
        return;
    }

    const amount =
        parseFloat(
            selectedRow.children[1]
                .textContent
                .replace(/,/g, "")
        );

    if (!Number.isFinite(amount)) {
        return;
    }

    /*
       MARK THE SELECTED BET AS A WINNER.
    */

    selectedRow.classList.add("winner");

    /*
       DISPLAY THE SAME MULTIPLIER
       AS THE AVIATOR GAME.
    */

    selectedRow
        .querySelector(".multiplier-value")
        .textContent =
            multiplier.toFixed(2) + "x";

    /*
       CALCULATE DISPLAYED WINNINGS.
    */

    const winnings =
        amount * multiplier;

    selectedRow.children[3].textContent =
        winnings.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    /*
       SAVE THE UPDATED WINNER STATE.
    */

    saveCurrentLiveBets();

    /*
       SCHEDULE THE NEXT SIMULATED CASH-OUT.
    */

    if (liveRoundActive) {

        winnerTimer =
            setTimeout(
                addRandomWinner,
                600 + Math.random() * 900
            );

    }

}


/* =========================================
   AVIATOR ROUND STARTED EVENT
========================================= */

window.addEventListener(
    "aviatorRoundStarted",
    function () {

        clearTimeout(winnerTimer);
        winnerTimer = null;

        liveRoundActive = true;

        window.currentAviatorMultiplier = 1;

        /*
           Start simulated cash-outs
           for the new flight.
        */

        addRandomWinner();

    }
);


/* =========================================
   AVIATOR CRASH EVENT
========================================= */

window.addEventListener(
    "aviatorCrash",
    function () {

        liveRoundActive = false;

        clearTimeout(winnerTimer);
        winnerTimer = null;

    }
);


/* =========================================
   START NEW BET ROUND
   CALLED BY AVIATOR COUNTDOWN
========================================= */

function startNewBetRound() {

    /*
       SAVE THE ROUND THAT JUST ENDED.
    */

    savePreviousRound();

    /*
       GENERATE BETS FOR THE NEXT ROUND.
    */

    generateBets();

}
