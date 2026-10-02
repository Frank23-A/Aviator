let multiplier = 1
let crashPoint = 0
let interval
let flightTick = 0
let countdownTimer = null

const plane = document.getElementById("plane")
const canvas = document.getElementById("trail")
const ctx = canvas.getContext("2d")

const loading = document.getElementById("loading")
const multiplierDisplay = document.getElementById("multiplier")
const rays = document.querySelector(".rays")

const planeWidth = 86
const planeHeight = 41

const planeTailX = 3
const planeTailY = 35

const trailAttachX = planeTailX + 5
const trailAttachY = planeTailY

canvas.width = 740
canvas.height = 180

let points = []


/* =========================================
   ROUND HISTORY
========================================= */

function addRoundHistory(value){

    const historyList =
        document.getElementById("historyList")


    /* Make sure history element exists */

    if(!historyList){
        return
    }


    /* Create history item */

    const item =
        document.createElement("div")


    item.classList.add(
        "history-item"
    )


    /* =====================================
       CHOOSE COLOR
    ===================================== */

    if(value < 2){

        item.classList.add(
            "history-blue"
        )

    }

    else if(value < 10){

        item.classList.add(
            "history-purple"
        )

    }

    else{

        item.classList.add(
            "history-green"
        )

    }


    /* =====================================
       DISPLAY MULTIPLIER
    ===================================== */

    item.innerText =
        Number(value).toFixed(2) + "x"


    /* =====================================
       ADD NEW RESULT TO THE LEFT
    ===================================== */

    historyList.prepend(item)


    /* =====================================
       KEEP ONLY 10 RESULTS
    ===================================== */

    while(
        historyList.children.length > 10
    ){

        historyList.removeChild(
            historyList.lastElementChild
        )

    }

}


/* =========================================
   START ROUND
========================================= */

function startRound(){

    clearInterval(interval)


    /* Make sure old countdown is cleared */

    if(countdownTimer){

        clearTimeout(
            countdownTimer
        )

        countdownTimer = null

    }


    /*
        Get a new crash point
    */

    fetch("/crash")

        .then(res => res.json())

        .then(data => {

            startFlight(
                data.crash
            )

        })

        .catch(() => {

            startFlight(
                generateLocalCrash()
            )

        })

}


/* =========================================
   LOCAL CRASH GENERATOR
========================================= */

function generateLocalCrash(){

    let r =
        Math.random()


    let crash =
        Math.round(
            (1 / (1 - r)) * 100
        ) / 100


    if(crash > 100){

        crash = 100

    }


    if(crash < 2){

        crash =
            2 +
            Math.random() * 2

    }


    return crash

}


/* =========================================
   START FLIGHT
========================================= */

function startFlight(crash){

    crashPoint =
        Math.max(
            Number(crash) || 2,
            2
        )


    multiplier = 1

    flightTick = 0


    /* Hide countdown */

    loading.style.display =
        "none"


    /* Show multiplier */

    multiplierDisplay.style.display =
        "block"


    multiplierDisplay.innerText =
        "1.00x"


    /* Show plane and canvas */

    plane.style.display =
        "block"

    canvas.style.display =
        "block"


    /* Put plane at bottom-left */

    plane.style.left =
        -planeTailX + "px"

    plane.style.top =
        (
            canvas.height -
            planeTailY
        ) + "px"


    /* Clear old trail */

    points = []


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    )


    /*
        START RAYS AT THE SAME TIME
        THE PLANE STARTS
    */

    if(rays){

        rays.classList.add(
            "rays-active"
        )

    }


    /* Start flight */

    interval =
        setInterval(
            updateGame,
            40
        )

}


/* =========================================
   UPDATE GAME
========================================= */

function updateGame(){

    flightTick++

    multiplier += 0.01


    multiplierDisplay.innerText =
        multiplier.toFixed(2) + "x"


    let flightTime =
        flightTick / 36


    let maxPlaneX =
        canvas.width -
        planeWidth


    let maxPlaneY = 0


    let startY =
        canvas.height -
        planeTailY


    let climbProgress =
        Math.max(
            0,
            flightTime - 0.35
        )


    let flightProgress =
        Math.min(
            1,
            1 -
            Math.exp(
                -climbProgress * 0.18
            )
        )


    /* ================================
       PLANE X MOVEMENT
    ================================= */

    let x =
        -planeTailX +
        (
            maxPlaneX +
            planeTailX
        ) *
        flightProgress


    /* ================================
       PLANE UPWARD MOVEMENT
    ================================= */

    let upward =
        (
            startY -
            maxPlaneY
        ) *
        Math.pow(
            flightProgress,
            1.8
        )


    /* ================================
       EARLY PLANE MOVEMENT
    ================================= */

    let wave =
        Math.sin(
            flightTime * 1.4
        ) *
        Math.min(
            4,
            climbProgress * 2
        ) *
        (
            1 -
            flightProgress
        )


    /* ================================
       HOVER MOVEMENT
    ================================= */

    let hoverProgress =
        Math.min(
            1,
            Math.max(
                0,
                (
                    flightProgress -
                    0.82
                ) / 0.18
            )
        )


    let hoverEase =
        hoverProgress *
        hoverProgress *
        (
            3 -
            2 * hoverProgress
        )


    let hoverTime =
        Math.max(
            0,
            flightTime - 9.8
        )


    let hoverDance =
        Math.sin(
            hoverTime * 0.42
        ) *
        3 *
        hoverEase


    /* ================================
       FINAL PLANE POSITION
    ================================= */

    let y =
        (
            canvas.height -
            planeTailY
        ) -
        upward +
        wave +
        hoverDance


    /* ================================
       KEEP PLANE INSIDE GAME
    ================================= */

    if(x > maxPlaneX){

        x = maxPlaneX

    }


    if(y < 0){

        y = 0

    }


    if(
        y >
        canvas.height -
        planeTailY
    ){

        y =
            canvas.height -
            planeTailY

    }


    /* ================================
       APPLY PLANE POSITION
    ================================= */

    plane.style.left =
        x + "px"

    plane.style.top =
        y + "px"


    /* ================================
       CREATE TRAIL
    ================================= */

    let trailPoint = {

        x:
            x +
            trailAttachX,

        y:
            y +
            trailAttachY

    }


    if(
        flightProgress > 0.96 &&
        points.length > 0
    ){

        points[
            points.length - 1
        ] =
            trailPoint

    }

    else{

        points.push(
            trailPoint
        )

    }


    drawTrail()


    /* ================================
       CRASH
    ================================= */

    if(
        multiplier >=
        crashPoint
    ){

        clearInterval(interval)

        interval = null


        /* =================================
           ADD ROUND TO HISTORY
        ================================= */

        addRoundHistory(
            crashPoint
        )


        /* =================================
           STOP RAYS
        ================================= */

        if(rays){

            rays.classList.remove(
                "rays-active"
            )

        }


        /* =================================
           KEEP PLANE VISIBLE
        ================================= */

        plane.style.display =
            "block"

        canvas.style.display =
            "block"


        /* =================================
           RETURN PLANE TO BOTTOM-LEFT
        ================================= */

        plane.style.left =
            -planeTailX + "px"

        plane.style.top =
            (
                canvas.height -
                planeTailY
            ) + "px"


        /* =================================
           CLEAR TRAIL
        ================================= */

        points = []


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        )


        /* =================================
           HIDE MULTIPLIER
        ================================= */

        multiplierDisplay.style.display =
            "none"


        /* =================================
           SHOW COUNTDOWN
        ================================= */

        loading.style.display =
            "block"


        /* =================================
           GET COUNTDOWN BAR
        ================================= */

        let progress =
            loading.querySelector(
                ".countdown-progress"
            )


        /* Restart animation */

        progress.style.animation =
            "none"


        /* Force browser reflow */

        progress.offsetHeight


        /* Start 5-second countdown */

        progress.style.animation =
            "countdownProgress 5s linear forwards"


        /* =================================
           START NEW ROUND AFTER 5 SECONDS
        ================================= */

        countdownTimer =
            setTimeout(() => {

                loading.style.display =
                    "none"

                countdownTimer = null

                startRound()

            }, 5000)

    }

}


/* =========================================
   DRAW TRAIL
========================================= */

function drawTrail(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    )


    if(points.length < 1){

        return

    }


    /* =====================================
       TRAIL FILL
    ===================================== */

    ctx.beginPath()

    ctx.moveTo(
        0,
        canvas.height
    )


    for(
        let i = 0;
        i < points.length;
        i++
    ){

        let p =
            points[i]

        let next =
            points[i + 1]


        if(next){

            ctx.quadraticCurveTo(
                p.x,
                p.y,
                (p.x + next.x) / 2,
                (p.y + next.y) / 2
            )

        }

        else{

            ctx.lineTo(
                p.x,
                p.y
            )

        }

    }


    let lastPoint =
        points[
            points.length - 1
        ]


    ctx.lineTo(
        lastPoint.x,
        canvas.height
    )


    ctx.closePath()


    let fill =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        )


    fill.addColorStop(
        0,
        "rgba(228, 95, 54, 0.45)"
    )


    fill.addColorStop(
        1,
        "rgba(182, 109, 75, 0.85)"
    )


    ctx.fillStyle =
        fill

    ctx.fill()


    /* =====================================
       TRAIL OUTLINE
    ===================================== */

    ctx.beginPath()

    ctx.moveTo(
        0,
        canvas.height
    )


    for(
        let i = 0;
        i < points.length;
        i++
    ){

        let p =
            points[i]

        let next =
            points[i + 1]


        if(next){

            ctx.quadraticCurveTo(
                p.x,
                p.y,
                (p.x + next.x) / 2,
                (p.y + next.y) / 2
            )

        }

        else{

            ctx.lineTo(
                p.x,
                p.y
            )

        }

    }


    ctx.lineWidth = 4

    ctx.lineCap =
        "round"

    ctx.lineJoin =
        "round"

    ctx.strokeStyle =
        "rgba(201, 133, 94, 0.8)"

    ctx.shadowColor =
        "rgba(218, 129, 88, 0.79)"

    ctx.shadowBlur = 12

    ctx.stroke()


    /* =====================================
       THIN INNER LINE
    ===================================== */

    ctx.lineWidth = 1

    ctx.strokeStyle =
        "#d3816c"

    ctx.shadowBlur = 0

    ctx.stroke()

}


/* =========================================
   START FIRST ROUND
========================================= */

startRound()