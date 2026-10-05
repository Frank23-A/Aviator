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
    "6",
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
   RANDOM MULTIPLIER
========================================= */

function randomMultiplier() {

    return (
        Math.random() * 4 + 1.20
    ).toFixed(2);

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
   LOWEST = 10
========================================= */

function randomBetAmount(
    index,
    totalBets
) {

    const maxAmount = 3000;

    const minAmount = 10;


    const progress =
        index / (totalBets - 1);


    let amount =
        maxAmount -
        (
            maxAmount -
            minAmount
        ) * progress;


    const randomFactor =
        0.75 +
        Math.random() * 0.25;


    amount *= randomFactor;


    amount =
        Math.max(
            minAmount,
            amount
        );


    return amount.toFixed(2);

}


/* =========================================
   CREATE ONE BET
========================================= */

function createBetRow(
    index,
    totalBets
) {

    const row =
        document.createElement("div");


    row.className =
        "bet-row";


    const player =
        randomPlayer();


    const icon =
        randomItem(betIcons);


    const amount =
        randomBetAmount(
            index,
            totalBets
        );


    row.innerHTML = `

        <span class="player-name">

            <i>${icon}</i>

            ${player}

        </span>


        <span>
            ${amount}
        </span>


        <span class="multiplier-value">
        </span>


        <span>
        </span>

    `;


    return row;

}


/* =========================================
   SAVE CURRENT ROUND
   BEFORE GENERATING NEW ROUND
========================================= */

function savePreviousRound() {

    const rows =
        Array.from(
            betsList.querySelectorAll(
                ".bet-row"
            )
        );


    if (rows.length === 0) {

        return;

    }


    window.previousRoundBets =
        rows.map(row => {

            const playerElement =
                row.querySelector(
                    ".player-name"
                );


            const player =
                playerElement
                    ? playerElement.textContent.trim()
                    : "";


            const amount =
                row.children[1]
                    ? row.children[1]
                        .textContent
                        .trim()
                    : "";


            const multiplierElement =
                row.querySelector(
                    ".multiplier-value"
                );


            const winnings =
                row.children[3]
                    ? row.children[3]
                        .textContent
                        .trim()
                    : "";


            return {

                player:
                    player,

                amount:
                    amount,

                multiplier:
                    multiplierElement
                        ? multiplierElement
                            .textContent
                            .trim()
                        : "",

                winnings:
                    winnings,

                winner:
                    row.classList.contains(
                        "winner"
                    )

            };

        });

}


/* =========================================
   GENERATE ALL BETS
========================================= */

function generateBets() {

    betsList.innerHTML = "";


    const totalBets =
        randomTotalBets();


    if (allBetsCount) {

        allBetsCount.textContent =
            totalBets;

    }


    for (
        let i = 0;
        i < totalBets;
        i++
    ) {

        betsList.appendChild(
            createBetRow(
                i,
                totalBets
            )
        );

    }

}


/* =========================================
   RANDOMLY SELECT WINNERS
========================================= */

function addRandomWinner() {

    const rows =
        Array.from(
            betsList.querySelectorAll(
                ".bet-row"
            )
        );


    const nonGreenRows =
        rows.filter(
            row =>
                !row.classList.contains(
                    "winner"
                )
        );


    if (
        nonGreenRows.length === 0
    ) {

        return;

    }


    const randomIndex =
        Math.floor(
            Math.random() *
            nonGreenRows.length
        );


    const selectedRow =
        nonGreenRows[randomIndex];


    selectedRow.classList.add(
        "winner"
    );


    const multiplier =
        randomMultiplier();


    const amount =
        parseFloat(
            selectedRow
                .children[1]
                .textContent
                .replace(/,/g, "")
        );


    const winnings =
        (
            amount *
            parseFloat(multiplier)
        ).toFixed(2);


    selectedRow
        .querySelector(
            ".multiplier-value"
        )
        .textContent =
            multiplier + "x";


    selectedRow
        .children[3]
        .textContent =
            Number(winnings)
                .toLocaleString(
                    "en-US",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );


    const delay =
        600 +
        Math.random() * 900;


    setTimeout(
        addRandomWinner,
        delay
    );

}


/* =========================================
   START NEW BET ROUND
   CALLED BY AVIATOR COUNTDOWN
========================================= */

function startNewBetRound() {

    /*
       SAVE THE ROUND THAT JUST ENDED
    */

    savePreviousRound();


    /*
       CREATE NEW ROUND
    */

    generateBets();


    /*
       START RANDOM WINNERS
    */

    addRandomWinner();

}