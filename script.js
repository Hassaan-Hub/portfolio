/* ==========================================================================
   Hassaan.dev — Portfolio JavaScript
   Plain vanilla JS, no libraries. Everything is grouped into small
   self-contained features so it's easy to read and edit.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // Shared config
    const CONTACT_EMAIL = 'hassaanali994@gmail.com';
    const THEME_KEY = 'portfolio-theme';

    // Honour the user's "reduce motion" OS setting
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // A single rAF-throttled scroll runner, shared by every scroll listener.
    // rAF guarantees we never do more than one update per painted frame.
    let scrollTicking = false;

    const onScroll = (callback) => {
        const handler = () => {
            if (scrollTicking) return;
            scrollTicking = true;
            window.requestAnimationFrame(() => {
                callback();
                scrollTicking = false;
            });
        };

        // { passive: true } tells the browser we never call preventDefault()
        window.addEventListener('scroll', handler, { passive: true });
        handler();
    };

    /* ======================================================================
       1. Scroll reveal (IntersectionObserver — no scroll maths)
       Declared early because the scroll handler below reuses flushReveals().
       ====================================================================== */
    const revealTargets = document.querySelectorAll('.reveal, .reveal-stagger');

    // Elements still waiting to be revealed. Once empty the scroll handler
    // does nothing extra, so this costs nothing for the rest of the session.
    let pendingReveals = [];

    const flushReveals = () => {
        if (!pendingReveals.length) return;

        for (let i = pendingReveals.length - 1; i >= 0; i -= 1) {
            if (pendingReveals[i].getBoundingClientRect().top < 0) {
                pendingReveals[i].classList.add('is-visible');
                pendingReveals.splice(i, 1);
            }
        }
    };

    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
        // No motion requested (or no support): show everything immediately
        revealTargets.forEach((el) => el.classList.add('is-visible'));
    } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // one-shot, then stop watching
                    pendingReveals = pendingReveals.filter((el) => el !== entry.target);
                }
            });
        }, { rootMargin: '0px 0px -80px 0px', threshold: 0 });

        pendingReveals = Array.from(revealTargets);
        revealTargets.forEach((el) => revealObserver.observe(el));
    }

    /* ======================================================================
       2. Theme toggle (dark / light)
       ====================================================================== */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const htmlElement = document.documentElement;

    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);

        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', theme === 'dark' ? '#080c14' : '#f6f8fc');
        }

        if (themeToggleBtn) {
            const nextThemeLabel = theme === 'dark' ? 'light' : 'dark';
            themeToggleBtn.setAttribute('aria-label', `Switch to ${nextThemeLabel} theme`);
            themeToggleBtn.setAttribute('aria-pressed', String(theme === 'light'));
        }
    };

    // Restore a saved choice, otherwise use the operating system preference
    const savedTheme = localStorage.getItem(THEME_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const nextTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);

            try {
                localStorage.setItem(THEME_KEY, nextTheme);
            } catch (error) {
                /* Private browsing — the theme still applies for this visit. */
            }
        });
    }

    /* ======================================================================
       3. Cursor follow glow (fine pointers only, rAF throttled)
       ====================================================================== */
    const cursorGlow = document.getElementById('cursor-glow');
    const hasFinePointer = window.matchMedia('(pointer: fine)');

    if (cursorGlow && hasFinePointer.matches) {
        let glowX = 0;
        let glowY = 0;
        let glowTicking = false;

        const moveGlow = () => {
            cursorGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
            glowTicking = false;
        };

        // Only track the pointer while it is actually over the page
        document.addEventListener('pointermove', (event) => {
            if (event.pointerType !== 'mouse' || glowTicking) return;
            glowX = event.clientX;
            glowY = event.clientY;
            glowTicking = true;
            // Show on the first real move — a pointer that is already inside the
            // window on load never fires pointerenter on the document
            cursorGlow.style.opacity = '1';
            window.requestAnimationFrame(moveGlow);
        }, { passive: true });

        // Ease the glow out when the pointer leaves the page
        cursorGlow.style.opacity = '0';
        document.addEventListener('pointerleave', () => { cursorGlow.style.opacity = '0'; });
    }

    /* ======================================================================
       4. Mobile drawer navigation
       ====================================================================== */
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navMenu = document.getElementById('nav-menu');
    const navOverlay = document.getElementById('nav-overlay');
    const navLinks = Array.from(document.querySelectorAll('.nav-menu .nav-link'));

    const setMenu = (isOpen) => {
        if (!hamburgerMenu || !navMenu) return;

        navMenu.classList.toggle('active', isOpen);
        hamburgerMenu.classList.toggle('active', isOpen);
        hamburgerMenu.setAttribute('aria-expanded', String(isOpen));
        hamburgerMenu.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        document.body.classList.toggle('menu-open', isOpen);

        if (navOverlay) {
            if (isOpen) {
                navOverlay.hidden = false;
                // Next frame, so the opacity transition actually runs
                window.requestAnimationFrame(() => navOverlay.classList.add('active'));
            } else {
                navOverlay.classList.remove('active');
                window.setTimeout(() => { navOverlay.hidden = true; }, 280);
            }
        }

        if (isOpen) {
            navLinks[0]?.focus();
        }
    };

    const isMenuOpen = () => navMenu?.classList.contains('active');

    const closeMenu = (returnFocus = false) => {
        if (!isMenuOpen()) return;
        setMenu(false);
        if (returnFocus) hamburgerMenu?.focus();
    };

    if (hamburgerMenu && navMenu) {
        hamburgerMenu.addEventListener('click', () => setMenu(!isMenuOpen()));

        // Close as soon as a link is chosen
        navLinks.forEach((link) => link.addEventListener('click', () => closeMenu()));

        // Close when tapping the dimmed area behind the drawer
        navOverlay?.addEventListener('click', () => closeMenu(true));

        document.addEventListener('keydown', (event) => {
            if (!isMenuOpen()) return;

            if (event.key === 'Escape') {
                closeMenu(true);
                return;
            }

            // Basic focus trap so Tab never escapes an open drawer
            if (event.key === 'Tab') {
                const focusable = navMenu.querySelectorAll('a[href], button:not([disabled])');
                if (!focusable.length) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });

        // Returning to desktop width should always leave the menu closed
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) closeMenu();
        }, { passive: true });
    }

    /* ======================================================================
       5. Sticky navbar + active section indicator
       One listener, one rAF pass over a handful of sections.
       ====================================================================== */
    const navbar = document.getElementById('navbar');
    const navSections = navLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    // Reading progress + back-to-top share this single scroll pass
    const progressBar = document.getElementById('scroll-progress');
    const toTopButton = document.getElementById('to-top');
    const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    let sectionTops = [];

    const measureSections = () => {
        const offset = navbar ? navbar.offsetHeight + 24 : 96;
        sectionTops = navSections.map((section) => section.offsetTop - offset);
    };

    const setActiveNav = (id) => {
        navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    const updateOnScroll = () => {
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 24);
        }

        if (progressBar) {
            progressBar.style.transform = `scaleX(${Math.min(1, window.scrollY / maxScroll())})`;
        }

        if (toTopButton) {
            toTopButton.classList.toggle('visible', window.scrollY > 600);
        }

        // Reveal anything the observer skipped over (End key, anchor jumps)
        flushReveals();

        if (!sectionTops.length) return;

        // Last section whose top has passed the reading line wins
        let activeIndex = 0;
        for (let i = 0; i < sectionTops.length; i += 1) {
            if (window.scrollY >= sectionTops[i]) activeIndex = i;
        }

        // Pin the final link once the page is scrolled to the bottom
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
            activeIndex = navSections.length - 1;
        }

        setActiveNav(navSections[activeIndex].id);
    };

    measureSections();
    onScroll(updateOnScroll);
    window.addEventListener('resize', measureSections, { passive: true });
    window.addEventListener('load', () => {
        measureSections();
        updateOnScroll();
    });

    /* ======================================================================
       6. Hero typewriter (accurate roles, pauses when tab is hidden)
       ====================================================================== */
    const typewriterElement = document.getElementById('typewriter');
    const words = [
        'Frontend Developer',
        'React & Next.js Developer',
        'Firebase Web App Developer',
        'Learning Full-Stack Development',
        'Web App Developer'
    ];

    const startTypewriter = () => {
        if (!typewriterElement || prefersReducedMotion.matches) return;

        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let timerId = 0;

        const run = () => {
            const currentWord = words[wordIndex];
            let delay;

            if (isDeleting) {
                charIndex -= 1;
                typewriterElement.textContent = currentWord.substring(0, charIndex);
                delay = 35;

                if (charIndex === 0) {
                    isDeleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                    delay = 600;
                }
            } else {
                charIndex += 1;
                typewriterElement.textContent = currentWord.substring(0, charIndex);
                delay = 85;

                if (charIndex === currentWord.length) {
                    isDeleting = true;
                    delay = 1800;
                }
            }

            timerId = window.setTimeout(run, delay);
        };

        // Don't burn CPU typing into a hidden tab
        document.addEventListener('visibilitychange', () => {
            window.clearTimeout(timerId);
            if (!document.hidden) timerId = window.setTimeout(run, 400);
        });

        timerId = window.setTimeout(run, 900);
    };

    startTypewriter();

    /* ======================================================================
       7. Project filtering (fade out, then remove from layout)
       ====================================================================== */
    const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
    const projectCards = Array.from(document.querySelectorAll('.project-card'));
    const filterStatus = document.getElementById('filter-status');
    const FADE_MS = prefersReducedMotion.matches ? 0 : 220;

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const filterValue = button.dataset.filter;
            const isReducedMotion = prefersReducedMotion.matches;

            filterButtons.forEach((btn) => {
                const isActive = btn === button;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });

            let visibleCount = 0;

            projectCards.forEach((card) => {
                const categories = (card.dataset.category || '').split(/\s+/);
                const shouldShow = filterValue === 'all' || categories.includes(filterValue);

                if (shouldShow) {
                    visibleCount += 1;

                    // Reveal: un-hide first, then fade back in
                    if (card.classList.contains('hide')) {
                        card.classList.remove('hide');
                        if (isReducedMotion) {
                            card.classList.remove('is-hiding');
                        } else {
                            window.requestAnimationFrame(() => {
                                card.classList.remove('is-hiding');
                            });
                        }
                    } else {
                        card.classList.remove('is-hiding');
                    }
                } else if (!card.classList.contains('hide')) {
                    // Hide: fade out first so the change feels smooth
                    if (isReducedMotion) {
                        card.classList.add('hide');
                    } else {
                        card.classList.add('is-hiding');
                        window.setTimeout(() => card.classList.add('hide'), FADE_MS);
                    }
                }
            });

            if (filterStatus) {
                const label = button.textContent.trim();

                if (!visibleCount) {
                    filterStatus.textContent = `No projects found in "${label}".`;
                } else if (filterValue === 'all') {
                    filterStatus.textContent = `Showing all ${visibleCount} projects.`;
                } else {
                    filterStatus.textContent = `Showing ${visibleCount} project${visibleCount === 1 ? '' : 's'} in "${label}".`;
                }
            }
        });
    });

    /* ======================================================================
       7b. Back to top
       ====================================================================== */
    if (toTopButton) {
        toTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
            });
        });
    }

    /* ======================================================================
       7c. Project screenshot lightbox
       ====================================================================== */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxCount = document.getElementById('lightbox-count');
    const lightboxThumbs = document.getElementById('lightbox-thumbs');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxClose = lightbox?.querySelector('.lightbox-close');

    if (lightbox && lightboxImg) {
        let gallery = [];
        let galleryIndex = 0;
        let lastFocused = null;

        const renderFrame = () => {
            const frame = gallery[galleryIndex];
            lightboxImg.src = frame.src;
            lightboxImg.alt = frame.alt;
            lightboxCount.textContent = `${galleryIndex + 1} / ${gallery.length}`;
            lightboxPrev.disabled = galleryIndex === 0;
            lightboxNext.disabled = galleryIndex === gallery.length - 1;

            Array.from(lightboxThumbs.children).forEach((thumb, index) => {
                thumb.classList.toggle('active', index === galleryIndex);
                thumb.setAttribute('aria-current', String(index === galleryIndex));
            });
        };

        const step = (delta) => {
            const next = galleryIndex + delta;
            if (next < 0 || next >= gallery.length) return;
            galleryIndex = next;
            renderFrame();
        };

        const openLightbox = (trigger) => {
            const frames = Array.from(trigger.querySelectorAll('img'));
            if (!frames.length) return;

            gallery = frames.map((img) => ({ src: img.getAttribute('src'), alt: img.alt }));
            galleryIndex = 0;
            lastFocused = trigger;

            lightboxTitle.textContent = trigger.dataset.project || 'Project screenshots';

            // Rebuild the thumbnail strip for this project
            lightboxThumbs.replaceChildren();
            gallery.forEach((frame, index) => {
                const thumb = document.createElement('button');
                thumb.type = 'button';
                thumb.className = 'lightbox-thumb';
                thumb.setAttribute('aria-label', `Show screenshot ${index + 1}`);

                const thumbImg = document.createElement('img');
                thumbImg.src = frame.src;
                thumbImg.alt = '';
                thumb.appendChild(thumbImg);

                thumb.addEventListener('click', () => {
                    galleryIndex = index;
                    renderFrame();
                });

                lightboxThumbs.appendChild(thumb);
            });

            // A single screenshot needs no arrows or thumbnails
            const multiple = gallery.length > 1;
            lightboxPrev.hidden = !multiple;
            lightboxNext.hidden = !multiple;
            lightboxThumbs.hidden = !multiple;

            renderFrame();
            lightbox.hidden = false;
            document.body.classList.add('lightbox-open');
            lightboxClose?.focus();
        };

        const closeLightbox = () => {
            if (lightbox.hidden) return;
            lightbox.hidden = true;
            document.body.classList.remove('lightbox-open');
            lastFocused?.focus();
        };

        document.querySelectorAll('.shot').forEach((trigger) => {
            trigger.addEventListener('click', () => openLightbox(trigger));
        });

        lightbox.querySelectorAll('[data-lightbox-close]').forEach((el) => {
            el.addEventListener('click', closeLightbox);
        });

        lightboxPrev?.addEventListener('click', () => step(-1));
        lightboxNext?.addEventListener('click', () => step(1));

        document.addEventListener('keydown', (event) => {
            if (lightbox.hidden) return;

            if (event.key === 'Escape') {
                closeLightbox();
            } else if (event.key === 'ArrowLeft') {
                step(-1);
            } else if (event.key === 'ArrowRight') {
                step(1);
            } else if (event.key === 'Tab') {
                // Keep focus inside the dialog while it is open
                const focusable = lightbox.querySelectorAll('button:not([disabled]):not([hidden])');
                if (!focusable.length) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    }

    /* ======================================================================
       7d. Pointer spotlight on cards (fine pointers only)
       ====================================================================== */
    if (hasFinePointer.matches) {
        document.querySelectorAll('.glass-card:not(.project-card)').forEach((card) => {
            card.addEventListener('pointermove', (event) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
                card.style.setProperty('--my', `${event.clientY - rect.top}px`);
            });
        });
    }

    /* ======================================================================
       8. Contact form — opens the visitor's own email app (no backend)
       ====================================================================== */
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const feedback = document.getElementById('form-feedback');
        const submitBtn = document.getElementById('contact-submit');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnSpinner = submitBtn.querySelector('.btn-spinner');
        const btnIcon = submitBtn.querySelector('.btn-icon:not(.btn-spinner)');

        const showFeedback = (message, state) => {
            feedback.hidden = false;
            feedback.className = `form-feedback ${state}`;
            feedback.innerHTML = message;
        };

        const setLoading = (isLoading) => {
            submitBtn.disabled = isLoading;
            btnText.textContent = isLoading ? 'Opening email app…' : 'Open in Email App';
            btnSpinner.hidden = !isLoading;
            if (btnIcon) btnIcon.hidden = isLoading;
        };

        // Clear the error state as soon as the visitor starts fixing it
        [nameInput, emailInput, messageInput].forEach((field) => {
            field.addEventListener('input', () => {
                field.removeAttribute('aria-invalid');
                if (feedback.classList.contains('error')) feedback.hidden = true;
            });
        });

        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const message = messageInput.value.trim();

            // Mark every empty field, then let the browser show the first problem
            [nameInput, emailInput, messageInput].forEach((field) => {
                if (!field.value.trim()) {
                    field.setAttribute('aria-invalid', 'true');
                }
            });

            if (!contactForm.checkValidity()) {
                showFeedback('Please fill in your name, a valid email address and a message.', 'error');
                contactForm.reportValidity();
                return;
            }

            setLoading(true);

            const subject = `Portfolio enquiry from ${name}`;
            const body = [
                message,
                '',
                '---',
                `Name: ${name}`,
                `Email: ${email}`,
                'Sent from: https://hassaan-tau.vercel.app/'
            ].join('\n');

            // Hand the message to the device's default mail client
            window.location.href =
                `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            // Be honest about what actually happened — nothing is sent by a server
            window.setTimeout(() => {
                setLoading(false);
                showFeedback(
                    `Your email app should be opening now with the message ready to send. ` +
                    `If nothing happened, email me directly at ` +
                    `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`,
                    'info'
                );
                contactForm.reset();
            }, 700);
        });
    }
});
