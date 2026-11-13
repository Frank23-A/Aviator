(function () {
    let redirecting = false;
    const tokenKey = "aviatorTabToken";
    const queryToken = new URLSearchParams(window.location.search).get("tab_token");
    let tabToken = queryToken;
    try {
        if (queryToken) {
            window.sessionStorage.setItem(tokenKey, queryToken);
        } else {
            tabToken = window.sessionStorage.getItem(tokenKey);
        }
    } catch (error) {
        // The token remains available from the URL for this page if storage is disabled.
    }

    function getTabToken() {
        return tabToken;
    }

    window.tabAuthenticatedUrl = function (path) {
        const url = new URL(path, window.location.href);
        const token = getTabToken();
        if (url.origin === window.location.origin && token) {
            url.searchParams.set("tab_token", token);
        }
        if (url.origin !== window.location.origin) {
            return url.href;
        }
        return url.pathname + url.search + url.hash;
    };

    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init = {}) {
        const requestUrl = input instanceof Request ? input.url : input;
        const url = new URL(requestUrl, window.location.href);
        const options = { ...init };

        if (url.origin === window.location.origin) {
            const token = getTabToken();
            if (token) {
                const headers = new Headers(input instanceof Request ? input.headers : undefined);
                new Headers(init.headers).forEach((value, key) => headers.set(key, value));
                headers.set("X-Tab-Token", token);
                options.headers = headers;
            }
        }

        return nativeFetch(input, options);
    };

    function decorateLinks(root) {
        const token = getTabToken();
        if (!token || !root.querySelectorAll) return;

        const anchors = [...(root.matches?.("a[href]") ? [root] : []), ...root.querySelectorAll("a[href]")];
        anchors.forEach(anchor => {
            const url = new URL(anchor.href, window.location.href);
            if (url.origin !== window.location.origin) return;
            url.searchParams.set("tab_token", token);
            anchor.href = url.href;
        });
    }

    decorateLinks(document);
    new MutationObserver(records => {
        records.forEach(record => {
            record.addedNodes.forEach(node => {
                if (node instanceof Element) decorateLinks(node);
            });
        });
    }).observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener("click", event => {
        const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!anchor) return;

        const token = getTabToken();
        if (!token) return;

        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        url.searchParams.set("tab_token", token);
        anchor.href = url.href;
    }, true);

    document.addEventListener("submit", event => {
        const form = event.target;
        const token = getTabToken();
        if (!(form instanceof HTMLFormElement) || !token) return;

        const action = new URL(form.action, window.location.href);
        if (action.origin !== window.location.origin) return;
        action.searchParams.set("tab_token", token);
        form.action = action.href;
    }, true);

    async function checkSession() {
        if (redirecting || document.hidden) return;
        try {
            const response = await fetch("/api/session-status", { cache: "no-store" });
            if (response.status !== 401) return;
            const data = await response.json();
            if (!data.session_ended) return;

            redirecting = true;
            tabToken = null;
            try {
                window.sessionStorage.removeItem(tokenKey);
            } catch (error) {
                // Continue to sign-in even if browser storage is unavailable.
            }
            window.location.replace("/login?session_ended=1");
        } catch (error) {
            // Leave the active page alone during a temporary network outage.
        }
    }

    window.setInterval(checkSession, 2000);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) checkSession();
    });
})();
