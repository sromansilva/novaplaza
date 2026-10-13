// Runs before paint; the experience also works without third-party resources.
try {
  const saved = localStorage.getItem('nova-theme');
  document.documentElement.dataset.theme = saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
} catch { document.documentElement.dataset.theme = 'light'; }
