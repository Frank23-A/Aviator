document.querySelectorAll('.signout-link').forEach(link => {
    link.addEventListener('click', async event => {
        event.preventDefault();

        const headers = {'Content-Type': 'application/json'};
        let tabToken = null;
        try {
            tabToken = window.sessionStorage.getItem('aviatorTabToken');
        } catch (error) {
            // Fall back to the authenticated URL token below.
        }
        tabToken ||= new URLSearchParams(window.location.search).get('tab_token');
        if (tabToken) {
            headers['X-Tab-Token'] = tabToken;
        }

        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers,
                cache: 'no-store',
            });
            if (!response.ok) {
                throw new Error('Logout failed. Please try again.');
            }

            try {
                window.sessionStorage.removeItem('aviatorTabToken');
            } catch (error) {
                // The server has already invalidated this tab's login token.
            }
            window.location.assign('/login');
        } catch (error) {
            window.alert(error.message || 'Unable to log out. Check your connection and try again.');
        }
    });
});
