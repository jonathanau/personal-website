/* =========================================================================
   Portfolio Interactivity & Animations
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const icon = menuToggle.querySelector('i');

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
        if (mobileMenu.classList.contains('active')) {
            icon.classList.remove('ph-list');
            icon.classList.add('ph-x');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            icon.classList.remove('ph-x');
            icon.classList.add('ph-list');
            document.body.style.overflow = '';
        }
    }

    menuToggle.addEventListener('click', toggleMenu);

    // Close menu when clicking a link
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // 2. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');

    const revealConfig = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, revealConfig);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 4. Theme Switcher
    const themeSwitcherBtn = document.getElementById('theme-switcher');
    const themePopover = document.getElementById('theme-popover');
    const allThemeOptions = document.querySelectorAll('.theme-option');

    // Map theme names to their meta theme-color values
    const themeColors = {
        'cyber': '#0a0a0f',
        'sunset': '#0f0b07',
        'forest': '#060d0a',
        'dusk': '#0c0a12',
        'cyber-light': '#f0f4f8',
        'sunset-light': '#fdf6ee',
        'forest-light': '#f0f7f2',
        'dusk-light': '#f3f0f9'
    };

    // Initialize active state from localStorage
    const savedTheme = localStorage.getItem('theme') || 'cyber';
    allThemeOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === savedTheme);
    });

    // Toggle popover
    if (themeSwitcherBtn) {
        themeSwitcherBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themePopover.classList.toggle('active');
        });
    }

    // Close popover on outside click
    document.addEventListener('click', (e) => {
        if (themePopover && !themePopover.contains(e.target) && e.target !== themeSwitcherBtn) {
            themePopover.classList.remove('active');
        }
    });

    // Close popover on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && themePopover) {
            themePopover.classList.remove('active');
        }
    });

    // Handle theme selection (works for both desktop popover and mobile options)
    allThemeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;

            // Apply theme
            if (theme === 'cyber') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', theme);
            }

            // Persist
            localStorage.setItem('theme', theme);

            // Update meta theme-color
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', themeColors[theme] || '#0a0a0f');
            }

            // Sync active state across all theme option buttons (desktop + mobile)
            allThemeOptions.forEach(opt => {
                opt.classList.toggle('active', opt.dataset.theme === theme);
            });

            // Close popover after selection (desktop)
            if (themePopover) {
                themePopover.classList.remove('active');
            }
        });
    });

    // Keyboard navigation within popover
    if (themePopover) {
        const popoverButtons = themePopover.querySelectorAll('.theme-option');
        themePopover.addEventListener('keydown', (e) => {
            if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
            e.preventDefault();
            const current = Array.from(popoverButtons).indexOf(document.activeElement);
            // If no button is focused (e.g., popover container itself), start from first button
            const currentIndex = current === -1 ? 0 : current;
            let next;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                next = (currentIndex + 1) % popoverButtons.length;
            } else {
                next = (currentIndex - 1 + popoverButtons.length) % popoverButtons.length;
            }
            popoverButtons[next].focus();
        });
    }

    // 5. Initial Load Animation (Hero Section)
    setTimeout(() => {
        const heroReveals = document.querySelectorAll('.hero-content.reveal');
        heroReveals.forEach(el => el.classList.add('active'));
    }, 100);
});
