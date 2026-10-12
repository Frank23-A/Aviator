/* log out js*/

document.getElementById('logoutButton').addEventListener('click', function () {
    fetch('/logout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(() => {
        window.location.href = '/login';
    })
    .catch(() => {
        window.location.href = '/login';
    });
});
