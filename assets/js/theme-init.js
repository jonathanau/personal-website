/* =========================================================================
   Theme Initialization (FOWT Prevention)
   Loaded synchronously in <head> before CSS renders.
   Reads the saved theme from localStorage and applies it immediately
   to prevent a flash of the default (Cyber) theme.
   Also sets meta theme-color to avoid flash in mobile browser UI.
   ========================================================================= */
(function () {
     var saved = localStorage.getItem('theme');
     var themeColors = {
         'cyber': '#0a0a0f',
         'sunset': '#0f0b07',
         'forest': '#060d0a',
         'dusk': '#0c0a12',
         'cyber-light': '#f0f4f8',
         'sunset-light': '#fdf6ee',
         'forest-light': '#f0f7f2',
         'dusk-light': '#f3f0f9'
     };
     if (saved && saved !== 'cyber') {
         document.documentElement.setAttribute('data-theme', saved);
         var oldMeta = document.querySelector('meta[name="theme-color"]');
         if (oldMeta) {
             oldMeta.parentNode.removeChild(oldMeta);
         }
         var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
         if (!isIOS) {
             var newMeta = document.createElement('meta');
             newMeta.name = 'theme-color';
             newMeta.content = themeColors[saved] || '#0a0a0f';
             document.getElementsByTagName('head')[0].appendChild(newMeta);
         }
     }
 })();
