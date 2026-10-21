/* Side-menu Animation switch for the Aviator plane and flight trail. */
(() => {
    "use strict";

    const selector = '.toggle[data-setting="animation"]';
    const screen = document.getElementById("game");
    let enabled = true;

    function sync() {
        document.querySelectorAll(selector).forEach(toggle => {
            toggle.classList.toggle("active", enabled);
            toggle.setAttribute("role", "switch");
            toggle.setAttribute("aria-checked", String(enabled));
            toggle.setAttribute("tabindex", "0");
            toggle.setAttribute("aria-label", enabled ? "Animation On" : "Animation Off");
        });
        if (screen) screen.classList.toggle("animation-disabled", !enabled);
    }

    function toggle() {
        enabled = !enabled;
        sync();
    }

    // Capture the action before the generic settings handler so this switch
    // has one owner and does not toggle twice.
    document.addEventListener("click", event => {
        const control = event.target.closest(selector);
        if (!control) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        toggle();
    }, true);

    document.addEventListener("keydown", event => {
        const control = event.target.closest(selector);
        if (!control || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        toggle();
    }, true);

    window.AviatorAnimation = {
        toggle,
        setEnabled(value) {
            enabled = Boolean(value);
            sync();
        },
        get enabled() {
            return enabled;
        }
    };

    sync();
})();
