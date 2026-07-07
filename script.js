document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // Theme Switcher (Dark / Light Mode)
    // ==========================================================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Check saved theme or fallback to user preference
    const savedTheme = localStorage.getItem('portfolio-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
    } else {
        htmlElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('portfolio-theme', newTheme);
        
        // Dynamic feedback for cursor-glow color adjustments
        updateCursorGlowColor(newTheme);
    });
    // ==========================================================================
    // Cursor Follow Glow Effect (Desktop Only)
    // ==========================================================================
    const cursorGlow = document.getElementById('cursor-glow');
    
    const updateCursorGlowColor = (theme) => {
        if (!cursorGlow) return;
        if (theme === 'light') {
            cursorGlow.style.background = 'radial-gradient(circle, rgba(79, 70, 229, 0.06) 0%, rgba(0, 0, 0, 0) 70%)';
        } else {
            cursorGlow.style.background = 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(0, 0, 0, 0) 70%)';
        }
    };
    
    updateCursorGlowColor(htmlElement.getAttribute('data-theme'));
    
    document.addEventListener('mousemove', (e) => {
        if (cursorGlow) {
            cursorGlow.style.left = `${e.clientX}px`;
            cursorGlow.style.top = `${e.clientY}px`;
        }
    });
    // ==========================================================================
    // Mobile Drawer Navigation (Hamburger Menu)
    // ==========================================================================
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const toggleMenu = () => {
        hamburgerMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is active on mobile
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    };
    
    hamburgerMenu.addEventListener('click', toggleMenu);
    
    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    });
    
    // Close menu when clicking outside of nav menu
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            !hamburgerMenu.contains(e.target)) {
            toggleMenu();
        }
    });
    
    // Close menu on ESC keypress
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            toggleMenu();
        }
    });
    // ==========================================================================
    // Sticky Header Scroll State
    // ==========================================================================
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    // ==========================================================================
    // Typewriter Text Effect (Hero Section)
    // ==========================================================================
    const typewriterElement = document.getElementById('typewriter');
    const words = [
        "Aspiring Full-Stack Developer.",
        "Firebase Backend Developer.",
        "1st Year Intermediate Student.",
        "Creative Problem Solver."
    ];
    
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    const runTypewriter = () => {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50; // Deletion is faster
        } else {
            typewriterElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100; // Normal typing speed
        }
        
        // Finished typing the word
        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typingSpeed = 2000; // Pause at end of word
        } 
        // Finished deleting the word
        else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typingSpeed = 500; // Pause before starting next word
        }
        
        setTimeout(runTypewriter, typingSpeed);
    };
    
    if (typewriterElement) {
        setTimeout(runTypewriter, 1000);
    }
    // ==========================================================================
    // Active Navigation Highlighting on Scroll
    // ==========================================================================
    const sections = document.querySelectorAll('section');
    
    const activeNavOnScroll = () => {
        let scrollY = window.pageYOffset;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 150;
            const sectionId = current.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector(`.nav-menu a[href*=${sectionId}]`)?.classList.add('active');
            } else {
                document.querySelector(`.nav-menu a[href*=${sectionId}]`)?.classList.remove('active');
            }
        });
    };
    
    window.addEventListener('scroll', activeNavOnScroll);
    // ==========================================================================
    // Skills Progress Bar Animation on Scroll
    // ==========================================================================
    const skillsSection = document.getElementById('skills');
    const progressBars = document.querySelectorAll('.progress-bar');
    
    // Store original widths
    const progressWidths = Array.from(progressBars).map(bar => bar.style.width);
    
    // Initially reset width to 0% for animation start
    progressBars.forEach(bar => {
        bar.style.width = '0%';
    });
    
    const animateSkills = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                progressBars.forEach((bar, idx) => {
                    bar.style.width = progressWidths[idx];
                });
                // Once triggered, stop observing
                observer.unobserve(entry.target);
            }
        });
    };
    
    const skillsObserver = new IntersectionObserver(animateSkills, {
        threshold: 0.15
    });
    
    if (skillsSection) {
        skillsObserver.observe(skillsSection);
    }
    // ==========================================================================
    // Project Category Filtering
    // ==========================================================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active status from other buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filterValue === 'all') {
                    card.classList.remove('hide');
                } else if (category === filterValue) {
                    card.classList.remove('hide');
                } else {
                    card.classList.add('hide');
                }
            });
        });
    });
    // ==========================================================================
    // Contact Form Submission (Simulated with Spinners & Toasts)
    // ==========================================================================
    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // UI Loading State
        submitBtn.disabled = true;
        btnText.textContent = 'Sending...';
        btnSpinner.style.display = 'inline-block';
        formFeedback.className = 'form-feedback';
        formFeedback.style.display = 'none';
        
        // Simulate mail API delay
        setTimeout(() => {
            try {
                // Read input values (for validation logs/local demo checking)
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const message = document.getElementById('message').value.trim();
                
                if (!name || !email || !message) {
                    throw new Error("Please fill out all required fields.");
                }
                
                // Success Scenario
                formFeedback.textContent = `Thank you, ${name}! Your message has been sent successfully. I will get back to you soon.`;
                formFeedback.classList.add('success');
                contactForm.reset();
            } catch (err) {
                // Error Scenario
                formFeedback.textContent = err.message || "Failed to send message. Please try again later.";
                formFeedback.classList.add('error');
            } finally {
                // Reset submit button state
                submitBtn.disabled = false;
                btnText.textContent = 'Send Message';
                btnSpinner.style.display = 'none';
                formFeedback.style.display = 'block';
            }
        }, 1500);
    });
    // ==========================================================================
    // Download CV / Print Resume Action
    // ==========================================================================
    const downloadCvBtn = document.getElementById('download-cv');
    
    if (downloadCvBtn) {
        downloadCvBtn.addEventListener('click', () => {
            // Triggers native print command. CSS print rules will override the screen views
            // and isolate a clean, beautifully formatted single-page resume layout.
            window.print();
        });
    }
});