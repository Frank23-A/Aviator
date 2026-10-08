
/* =========================================================
   THEME TOGGLE
========================================================= */

function toggleTheme() {

    const body =
        document.body;

    const themeButton =
        document.getElementById(
            "themeButton"
        );


    body.classList.toggle(
        "light-mode"
    );


    /* =====================================================
       LIGHT MODE
       SHOW CRESCENT MOON
    ====================================================== */

    if (
        body.classList.contains(
            "light-mode"
        )
    ) {

        themeButton.innerHTML = `

            <svg viewBox="0 0 24 24">

                <path
                    d="
                        M21 12.8
                        A8.5 8.5 0 1 1
                        11.2 3
                        A6.7 6.7 0 0 0
                        21 12.8Z
                    "
                ></path>

            </svg>

        `;

        themeButton.style.color =
            "#222222";


        localStorage.setItem(
            "theme",
            "light"
        );

    }


    /* =====================================================
       DARK MODE
       SHOW SUN
    ====================================================== */

    else {

        themeButton.innerHTML = `

            <svg viewBox="0 0 24 24">

                <circle
                    cx="12"
                    cy="12"
                    r="4"
                ></circle>

                <line
                    x1="12"
                    y1="2"
                    x2="12"
                    y2="5"
                ></line>

                <line
                    x1="12"
                    y1="19"
                    x2="12"
                    y2="22"
                ></line>

                <line
                    x1="2"
                    y1="12"
                    x2="5"
                    y2="12"
                ></line>

                <line
                    x1="19"
                    y1="12"
                    x2="22"
                    y2="12"
                ></line>

                <line
                    x1="4.9"
                    y1="4.9"
                    x2="7"
                    y2="7"
                ></line>

                <line
                    x1="17"
                    y1="17"
                    x2="19.1"
                    y2="19.1"
                ></line>

                <line
                    x1="17"
                    y1="7"
                    x2="19.1"
                    y2="4.9"
                ></line>

                <line
                    x1="4.9"
                    y1="19.1"
                    x2="7"
                    y2="17"
                ></line>

            </svg>

        `;

        themeButton.style.color =
            "#ffd000";


        localStorage.setItem(
            "theme",
            "dark"
        );

    }

}


/* =========================================================
   LOAD SAVED THEME
========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    function () {

        const savedTheme =
            localStorage.getItem(
                "theme"
            );


        if (
            savedTheme === "light"
        ) {

            /*
             * Add the class directly so the
             * saved light theme does not
             * accidentally toggle twice.
             */

            document.body.classList.add(
                "light-mode"
            );


            const themeButton =
                document.getElementById(
                    "themeButton"
                );


            themeButton.innerHTML = `

                <svg viewBox="0 0 24 24">

                    <path
                        d="
                            M21 12.8
                            A8.5 8.5 0 1 1
                            11.2 3
                            A6.7 6.7 0 0 0
                            21 12.8Z
                        "
                    ></path>

                </svg>

            `;

            themeButton.style.color =
                "#222222";

        }

    }
);


/* =========================================================
   HAMBURGER
========================================================= */

function toggleMenu() {

    alert("Menu clicked");

}


/* =========================================================
   DEPOSIT
========================================================= */

function deposit() {

    const overlay =
        document.getElementById("depositOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.add("show");

    overlay.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";

    const amountInput =
        document.getElementById("depositAmount");

    if (amountInput) {
        setTimeout(function () {
            amountInput.focus();
        }, 150);
    }

}


/* =========================================================
   CLOSE DEPOSIT POPUP
========================================================= */

function closeDeposit() {

    const overlay =
        document.getElementById("depositOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("show");

    overlay.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";

}


/* =========================================================
   SET DEPOSIT AMOUNT
========================================================= */

function setDepositAmount(amount) {

    const input =
        document.getElementById("depositAmount");

    if (!input) {
        return;
    }

    input.value = amount;

}


/* =========================================================
   CHANGE DEPOSIT AMOUNT
========================================================= */

function changeDepositAmount(change) {

    const input =
        document.getElementById("depositAmount");

    if (!input) {
        return;
    }

    let current =
        parseInt(input.value, 10);

    if (isNaN(current)) {
        current = 0;
    }

    current += change;

    if (current < 10) {
        current = 10;
    }

    input.value = current;

}


/* =========================================================
   DEPOSIT METHOD
========================================================= */

function selectDepositMethod(method) {

    const input =
        document.getElementById("depositAmount");

    let amount = 0;

    if (input) {
        amount =
            parseInt(input.value, 10) || 0;
    }

    if (amount < 10) {

        if (input) {
            input.focus();
        }

        return;
    }

    /*
     * The popup is currently a front-end UI.
     * Payment processing can be connected here later.
     */

    console.log(
        "Deposit method:",
        method,
        "Amount:",
        amount
    );

}


/* =========================================================
   CLOSE DEPOSIT WHEN CLICKING OUTSIDE THE CARD
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const overlay =
            document.getElementById("depositOverlay");

        const modal =
            document.getElementById("depositModal");

        if (!overlay || !modal) {
            return;
        }

        if (
            overlay.classList.contains("show")
            &&
            event.target === overlay
        ) {
            closeDeposit();
        }

    }
);


/* =========================================================
   CLOSE DEPOSIT WITH ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }

        const overlay =
            document.getElementById("depositOverlay");

        if (
            overlay
            &&
            overlay.classList.contains("show")
        ) {
            closeDeposit();
        }

    }
);


/* =========================================================
   GO BACK
========================================================= */

function goBack() {

    window.history.back();

}


/* =========================================================
   FULLSCREEN
========================================================= */

function openFullscreen() {

    if (!document.fullscreenElement) {

        document.documentElement
            .requestFullscreen()
            .catch(
                function (error) {

                    console.log(
                        "Fullscreen error:",
                        error
                    );

                }
            );

    }

    else {

        document.exitFullscreen();

    }

}


/* =========================================================
   KEYBOARD SUPPORT
========================================================= */

document
    .querySelector(".hamburger")
    .addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                toggleMenu();

            }

        }
    );


document
    .querySelector(".back")
    .addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                goBack();

            }

        }
    );


document
    .querySelector(".fullscreen")
    .addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openFullscreen();

            }

        }
    );

