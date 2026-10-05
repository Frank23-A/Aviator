/* =========================================
   BET TABS NAVIGATION
   ALL BETS / PREVIOUS / TOP
========================================= */


/* =========================================
   GET ELEMENTS
========================================= */

const betTabs =
    document.querySelectorAll(".bets-tab");

const allBetsInfo =
    document.querySelector(".all-bets-info");

const betsTableHead =
    document.querySelector(".bets-table-head");

const betsList =
    document.getElementById("liveBetsList");

const tabsContainer =
    document.querySelector(".bets-tabs");


/* =========================================
   CREATE PREVIOUS VIEW
========================================= */

const previousView =
    document.createElement("div");

previousView.className =
    "previous-round-view";


previousView.innerHTML = `

    <div class="previous-round-result">

        <div class="previous-round-head">

            <span>
                PREVIOUS ROUND
            </span>

            <strong id="previousCrashValue">
                --
            </strong>

        </div>


        <div
            class="previous-round-list"
            id="previousBetsList"
        >
        </div>

    </div>

`;


/* =========================================
   CREATE TOP VIEW
========================================= */

const topView =
    document.createElement("div");

topView.className =
    "top-bets-view";


topView.innerHTML = `

    <div
        class="top-bets-list"
        id="topBetsList"
    >
    </div>

`;


/* =========================================
   INSERT VIEWS
========================================= */

if (tabsContainer) {

    tabsContainer.insertAdjacentElement(
        "afterend",
        previousView
    );


    previousView.insertAdjacentElement(
        "afterend",
        topView
    );

}


/* =========================================
   HIDE ALL VIEWS
========================================= */

function hideAllViews() {

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


    previousView.style.display =
        "none";


    topView.style.display =
        "none";

}


/* =========================================
   SHOW ALL BETS
========================================= */

function showAllBets() {

    hideAllViews();


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

    hideAllViews();


    previousView.style.display =
        "flex";


    loadPreviousBets();

}


/* =========================================
   SHOW TOP
========================================= */

function showTopBets() {

    hideAllViews();


    topView.style.display =
        "flex";


    loadTopBets();

}


/* =========================================
   LOAD PREVIOUS BETS
========================================= */

function loadPreviousBets() {

    const previousBetsList =
        document.getElementById(
            "previousBetsList"
        );

    const previousCrashValue =
        document.getElementById(
            "previousCrashValue"
        );


    previousBetsList.innerHTML =
        "";


    /* =========================================
       GET LAST CRASH
    ========================================= */

    const latestHistory =
        document.querySelector(
            "#historyList .history-item"
        );


    if (latestHistory) {

        previousCrashValue.textContent =
            latestHistory.textContent.trim();

    } else {

        previousCrashValue.textContent =
            "--";

    }


    /* =========================================
       CHECK PREVIOUS BETS
    ========================================= */

    if (
        !window.previousRoundBets ||
        window.previousRoundBets.length === 0
    ) {

        previousBetsList.innerHTML = `

            <div
                style="
                    padding:20px;
                    text-align:center;
                    opacity:.6;
                "
            >
                No previous round yet
            </div>

        `;

        return;

    }


    /* =========================================
       DISPLAY PREVIOUS BETS
    ========================================= */

    window.previousRoundBets.forEach(
        bet => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "previous-bet-row";


            row.innerHTML = `

                <span class="previous-player">

                    ${bet.player}

                </span>


                <span>

                    ${bet.amount}

                </span>


                <span class="previous-multiplier">

                    ${bet.multiplier || "--"}

                </span>


                <span>

                    ${bet.winnings || "--"}

                </span>

            `;


            if (bet.winner) {

                row.classList.add(
                    "winner"
                );

            }


            previousBetsList.appendChild(
                row
            );

        }
    );

}


/* =========================================
   LOAD TOP BETS
========================================= */

function loadTopBets() {

    const topBetsList =
        document.getElementById(
            "topBetsList"
        );


    topBetsList.innerHTML =
        "";


    /* =========================================
       GET CURRENT BETS
    ========================================= */

    const rows =
        Array.from(
            betsList.querySelectorAll(
                ".bet-row"
            )
        );


    /* =========================================
       SORT BY BET AMOUNT
    ========================================= */

    rows.sort(
        (a, b) => {

            const amountA =
                parseFloat(
                    a.children[1]
                        .textContent
                        .replace(/,/g, "")
                ) || 0;


            const amountB =
                parseFloat(
                    b.children[1]
                        .textContent
                        .replace(/,/g, "")
                ) || 0;


            return amountB - amountA;

        }
    );


    /* =========================================
       SHOW TOP 10
    ========================================= */

    rows
        .slice(0, 10)
        .forEach(
            originalRow => {

                const row =
                    originalRow.cloneNode(
                        true
                    );


                topBetsList.appendChild(
                    row
                );

            }
        );

}


/* =========================================
   BUTTON NAVIGATION
========================================= */

betTabs.forEach(
    (tab, index) => {

        tab.addEventListener(
            "click",
            () => {

                /* -------------------------
                   REMOVE ACTIVE
                ------------------------- */

                betTabs.forEach(
                    button => {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


                /* -------------------------
                   ACTIVATE CLICKED BUTTON
                ------------------------- */

                tab.classList.add(
                    "active"
                );


                /* -------------------------
                   ALL BETS
                ------------------------- */

                if (index === 0) {

                    showAllBets();

                }


                /* -------------------------
                   PREVIOUS
                ------------------------- */

                else if (index === 1) {

                    showPreviousBets();

                }


                /* -------------------------
                   TOP
                ------------------------- */

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