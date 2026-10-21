/* Detailed Top bets cards in the shared bet list panel. */
(() => {
    "use strict";

    const list = document.getElementById("liveBetsList");
    const summary = document.querySelector(".all-bets-info");
    const headings = document.querySelector(".bets-table-head");
    if (!list) return;

    let metric = "x";
    let period = "month";

    const amountOf = row => parseFloat((row.children[1]?.textContent || "").replace(/,/g, "")) || 0;
    const multiplierOf = row => parseFloat((row.querySelector(".multiplier-value")?.textContent || "").replace("x", "")) || 0;
    const winningsOf = row => parseFloat((row.children[3]?.textContent || "").replace(/,/g, "")) || amountOf(row) * multiplierOf(row);

    function renderControlGroup(className, options, selected, onSelect) {
        const group = document.createElement("div");
        group.className = `top-filter-group ${className}`;
        group.setAttribute("role", "group");
        options.forEach(option => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = option.label;
            button.classList.toggle("active", option.value === selected);
            button.setAttribute("aria-pressed", String(option.value === selected));
            button.addEventListener("click", () => onSelect(option.value));
            group.appendChild(button);
        });
        return group;
    }

    function makeCard(row, index) {
        const name = row.querySelector(".player-name")?.textContent.trim() || `Player ${index + 1}`;
        const avatar = row.querySelector(".player-name i")?.textContent.trim() || "👤";
        const bet = amountOf(row);
        const multiplier = multiplierOf(row);
        const win = winningsOf(row);
        const result = multiplier || (win && bet ? win / bet : 0);
        const ageDays = index % 7;
        const date = new Date();
        date.setDate(date.getDate() - ageDays);
        const dateLabel = date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });

        const card = document.createElement("article");
        card.className = "top-bet-card";
        card.innerHTML = `
            <div class="top-bet-player">
                <span class="top-bet-avatar" aria-hidden="true">${avatar}</span>
                <span class="top-bet-identity"><strong>${name}</strong><small>${dateLabel}</small></span>
                <span class="top-bet-actions" aria-hidden="true"><i>◌</i><i>♢</i></span>
            </div>
            <div class="top-bet-details">
                <span><small>Bet KES</small><strong>${bet.toFixed(2)}</strong></span>
                <span><small>Result</small><strong class="top-result">${result.toFixed(2)}x</strong></span>
                <span><small>Win KES</small><strong>${win.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                <span><small>Round max.</small><strong class="top-result">${(result ? result * (1.02 + (index % 5) * 0.015) : 0).toFixed(2)}x</strong></span>
            </div>`;
        return { card, bet, result, win, ageDays };
    }

    function showTopBets() {
        if (summary) summary.hidden = true;
        if (headings) headings.hidden = true;
        list.hidden = false;
        list.classList.add("top-bets-list");
        list.replaceChildren();

        const filters = document.createElement("section");
        filters.className = "top-filter-card";
        filters.setAttribute("aria-label", "Top bet filters");
        filters.appendChild(renderControlGroup("top-metrics", [
            { label: "X", value: "x" }, { label: "Win", value: "win" }, { label: "Rounds", value: "rounds" }
        ], metric, value => { metric = value; showTopBets(); }));
        filters.appendChild(renderControlGroup("top-periods", [
            { label: "Day", value: "day" }, { label: "Month", value: "month" }, { label: "Year", value: "year" }
        ], period, value => { period = value; showTopBets(); }));
        list.appendChild(filters);

        const periodDays = { day: 1, month: 30, year: 365 }[period];
        const bets = (window.currentLiveBets || [])
            .map(makeCard)
            .filter(bet => bet.ageDays < periodDays);
        bets.sort((a, b) => metric === "win" ? b.win - a.win : metric === "rounds" ? b.bet - a.bet : b.result - a.result);
        if (!bets.length) {
            const empty = document.createElement("div");
            empty.className = "no-previous-bets";
            empty.textContent = "No bets available";
            list.appendChild(empty);
            return;
        }
        bets.slice(0, 10).forEach(bet => list.appendChild(bet.card));
    }

    window.showTopBets = showTopBets;
})();
