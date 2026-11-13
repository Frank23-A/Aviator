(() => {
    const cards = Array.from(document.querySelectorAll(".bottom-card"));
    const balanceDisplay = document.getElementById("headerBalance");
    const states = new Map();
    let currentRoundId = null;
    let currentMultiplier = 1;

    if (!cards.length) return;

    function controls(card) {
        return {
            button: card.querySelector(".green-button"),
            label: card.querySelector(".bet-label"),
            value: card.querySelector(".bet-value"),
            stake: card.querySelector(".stake-value"),
            stakeButtons: card.querySelectorAll("[data-adjust], [data-stake]"),
            tabs: card.querySelectorAll("[data-bet-mode]"),
            options: card.querySelector(".auto-options"),
            autoBet: card.querySelector(".auto-bet-toggle"),
            autoCashout: card.querySelector(".auto-cashout-toggle"),
            autoTarget: card.querySelector(".auto-cashout-target"),
            clearTarget: card.querySelector(".clear-auto-target"),
        };
    }

    function setBalance(value) {
        if (balanceDisplay && Number.isFinite(Number(value))) {
            balanceDisplay.textContent = Number(value).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
    }

    function amountFor(card) {
        const stake = controls(card).stake;
        const amount = Number(stake instanceof HTMLInputElement ? stake.value : stake?.textContent);
        return Number.isFinite(amount) ? amount : 0;
    }

    function show(card, label, value, disabled, mode = "bet") {
        const ui = controls(card);
        const state = states.get(card);
        if (!ui.button) return;

        if (ui.label) ui.label.textContent = label;
        if (ui.value) ui.value.textContent = value;
        ui.button.disabled = disabled || Boolean(state?.busy);
        ui.button.classList.toggle("bet-active", mode === "active" || mode === "queued");
        ui.button.classList.remove("bet-queued");

        const lockStake = mode === "active" || mode === "queued";
        if (ui.stake) ui.stake.disabled = lockStake;
        ui.stakeButtons.forEach(button => { button.disabled = lockStake; });
    }

    function paintCard(card) {
        const state = states.get(card);
        if (!state) return;

        if (state.wagerId) {
            const isQueued = state.queued;
            show(card, "", `${amountFor(card).toFixed(2)} USD`, isQueued, isQueued ? "queued" : "active");
        } else {
            show(card, "Bet", `${amountFor(card).toFixed(2)} USD`, !currentRoundId);
        }
    }

    async function post(url, payload) {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Bet request failed.");
        return data;
    }

    async function placeBet(card) {
        const state = states.get(card);
        if (!state || state.busy || state.wagerId || !currentRoundId) return;

        const amount = amountFor(card);
        if (!Number.isFinite(amount) || amount < 1) {
            window.alert("Enter a bet amount of at least USD 1.00.");
            return;
        }

        state.busy = true;
        paintCard(card);
        try {
            const result = await post("/api/bets/place", {
                round_id: currentRoundId,
                amount,
            });
            state.wagerId = result.wager_id;
            state.queued = result.status === "queued";
            setBalance(result.balance);
        } catch (error) {
            window.alert(error.message);
        } finally {
            state.busy = false;
            paintCard(card);
        }
    }

    async function cashOut(card) {
        const state = states.get(card);
        if (!state || state.busy || !state.wagerId || state.queued) return;

        state.busy = true;
        paintCard(card);
        try {
            const result = await post("/api/bets/cashout", { wager_id: state.wagerId });
            state.wagerId = null;
            state.queued = false;
            setBalance(result.balance);
        } catch (error) {
            window.alert(error.message);
        } finally {
            state.busy = false;
            paintCard(card);
        }
    }

    function setMode(card, mode) {
        const ui = controls(card);
        ui.tabs.forEach(tab => {
            const selected = tab.dataset.betMode === mode;
            tab.classList.toggle("active", selected);
            tab.setAttribute("aria-selected", String(selected));
        });
        if (ui.options) ui.options.hidden = mode !== "auto";
        if (mode === "auto") card.classList.add("auto-mode");
        if (mode === "bet") {
            if (ui.autoBet) ui.autoBet.checked = false;
            if (ui.autoCashout) ui.autoCashout.checked = false;
        }
        // Keep the roomy layout once Auto has been opened, even when the
        // player switches back to Bet, so the controls never jump or overlap.
        const hasAutoOptions = cards.some(item => item.classList.contains("auto-mode"));
        document.querySelector(".bottom-cards")?.classList.toggle("has-auto-options", hasAutoOptions);
        document.querySelector(".dashboard-main")?.classList.toggle("has-auto-options", hasAutoOptions);
    }

    cards.forEach(card => {
        states.set(card, { wagerId: null, busy: false, queued: false });
        const ui = controls(card);
        card.classList.add("auto-mode");
        setMode(card, "bet");
        paintCard(card);

        ui.tabs.forEach(tab => {
            tab.addEventListener("click", () => setMode(card, tab.dataset.betMode));
        });

        ui.stake?.addEventListener("input", () => {
            const state = states.get(card);
            if (!state.wagerId) paintCard(card);
        });

        card.querySelectorAll("[data-adjust], [data-stake]").forEach(button => {
            button.addEventListener("click", () => requestAnimationFrame(() => {
                if (!states.get(card).wagerId) paintCard(card);
            }));
        });

        ui.button?.addEventListener("click", () => {
            const state = states.get(card);
            if (state.wagerId && !state.queued) cashOut(card);
            else if (!state.wagerId) placeBet(card);
        });

        ui.autoBet?.addEventListener("change", () => {
            if (ui.autoBet.checked && currentRoundId && !states.get(card).wagerId) {
                placeBet(card);
            }
        });

        ui.autoCashout?.addEventListener("change", () => {
            const target = Number(ui.autoTarget?.value);
            if (ui.autoCashout.checked && states.get(card).wagerId && !states.get(card).queued &&
                Number.isFinite(target) && target >= 1.01 && currentMultiplier >= target) {
                cashOut(card);
            }
        });

        ui.clearTarget?.addEventListener("click", () => {
            if (ui.autoTarget) ui.autoTarget.value = "1.10";
        });
    });

    window.addEventListener("aviatorRoundStarted", event => {
        currentRoundId = event.detail?.roundId || null;
        currentMultiplier = Number(event.detail?.multiplier) || currentMultiplier || 1;

        cards.forEach(card => {
            const state = states.get(card);
            if (state.queued) state.queued = false;
            if (!state.wagerId && controls(card).autoBet?.checked && currentRoundId) {
                placeBet(card);
            } else {
                paintCard(card);
            }
        });
    });

    window.addEventListener("aviatorMultiplier", event => {
        currentMultiplier = Number(event.detail?.multiplier) || currentMultiplier;
        cards.forEach(card => {
            const state = states.get(card);
            const ui = controls(card);
            const target = Number(ui.autoTarget?.value);
            if (state.wagerId && !state.queued && !state.busy && ui.autoCashout?.checked &&
                Number.isFinite(target) && target >= 1.01 && currentMultiplier >= target) {
                cashOut(card);
            }
        });
    });

    window.addEventListener("aviatorCrash", async event => {
        const roundId = event.detail?.roundId;
        currentRoundId = null;

        cards.forEach(card => {
            const state = states.get(card);
            if (state.wagerId && !state.queued) {
                state.wagerId = null;
                state.queued = false;
            }
            paintCard(card);
        });

        if (!roundId) return;
        try {
            const result = await post("/api/bets/settle-round", { round_id: roundId });
            setBalance(result.balance);
        } catch (error) {
            console.error("Unable to settle bets after crash:", error);
        }
    });
})();
