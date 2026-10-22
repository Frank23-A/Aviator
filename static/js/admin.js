const predictionDisplay = document.getElementById("value");
const messageDisplay = document.getElementById("message");

async function refreshNextRound() {
    try {
        const response = await fetch("/admin_data", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load the next round.");

        const value = Number(data.next_crash);
        if (!Number.isFinite(value)) throw new Error("Next round value is unavailable.");

        predictionDisplay.textContent = `${value.toFixed(2)}x`;
        messageDisplay.textContent = "Updates automatically when a new round is scheduled.";
    } catch (error) {
        predictionDisplay.textContent = "Unavailable";
        messageDisplay.textContent = error.message;
    }
}

refreshNextRound();
window.setInterval(refreshNextRound, 1000);
