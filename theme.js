// Synchronously apply theme before body renders to avoid FOUC
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}
