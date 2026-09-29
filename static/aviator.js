let multiplier = 1
let crashPoint = 0
let interval
let flightTick = 0

const plane = document.getElementById("plane")
const canvas = document.getElementById("trail")
const ctx = canvas.getContext("2d")
const planeWidth = 86
const planeHeight = 41
const planeTailX = 3
const planeTailY = 35
const trailAttachX = planeTailX + 5
const trailAttachY = planeTailY

canvas.width = 600
canvas.height = 200

let points = []

function startRound(){

clearInterval(interval)

fetch("/crash")
.then(res => res.json())
.then(data => startFlight(data.crash))
.catch(() => startFlight(generateLocalCrash()))

}

function generateLocalCrash(){

let r = Math.random()
let crash = Math.round((1 / (1 - r)) * 100) / 100

if(crash > 100){
crash = 100
}

if(crash < 2){
crash = 2 + Math.random() * 2
}

return crash

}

function startFlight(crash){

crashPoint = Math.max(crash, 2)

multiplier = 1
flightTick = 0

document.getElementById("loading").style.display="none"

document.getElementById("multiplier").style.display="block"

plane.style.display="block"
canvas.style.display="block"

plane.style.left=-planeTailX+"px"
plane.style.top=(canvas.height - planeTailY)+"px"

points=[]
ctx.clearRect(0,0,canvas.width,canvas.height)

interval=setInterval(updateGame,40)

}

function updateGame(){

flightTick++

multiplier += 0.01

document.getElementById("multiplier").innerText =
multiplier.toFixed(2)+"x"

let flightTime = flightTick / 36
let maxPlaneX = canvas.width - planeWidth
let maxPlaneY = 0
let startY = canvas.height - planeTailY
let climbProgress = Math.max(0, flightTime - 0.35)
let flightProgress = Math.min(1, 1 - Math.exp(-climbProgress * 0.18))
let x = -planeTailX + (maxPlaneX + planeTailX) * flightProgress
let upward = (startY - maxPlaneY) * Math.pow(flightProgress, 1.8)
let wave = Math.sin(flightTime * 1.4) * Math.min(4, climbProgress * 2) * (1 - flightProgress)
let hoverProgress = Math.min(1, Math.max(0, (flightProgress - 0.82) / 0.18))
let hoverEase = hoverProgress * hoverProgress * (3 - 2 * hoverProgress)
let hoverTime = Math.max(0, flightTime - 9.8)
let hoverDance = Math.sin(hoverTime * 0.42) * 3 * hoverEase
let y = (canvas.height - planeTailY) - upward + wave + hoverDance

if(x > maxPlaneX){
x = maxPlaneX
}

if(y < 0){
y = 0
}

if(y > canvas.height - planeTailY){
y = canvas.height - planeTailY
}

plane.style.left = x+"px"
plane.style.top = y+"px"

let trailPoint = {x:x+trailAttachX,y:y+trailAttachY}

if(flightProgress > 0.96 && points.length > 0){
points[points.length - 1] = trailPoint
}else{
points.push(trailPoint)
}

drawTrail()

if(multiplier >= crashPoint){

clearInterval(interval)

plane.style.display="none"
canvas.style.display="none"
ctx.clearRect(0,0,canvas.width,canvas.height)

document.getElementById("multiplier").style.display="none"

let loading = document.getElementById("loading")

loading.style.display="block"

loading.innerText = "5"

let countdown = 5

let countdownInterval = setInterval(() => {

countdown--

loading.innerText = countdown

if(countdown <= 0){

clearInterval(countdownInterval)

startRound()

}

}, 1000)

}

}

function drawTrail(){

ctx.clearRect(0,0,canvas.width,canvas.height)

if(points.length < 1){
return
}

ctx.beginPath()
ctx.moveTo(0, canvas.height)

for(let i = 0; i < points.length; i++){

let p = points[i]
let next = points[i + 1]

if(next){
ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2)
}else{
ctx.lineTo(p.x, p.y)
}

}

let lastPoint = points[points.length - 1]

ctx.lineTo(lastPoint.x, canvas.height)
ctx.closePath()

let fill = ctx.createLinearGradient(0, 0, 0, canvas.height)
fill.addColorStop(0, "rgba(228, 95, 54, 0.45)")
fill.addColorStop(1, "rgba(182, 109, 75, 0.85)")
ctx.fillStyle = fill
ctx.fill()

ctx.beginPath()
ctx.moveTo(0, canvas.height)

for(let i = 0; i < points.length; i++){

let p = points[i]
let next = points[i + 1]

if(next){
ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2)
}else{
ctx.lineTo(p.x, p.y)
}

}

ctx.lineWidth = 4
ctx.lineCap = "round"
ctx.lineJoin = "round"
ctx.strokeStyle = "rgba(201, 133, 94, 0.8)"
ctx.shadowColor = "rgba(218, 129, 88, 0.79)"
ctx.shadowBlur = 12
ctx.stroke()

ctx.lineWidth = 1
ctx.strokeStyle = "#d3816c"
ctx.shadowBlur = 0
ctx.stroke()

}

startRound()
