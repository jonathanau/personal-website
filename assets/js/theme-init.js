/* =========================================================================
   Theme Initialization (FOWT Prevention)
   Loaded synchronously in <head> before CSS renders.
   Reads the saved theme from localStorage and applies it immediately
   to prevent a flash of the default (Cyber Light) theme.
   Also sets meta theme-color to avoid flash in mobile browser UI.
   ========================================================================= */
(function () {
     var saved = localStorage.getItem('theme') || 'cyber-light';
     window.themeColors = {
         'cyber': '#0a0a0f',
         'sunset': '#0f0b07',
         'forest': '#060d0a',
         'dusk': '#0c0a12',
         'cyber-light': '#f0f4f8',
         'sunset-light': '#fdf6ee',
         'forest-light': '#f0f7f2',
         'dusk-light': '#f3f0f9'
     };
     if (saved && saved !== 'cyber-light') {
         document.documentElement.setAttribute('data-theme', saved);
     } else {
         document.documentElement.removeAttribute('data-theme');
     }
     var meta = document.querySelector('meta[name="theme-color"]');
     if (meta) {
         meta.setAttribute('content', window.themeColors[saved] || '#f0f4f8');
     }
 })();
