(() => {
    const layer = document.getElementById("safetyDrift");
    if (!layer) return;

    const message = "This page is unavailable. Please go back to safety!";
    const warning = document.createElement("span");
    warning.className = "safety-warning";
    warning.textContent = message;
    layer.appendChild(warning);

    function moveToRandomPosition(initial = false) {
        const maxLeft = Math.max(0, layer.clientWidth - warning.offsetWidth);
        const maxTop = Math.max(0, layer.clientHeight - warning.offsetHeight);

        // Pick a new free-form point so the warning drifts diagonally around
        // the page instead of tracing horizontal or vertical rows.
        const left = Math.random() * maxLeft;
        const top = Math.random() * maxTop;
        warning.style.transition = initial ? "none" : "left 12s ease-in-out, top 12s ease-in-out";
        warning.style.left = `${left}px`;
        warning.style.top = `${top}px`;
    }

    moveToRandomPosition(true);
    requestAnimationFrame(() => moveToRandomPosition());
    window.setInterval(() => moveToRandomPosition(), 12500);
    window.addEventListener("resize", () => moveToRandomPosition(true));
})();
