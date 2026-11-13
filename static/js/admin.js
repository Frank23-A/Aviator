const predictionDisplay = document.getElementById("value");
const messageDisplay = document.getElementById("message");
let predictionRefreshTimer = null;
let predictionRefreshInFlight = false;
let displayedRoundId = null;

async function refreshNextRound() {
    if (predictionRefreshInFlight) return;
    predictionRefreshInFlight = true;
    try {
        const response = await fetch("/admin_data", {
            cache: "no-store",
            headers: { "Accept": "application/json" }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load the next round.");

        const value = Number(data.next_crash);
        if (!Number.isFinite(value)) throw new Error("Next round value is unavailable.");

        predictionDisplay.textContent = `${value.toFixed(2)}x`;
        const roundId = Number(data.round_id);
        if (displayedRoundId === null) {
            displayedRoundId = roundId;
            messageDisplay.textContent = "Scheduled multiplier for the upcoming round.";
        } else if (roundId !== displayedRoundId) {
            displayedRoundId = roundId;
            messageDisplay.textContent = "New round started · showing the multiplier scheduled for the following round.";
        } else {
            messageDisplay.textContent = `Upcoming round · checked ${new Date().toLocaleTimeString()}.`;
        }
    } catch (error) {
        messageDisplay.textContent = `${error.message} Retrying automatically…`;
    } finally {
        predictionRefreshInFlight = false;
    }
}

function startPredictionRefresh() {
    if (predictionRefreshTimer !== null) return;
    refreshNextRound();
    predictionRefreshTimer = window.setInterval(refreshNextRound, 2000);
}

function stopPredictionRefresh() {
    if (predictionRefreshTimer === null) return;
    window.clearInterval(predictionRefreshTimer);
    predictionRefreshTimer = null;
}

startPredictionRefresh();
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopPredictionRefresh();
    } else {
        startPredictionRefresh();
    }
});

const commandOutput = document.getElementById("commandOutput");
const commandForm = document.getElementById("commandForm");

async function loadCommandHelp() {
    try {
        const response = await fetch("/admin/commands", { cache: "no-store" });
        const data = await response.json();
        commandOutput.textContent = data.output || data.error || "Could not load commands.";
    } catch (error) {
        commandOutput.textContent = "Could not load project commands.";
    }
}

commandForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    commandOutput.textContent = "Running…";
    try {
        const response = await fetch("/admin/commands", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: document.getElementById("commandName").value.trim() })
        });
        const data = await response.json();
        commandOutput.textContent = data.output || data.error || "Command returned no output.";
    } catch (error) {
        commandOutput.textContent = "Could not run the project command.";
    }
});

loadCommandHelp();

async function loadDiagnostics() {
    const summary = document.getElementById("diagnosticsSummary");
    const list = document.getElementById("diagnosticsList");
    try {
        const response = await fetch("/admin/diagnostics", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load system checks.");

        summary.textContent = `${data.error_count} error(s), ${data.warning_count} warning(s). Checks cover the main deployment settings and dependencies.`;
        list.replaceChildren();
        for (const item of data.checks) {
            const row = document.createElement("article");
            row.className = `diagnostic-item ${item.severity}`;
            const title = document.createElement("h3");
            title.textContent = `${item.severity.toUpperCase()}: ${item.title}`;
            const detail = document.createElement("p");
            detail.textContent = item.detail;
            row.append(title, detail);
            if (item.action) {
                const action = document.createElement("p");
                action.className = "action";
                action.textContent = `Recommended change: ${item.action}`;
                row.append(action);
            }
            list.append(row);
        }
    } catch (error) {
        summary.textContent = error.message;
        list.replaceChildren();
    }
}

loadDiagnostics();
