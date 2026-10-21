/* All Bets / Previous tabs. Top rendering lives in top.js. */
(() => {
    "use strict";

    const tabs = Array.from(document.querySelectorAll(".bets-tab"));
    const list = document.getElementById("liveBetsList");
    const summary = document.querySelector(".all-bets-info");
    const headings = document.querySelector(".bets-table-head");

    if (!list || tabs.length < 3) return;

    function setActiveTab(tab) {
        list.setAttribute("aria-labelledby", tab.id);
        tabs.forEach((button, index) => {
            const active = button === tab;
            button.classList.toggle("active", active);
            button.setAttribute("aria-selected", String(active));
            button.tabIndex = active ? 0 : -1;
        });
    }

    function setListHeader(title) {
        list.replaceChildren();
        const header = document.createElement("div");
        header.className = "previous-round-header";
        header.textContent = title;
        list.appendChild(header);
    }

    function rowFromBet(bet) {
        const row = document.createElement("div");
        row.className = "bet-row";
        if (bet.winner) row.classList.add("winner");

        const player = document.createElement("span");
        player.className = "player-name";
        player.textContent = bet.player || "Player";
        const amount = document.createElement("span");
        amount.textContent = bet.amount || "";
        const multiplier = document.createElement("span");
        multiplier.className = "multiplier-value";
        multiplier.textContent = bet.multiplier || "";
        const winnings = document.createElement("span");
        winnings.textContent = bet.winnings || "";
        row.append(player, amount, multiplier, winnings);
        return row;
    }

    function showAllBets() {
        if (summary) summary.hidden = false;
        if (headings) headings.hidden = false;
        list.hidden = false;
        list.replaceChildren();
        (window.currentLiveBets || []).forEach(row => list.appendChild(row.cloneNode(true)));
    }

    function showPreviousBets() {
        if (summary) summary.hidden = true;
        if (headings) headings.hidden = false;
        list.hidden = false;
        setListHeader("PREVIOUS ROUND");

        const bets = window.previousRoundBets || [];
        if (!bets.length) {
            const empty = document.createElement("div");
            empty.className = "no-previous-bets";
            empty.textContent = "No previous round yet";
            list.appendChild(empty);
            return;
        }
        bets.forEach(bet => list.appendChild(rowFromBet(bet)));
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            setActiveTab(tab);
            if (index === 0) showAllBets();
            else if (index === 1) showPreviousBets();
            else if (typeof window.showTopBets === "function") window.showTopBets();
        });

        tab.addEventListener("keydown", event => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (index + direction + tabs.length) % tabs.length;
            tabs[nextIndex].focus();
            tabs[nextIndex].click();
        });
    });

    window.showPreviousBets = showPreviousBets;
    window.showAllBets = showAllBets;
    setActiveTab(tabs[0]);
    showAllBets();
})();
