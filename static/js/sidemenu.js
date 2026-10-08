/* =========================================
   SIDE MENU
========================================= */

const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");
const homeButton = document.getElementById("homeButton");


/* =========================================
   OPEN MENU
========================================= */

function openMenu() {

    sideMenu.classList.add("active");
    menuOverlay.classList.add("active");

}


/* =========================================
   CLOSE MENU
========================================= */

function closeMenu() {

    sideMenu.classList.remove("active");
    menuOverlay.classList.remove("active");

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
