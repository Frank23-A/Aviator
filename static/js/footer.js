
/*=========================================
     FOOTER CONTAINER
=========================================*/
document.addEventListener("DOMContentLoaded", function () {

    const footerContainer =
        document.getElementById("footerContainer");

    if (!footerContainer) {
        return;
    }

    fetch("/footer")
        .then(function (response) {

            if (!response.ok) {
                throw new Error("Failed to load footer");
            }

            return response.text();
        })
        .then(function (html) {

            /*
             * footer.html is a complete HTML document.
             * Extract only its body content so that we don't
             * create a second <html>, <head> or <body>.
             */
            const parser = new DOMParser();

            const footerDocument =
                parser.parseFromString(html, "text/html");

            footerContainer.innerHTML =
                footerDocument.body.innerHTML;


            /*
             * Copy footer styles from footer.html
             * into the current page.
             */
            footerDocument.querySelectorAll("style").forEach(
                function (style) {

                    const newStyle =
                        document.createElement("style");

                    newStyle.textContent =
                        style.textContent;

                    document.head.appendChild(newStyle);

                }
            );


            /*
             * Run the Back To Top functionality.
             */
            const footerBackTop =
                document.getElementById("footerBackTop");

            if (footerBackTop) {

                footerBackTop.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        });

                    }
                );

            }

        })
        .catch(function (error) {

            console.error(
                "Footer loading error:",
                error
            );

        });

});
