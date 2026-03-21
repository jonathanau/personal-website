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

    // 4. Initial Load Animation (Hero Section)
    setTimeout(() => {
        const heroReveals = document.querySelectorAll('.hero-content.reveal');
        heroReveals.forEach(el => el.classList.add('active'));
    }, 100);
});
