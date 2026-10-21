/* =========================================
   SIDE MENU
========================================= */

const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");
const homeButton = document.getElementById("homeButton");

function positionSideMenu() {
    if (!menuButton || !sideMenu || !menuOverlay) return;

    const buttonRect = menuButton.getBoundingClientRect();
    const top = Math.ceil(buttonRect.bottom + 6);
    const right = Math.max(8, Math.ceil(window.innerWidth - buttonRect.right));
    const width = Math.min(240, Math.max(0, window.innerWidth - 16));

    sideMenu.style.top = `${top}px`;
    sideMenu.style.right = `${right}px`;
    sideMenu.style.width = `${width}px`;
    sideMenu.style.height = "auto";
    sideMenu.style.maxHeight = `calc(100dvh - ${top + 12}px)`;
    menuOverlay.style.top = `${Math.ceil(buttonRect.bottom)}px`;
}


/* =========================================
   OPEN MENU
========================================= */

function openMenu() {

    // Anchor the compact menu below the game bar's menu button so it does not
    // cover the displayed balance.
    positionSideMenu();

    sideMenu.classList.add("active");
    menuOverlay.classList.add("active");
    window.addEventListener("scroll", positionSideMenu, true);
    window.addEventListener("resize", positionSideMenu);

}


/* =========================================
   CLOSE MENU
========================================= */

function closeMenu() {

    sideMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
    menuOverlay.style.top = "";
    window.removeEventListener("scroll", positionSideMenu, true);
    window.removeEventListener("resize", positionSideMenu);

}


/* =========================================
   ☰ MENU BUTTON
========================================= */

if (menuButton) {

    menuButton.addEventListener("click", function(event) {

        event.stopPropagation();

        if (sideMenu.classList.contains("active")) {

            closeMenu();

        } else {

            openMenu();

        }

    });

}


/* =========================================
   CLICK OUTSIDE MENU
========================================= */

if (menuOverlay) {

    menuOverlay.addEventListener("click", function() {

        closeMenu();

    });

}


/* =========================================
   HOME BUTTON
========================================= */

if (homeButton) {

    homeButton.addEventListener("click", function() {

        closeMenu();

    });

}


/* =========================================
   SETTINGS TOGGLES
========================================= */

const toggles = document.querySelectorAll(".toggle");

toggles.forEach(function(toggle) {

    toggle.addEventListener("click", function(event) {

        event.stopPropagation();

        // The audio controller owns the Music toggle's state so its visual
        // state stays in sync with whether the MP3 is actually playing.
        if (toggle.dataset.setting === "music" || toggle.dataset.setting === "animation") return;

        toggle.classList.toggle("active");

    });

});


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener("keydown", function(event) {

    if (event.key === "Escape") {

        closeMenu();

    }

});
