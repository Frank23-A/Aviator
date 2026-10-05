/* =========================================
   BET TABS
   ALL BETS / PREVIOUS / TOP
========================================= */


/* =========================================
   GET ELEMENTS
========================================= */

const betTabs =
    document.querySelectorAll(".bets-tab");

const betsList =
    document.getElementById("liveBetsList");

const allBetsInfo =
    document.querySelector(".all-bets-info");

const betsTableHead =
    document.querySelector(".bets-table-head");


/* =========================================
   CURRENT TAB
========================================= */

let currentBetTab =
    "all";


/* =========================================
   SAVE LIVE BETS BEFORE CHANGING VIEW
========================================= */

function saveLiveBeforeSwitch() {

    if (
        currentBetTab === "all" &&
        typeof saveCurrentLiveBets === "function"
    ) {

        saveCurrentLiveBets();

    }

}


/* =========================================
   HIDE ALL BET CONTENT
========================================= */

function hideBetContent() {

    if (allBetsInfo) {

        allBetsInfo.style.display =
            "none";

    }


    if (betsTableHead) {

        betsTableHead.style.display =
            "none";

    }


    if (betsList) {

        betsList.style.display =
            "none";

    }

}


/* =========================================
   SHOW ALL BETS
========================================= */

function showAllBets() {

    currentBetTab =
        "all";


    hideBetContent();


    /*
       Restore the exact live bets
       instead of generating new ones.
    */

    if (
        typeof restoreCurrentLiveBets ===
        "function"
    ) {

        restoreCurrentLiveBets();

    }


    if (allBetsInfo) {

        allBetsInfo.style.display =
            "";

    }


    if (betsTableHead) {

        betsTableHead.style.display =
            "";

    }


    if (betsList) {

        betsList.style.display =
            "";

    }

}


/* =========================================
   SHOW PREVIOUS
========================================= */

function showPreviousBets() {

    currentBetTab =
        "previous";


    saveLiveBeforeSwitch();


    hideBetContent();


    if (!betsList) {

        return;

    }


    /*
       SAME LIST AREA
    */

    betsList.style.display =
        "flex";


    betsList.innerHTML =
        "";


    /* -----------------------------------------
       PREVIOUS HEADER
    ----------------------------------------- */

    const header =
        document.createElement("div");


    header.className =
        "previous-round-header";


    header.innerHTML = `

        <span>
            PREVIOUS ROUND
        </span>

    `;


    betsList.appendChild(
        header
    );


    /* -----------------------------------------
       CHECK DATA
    ----------------------------------------- */

    if (
        !window.previousRoundBets ||
        window.previousRoundBets.length === 0
    ) {

        const empty =
            document.createElement("div");


        empty.className =
            "no-previous-bets";


        empty.textContent =
            "No previous round yet";


        betsList.appendChild(
            empty
        );


        return;

    }


    /* -----------------------------------------
       DISPLAY PREVIOUS BETS
    ----------------------------------------- */

    window.previousRoundBets.forEach(
        bet => {

            const row =
                document.createElement("div");


            row.className =
                "bet-row";


            row.innerHTML = `

                <span class="player-name">

                    ${bet.player}

                </span>


                <span>

                    ${bet.amount}

                </span>


                <span class="multiplier-value">

                    ${bet.multiplier || ""}

                </span>


                <span>

                    ${bet.winnings || ""}

                </span>

            `;


            if (bet.winner) {

                row.classList.add(
                    "winner"
                );

            }


            betsList.appendChild(
                row
            );

        }
    );

}


/* =========================================
   SHOW TOP BETS
========================================= */

function showTopBets() {

    currentBetTab =
        "top";


    saveLiveBeforeSwitch();


    hideBetContent();


    if (!betsList) {

        return;

    }


    /*
       SAME LIST AREA
    */

    betsList.style.display =
        "flex";


    /*
       Get saved live bets.
       DO NOT use the current DOM because
       Previous/Top may have replaced it.
    */

    let rows =
        window.currentLiveBets
            ? window.currentLiveBets.map(
                row =>
                    row.cloneNode(true)
            )
            : [];


    /* -----------------------------------------
       SORT BY BET AMOUNT
    ----------------------------------------- */

    rows.sort(
        (a, b) => {

            const amountA =
                parseFloat(
                    a.children[1]
                        ?.textContent
                        .replace(/,/g, "")
                ) || 0;


            const amountB =
                parseFloat(
                    b.children[1]
                        ?.textContent
                        .replace(/,/g, "")
                ) || 0;


            return amountB - amountA;

        }
    );


    /*
       Clear SAME list area
    */

    betsList.innerHTML =
        "";


    /* -----------------------------------------
       TOP HEADER
    ----------------------------------------- */

    const header =
        document.createElement("div");


    header.className =
        "previous-round-header";


    header.innerHTML = `

        <span>
            TOP BETS
        </span>

    `;


    betsList.appendChild(
        header
    );


    /* -----------------------------------------
       TOP 10
    ----------------------------------------- */

    rows
        .slice(0, 10)
        .forEach(
            row => {

                betsList.appendChild(
                    row
                );

            }
        );

}


/* =========================================
   TAB CLICK
========================================= */

betTabs.forEach(
    (tab, index) => {

        tab.addEventListener(
            "click",
            () => {

                /*
                   Remove active from all
                */

                betTabs.forEach(
                    button => {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


                /*
                   Activate clicked tab
                */

                tab.classList.add(
                    "active"
                );


                /*
                   ALL
                */

                if (index === 0) {

                    showAllBets();

                }


                /*
                   PREVIOUS
                */

                else if (index === 1) {

                    showPreviousBets();

                }


                /*
                   TOP
                */

                else if (index === 2) {

                    showTopBets();

                }

            }
        );

    }
);


/* =========================================
   DEFAULT VIEW
========================================= */

showAllBets();