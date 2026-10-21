
let fallbackPrediction = null;
const predictionDisplay = document.getElementById("value");

function update() {
    fetch("/admin_data")
        .then(response => {
            if (!response.ok) throw new Error("Could not load the prediction.");
            return response.json();
        })
        .then(data => {
            if (predictionDisplay && Number.isFinite(Number(data.next_crash))) {
                predictionDisplay.textContent = `${data.next_crash}x`;
            }
        })
        .catch(() => {
            if (predictionDisplay) {
                predictionDisplay.textContent = `${generateLocalPrediction().toFixed(2)}x`;
            }
        });
}

function generateLocalPrediction() {
    if (fallbackPrediction !== null) {
        return fallbackPrediction
    }

    const r = Math.random();
    let prediction = Math.round((1 / (1 - r)) * 100) / 100;

    if (prediction > 100) {
        prediction = 100
    }

    if (prediction < 2) {
        prediction = 2 + Math.random() * 2
    }

    fallbackPrediction = prediction;
    return fallbackPrediction
}

window.setInterval(update, 1000);

update();
