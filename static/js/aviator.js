
let multiplier = 1;
let crashPoint = 0;
let interval = null;
let flightTick = 0;
let countdownTimer = null;


/* =========================================
   GAME ELEMENTS
========================================= */

const plane = document.getElementById("plane");
const canvas = document.getElementById("trail");
const ctx = canvas.getContext("2d");
const gameScreen = document.getElementById("game");

const loading = document.getElementById("loading");
const multiplierDisplay = document.getElementById("multiplier");
const rays = document.querySelector(".rays");


/* =========================================
   SHARED MULTIPLIER FOR BETLIST.JS
========================================= */

window.currentAviatorMultiplier = 1;


/* =========================================
   PLANE POSITION SETTINGS
========================================= */

const planeTailXRatio = 0.15;
const planeTailYRatio = 0.89;

let points = [];
let currentDanceAngle = 8;
let currentDanceBlend = 0;


/* =========================================
   RAYS
========================================= */

function setRaysActive(active) {
    if (!rays) {
        return;
    }

    rays.classList.toggle("rays-active", active);
}


/* =========================================
   LOADING SCREEN
========================================= */

function setLoadingVisible(visible) {
    if (!loading) {
        return;
    }

    loading.style.display = visible ? "block" : "none";
}


/* =========================================
   PLANE ANCHOR
========================================= */

function getPlaneAnchor() {
    const width = plane.offsetWidth || 86;
    const height = plane.offsetHeight || width * 0.63;

    return {
        x: width * planeTailXRatio,
        y: height * planeTailYRatio,
        width,
        height
    };
}


/* =========================================
   POSITION PLANE
========================================= */

function placePlaneAtTrailAnchor(anchorX, anchorY) {
    const anchor = getPlaneAnchor();

    plane.style.left = `${anchorX - anchor.x}px`;
    plane.style.top = `${anchorY - anchor.y}px`;
}


/* =========================================
   RESIZE GAME CANVAS
========================================= */

function resizeGameCanvas() {
    const bounds = gameScreen.getBoundingClientRect();

    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));

    if (canvas.width === width && canvas.height === height) {
        return;
    }

    canvas.width = width;
    canvas.height = height;

    points = [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (loading.style.display === "none") {
        placePlaneAtTrailAnchor(0, canvas.height);
    }
}


resizeGameCanvas();

window.addEventListener("resize", resizeGameCanvas);

if ("ResizeObserver" in window) {
    new ResizeObserver(resizeGameCanvas).observe(gameScreen);
}


/* =========================================
   BOTTOM CARD STAKE CONTROLS
========================================= */

document.querySelectorAll(".bottom-card").forEach(card => {
    let stake = 1;

    const stakeDisplay = card.querySelector(".stake-value");
    const betValue = card.querySelector(".bet-value");

    function renderStake() {
        if (stakeDisplay) {
            stakeDisplay.textContent = stake.toFixed(2);
        }

        if (betValue) {
            betValue.textContent = `${stake.toFixed(2)} USD`;
        }
    }

    card.querySelectorAll("[data-adjust]").forEach(button => {
        button.addEventListener("click", () => {
            stake = Math.max(
                1,
                stake + Number(button.dataset.adjust)
            );

            renderStake();
        });
    });

    card.querySelectorAll("[data-stake]").forEach(button => {
        button.addEventListener("click", () => {
            stake = Number(button.dataset.stake);
            renderStake();
        });
    });
});


/* =========================================
   ROUND HISTORY
========================================= */

function addRoundHistory(value) {
    const historyList = document.getElementById("historyList");

    if (!historyList) {
        return;
    }

    const item = document.createElement("div");

    item.classList.add("history-item");

    if (value < 2) {
        item.classList.add("history-blue");
    } else if (value < 10) {
        item.classList.add("history-purple");
    } else {
        item.classList.add("history-green");
    }

    item.innerText = Number(value).toFixed(2) + "x";

    historyList.prepend(item);

    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastElementChild);
    }
}


/* =========================================
   START ROUND
========================================= */

function startRound() {
    clearInterval(interval);

    interval = null;

    if (countdownTimer) {
        clearTimeout(countdownTimer);
        countdownTimer = null;
    }

    fetch("/crash")
        .then(res => {
            if (!res.ok) {
                throw new Error("Unable to retrieve crash point");
            }

            return res.json();
        })
        .then(data => {
            startFlight(data.crash);
        })
        .catch(() => {
            startFlight(generateLocalCrash());
        });
}


/* =========================================
   LOCAL CRASH GENERATOR
========================================= */

function generateLocalCrash() {
    const r = Math.random();

    let crash = Math.round((1 / (1 - r)) * 100) / 100;

    if (crash > 100) {
        crash = 100;
    }

    if (crash < 2) {
        crash = 2 + Math.random() * 2;
    }

    return crash;
}


/* =========================================
   START FLIGHT
========================================= */

function startFlight(crash) {
    clearInterval(interval);
    interval = null;

    crashPoint = Math.max(Number(crash) || 2, 2);

    multiplier = 1;
    flightTick = 0;

    // Reset the shared multiplier for betlist.js.
    window.currentAviatorMultiplier = multiplier;

    setLoadingVisible(false);

    multiplierDisplay.style.display = "block";
    multiplierDisplay.innerText = "1.00x";

    plane.style.display = "block";
    canvas.style.display = "block";

    placePlaneAtTrailAnchor(0, canvas.height);

    points = [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setRaysActive(true);

    /*
       Tell betlist.js that the new flight has started.
       This event fires once per flight.
    */

    window.dispatchEvent(
        new CustomEvent("aviatorRoundStarted")
    );

    // Start the flight.
    interval = setInterval(updateGame, 40);
}


/* =========================================
   UPDATE GAME
========================================= */

function updateGame() {
    flightTick++;

    multiplier += 0.01;

    /*
       SHARE THE EXACT CURRENT MULTIPLIER
       WITH BETLIST.JS.
    */

    window.currentAviatorMultiplier = multiplier;

    multiplierDisplay.innerText =
        multiplier.toFixed(2) + "x";


    /* =====================================
       FLIGHT TIME
    ===================================== */

    let flightTime = flightTick / 36;

    const planeAnchor = getPlaneAnchor();

    const maxAnchorX =
        canvas.width - planeAnchor.width + planeAnchor.x;

    const minAnchorY = planeAnchor.y;
    const maxAnchorY = canvas.height;


    /* =====================================
       FLIGHT PROGRESS
    ===================================== */

    let climbProgress = Math.max(
        0,
        flightTime - 0.35
    );

    let flightProgress = Math.min(
        1,
        1 - Math.exp(-climbProgress * 0.18)
    );


    /* =====================================
       PLANE X MOVEMENT
    ===================================== */

    let x = maxAnchorX * flightProgress;


    /* =====================================
       PLANE UPWARD MOVEMENT
    ===================================== */

    let upward =
        (maxAnchorY - minAnchorY) *
        Math.pow(flightProgress, 1.8);


    /* =====================================
       SMOOTH REPEATING PLANE DANCE
    ===================================== */

    const danceStartProgress = 0.05;

    const danceStartTime =
        0.35 - Math.log(1 - danceStartProgress) / 0.18;

    const danceTime = Math.max(
        0,
        flightTime - danceStartTime
    );

    const maxAngle = 30;
    const minAngle = 0;
    const angleCycle = 6000;

    const angleProgress =
        (
            Math.sin(
                (2 * Math.PI * danceTime) / angleCycle -
                Math.PI / 2
            ) + 1
        ) / 2;

    const currentAngle =
        minAngle +
        (maxAngle - minAngle) * angleProgress;

    const angleRadians = currentAngle * Math.PI / 180;

    const angleRange =
        maxAnchorX * Math.tan(angleRadians);

    const danceAmplitude =
        Math.min(35, angleRange * 0.035);

    const danceBlendProgress =
        Math.min(1, danceTime / 2.5);

    const smoothDanceBlend =
        danceBlendProgress *
        danceBlendProgress *
        (3 - 2 * danceBlendProgress);

    currentDanceAngle = currentAngle;
    currentDanceBlend = smoothDanceBlend;

    const danceWave =
        angleProgress *
        danceAmplitude *
        smoothDanceBlend;


    /* =====================================
       FINAL PLANE POSITION
    ===================================== */

    const flightPathY = maxAnchorY - upward;

    const danceOffset =
        flightProgress >= danceStartProgress
            ? danceWave
            : 0;

    const y = flightPathY + danceOffset;


    /* =====================================
       KEEP PLANE INSIDE GAME
    ===================================== */

    if (x > maxAnchorX) {
        x = maxAnchorX;
    }

    let finalY = y;

    if (finalY < minAnchorY) {
        finalY = minAnchorY;
    }

    if (finalY > maxAnchorY) {
        finalY = maxAnchorY;
    }


    /* =====================================
       APPLY PLANE POSITION
    ===================================== */

    placePlaneAtTrailAnchor(x, finalY);

    if (flightProgress >= danceStartProgress) {
        plane.style.transform = `rotate(${-currentAngle}deg)`;
    } else {
        plane.style.transform = "rotate(0deg)";
    }


    /* =====================================
       CREATE TRAIL
    ===================================== */

    const trailPoint = {
        x,
        y: finalY
    };

    if (flightProgress > 0.96 && points.length > 0) {
        points[points.length - 1] = trailPoint;
    } else {
        points.push(trailPoint);
    }

    drawTrail();


    /* =====================================
       CRASH
    ===================================== */

    if (multiplier >= crashPoint) {
        clearInterval(interval);
        interval = null;

        // Freeze the shared multiplier at the crash point.
        multiplier = crashPoint;

        window.currentAviatorMultiplier = multiplier;

        addRoundHistory(crashPoint);

        /*
           Notify betlist.js to stop simulated cash-outs.
        */

        window.dispatchEvent(
            new CustomEvent("aviatorCrash", {
                detail: {
                    crash: crashPoint
                }
            })
        );

        setRaysActive(false);

        plane.style.display = "block";
        canvas.style.display = "block";

        placePlaneAtTrailAnchor(0, canvas.height);

        points = [];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        multiplierDisplay.style.display = "none";

        setLoadingVisible(true);


        /* =================================
           COUNTDOWN BAR
        ================================= */

        const progress =
            loading.querySelector(".countdown-progress");

        if (progress) {
            progress.style.animation = "none";

            // Force browser reflow.
            progress.offsetHeight;

            progress.style.animation =
                "countdownProgress 5s linear forwards";
        }


        /* =================================
           START NEXT ROUND AFTER 5 SECONDS
        ================================= */

        countdownTimer = setTimeout(() => {
            setLoadingVisible(false);

            countdownTimer = null;

            /*
               Generate new live bets for the next round.
            */

            if (typeof startNewBetRound === "function") {
                startNewBetRound();
            }

            startRound();

        }, 5000);
    }
}


/* =========================================
   DRAW TRAIL
========================================= */

function drawTrail() {
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (points.length < 1) {
        return;
    }


    /* =====================================
       TRAIL FILL
    ===================================== */

    ctx.beginPath();

    ctx.moveTo(
        0,
        canvas.height
    );

    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const next = points[i + 1];

        const progress =
            points.length <= 1
                ? 1
                : i / (points.length - 1);

        const angle =
            currentDanceAngle * Math.PI / 180;

        const angleOffset =
            Math.tan(angle) *
            (1 - progress) *
            28 *
            currentDanceBlend;

        const tailY = p.y - angleOffset;

        if (next) {
            const nextOffset =
                Math.tan(angle) *
                (1 - progress) *
                28 *
                currentDanceBlend;

            const nextY = next.y - nextOffset;

            ctx.quadraticCurveTo(
                p.x,
                tailY,
                (p.x + next.x) / 2,
                (tailY + nextY) / 2
            );
        } else {
            ctx.lineTo(p.x, tailY);
        }
    }

    const lastPoint = points[points.length - 1];

    ctx.lineTo(
        lastPoint.x,
        canvas.height
    );

    ctx.closePath();

    const fill = ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height
    );

    fill.addColorStop(
        0,
        "rgba(255, 18, 58, 0.32)"
    );

    fill.addColorStop(
        1,
        "rgba(190, 0, 34, 0.78)"
    );

    ctx.fillStyle = fill;

    ctx.fill();


    /* =====================================
       TRAIL OUTLINE
    ===================================== */

    ctx.beginPath();

    ctx.moveTo(
        0,
        canvas.height
    );

    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const next = points[i + 1];

        if (next) {
            ctx.quadraticCurveTo(
                p.x,
                p.y,
                (p.x + next.x) / 2,
                (p.y + next.y) / 2
            );
        } else {
            ctx.lineTo(
                p.x,
                p.y
            );
        }
    }

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "rgba(255, 12, 52, 0.95)";
    ctx.shadowColor = "rgba(255, 0, 48, 0.85)";
    ctx.shadowBlur = 12;

    ctx.stroke();


    /* =====================================
       THIN INNER LINE
    ===================================== */

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#ff4967";
    ctx.shadowBlur = 0;

    ctx.stroke();
}


/* =========================================
   START FIRST ROUND
========================================= */

startRound();
