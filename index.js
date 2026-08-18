
    // ==================================================
    // THEME TOGGLE
    // ==================================================
    (function() {
      const themeToggle = document.getElementById('themeToggle');
      const themeIcon = document.getElementById('themeIcon');
      const html = document.documentElement;
      
      // Check system preference and localStorage
      const getPreferredTheme = () => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      };
      
      const setTheme = (theme) => {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      };
      
      // Initial theme
      setTheme(getPreferredTheme());
      
      themeToggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      });
    })();

    // ==================================================
    // MOUSE GLOW
    // ==================================================
    (function() {
      const glow = document.getElementById('mouseGlow');
      let mouseX = 0, mouseY = 0;
      let currentX = 0, currentY = 0;
      
      document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });
      
      function animateGlow() {
        currentX += (mouseX - currentX) * 0.05;
        currentY += (mouseY - currentY) * 0.05;
        glow.style.left = currentX + 'px';
        glow.style.top = currentY + 'px';
        requestAnimationFrame(animateGlow);
      }
      
      animateGlow();
    })();

    // ==================================================
    // LOADER
    // ==================================================
    window.addEventListener('load', () => {
      document.getElementById('loader').classList.add('hidden');
    });

    // ==================================================
    // PROGRESS BAR
    // ==================================================
    const progress = document.getElementById('progress-bar');
    window.addEventListener('scroll', () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      progress.style.width = (y / h) * 100 + '%';
    });

    // ==================================================
    // BACK TO TOP
    // ==================================================
    const backTop = document.getElementById('back-top');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) backTop.classList.add('visible');
      else backTop.classList.remove('visible');
    });
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ==================================================
    // NAVBAR SCROLL
    // ==================================================
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    });

    // ==================================================
    // HAMBURGER MENU
    // ==================================================
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const navOverlay = document.getElementById('navOverlay');
    const body = document.body;

    function openMenu() {
      mobileMenu.classList.add('open');
      navOverlay.classList.add('active');
      navToggle.classList.add('active');
      body.classList.add('menu-open');
    }

    function closeMenu() {
      mobileMenu.classList.remove('open');
      navOverlay.classList.remove('active');
      navToggle.classList.remove('active');
      body.classList.remove('menu-open');
    }

    navToggle.addEventListener('click', () => {
      if (mobileMenu.classList.contains('open')) closeMenu();
      else openMenu();
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
        const target = link.getAttribute('href');
        if (target && target.startsWith('#')) {
          const el = document.querySelector(target);
          if (el) {
            setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300);
          }
        }
      });
    });

    navOverlay.addEventListener('click', closeMenu);

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && mobileMenu.classList.contains('open')) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
    });

    // ==================================================
    // ACTIVE NAV
    // ==================================================
    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.nav-links a:not(.nav-connect)');
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(s => {
        const top = s.offsetTop - 150;
        if (window.scrollY >= top) current = s.getAttribute('id');
      });
      navAnchors.forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href') === '#' + current) a.classList.add('active');
      });
    });

    // ==================================================
    // SCROLL REVEAL
    // ==================================================
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => observer.observe(el));

    // ==================================================
    // CONTACT FORM
    // ==================================================
    const contactForm = document.getElementById('contactForm');
    const feedback = document.getElementById('formFeedback');
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('nameInput').value.trim();
      const email = document.getElementById('emailInput').value.trim();
      const msg = document.getElementById('msgInput').value.trim();
      if (!name || !email || !msg) {
        feedback.style.color = '#dc2626';
        feedback.innerHTML = '<i class="fas fa-exclamation-circle"></i> All fields are required.';
        setTimeout(() => feedback.innerHTML = '', 2800);
        return;
      }
      if (!email.includes('@') || !email.includes('.')) {
        feedback.style.color = '#dc2626';
        feedback.innerHTML = '<i class="fas fa-envelope"></i> Please enter a valid email.';
        setTimeout(() => feedback.innerHTML = '', 2800);
        return;
      }
      feedback.style.color = '#16a34a';
      feedback.innerHTML = '<i class="fas fa-check-circle"></i> Thanks ' + name + '! I\'ll get back to you soon.';
      contactForm.reset();
      setTimeout(() => feedback.innerHTML = '', 3500);
    });

    // ==================================================
    // TYPING EFFECT
    // ==================================================
    const words = [
      "Full Stack Developer",
      "MCA Student",
      "Frontend Developer",
      "Backend Developer",
      "JavaScript Developer",
      "Node.js Developer",
      "Open to Internship"
    ];
    const typedText = document.getElementById("typed-text");
    let wordIndex = 0, charIndex = 0, deleting = false;

    function typeEffect() {
      const currentWord = words[wordIndex];
      if (!deleting) {
        typedText.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === currentWord.length) {
          deleting = true;
          setTimeout(typeEffect, 1800);
          return;
        }
      } else {
        typedText.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
        }
      }
      setTimeout(typeEffect, deleting ? 50 : 100);
    }
    typeEffect();
