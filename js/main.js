/**
 * ==========================================================================
 * Main Application Logic & Home Page Controller
 * Portfolio Website - Module 1: Project Foundation + Complete Public Home Page
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", function() {
  console.log(
    "%c Portfolio Website %c Module 1: Public Home Page Active %c",
    "background:#06b6d4; color:#fff; font-weight:bold; padding:4px 8px; border-radius:3px 0 0 3px;",
    "background:#8b5cf6; color:#fff; font-weight:bold; padding:4px 8px; border-radius:0 3px 3px 0;",
    "background:transparent;"
  );

  /* --------------------------------------------------------------------------
     1. Theme Initialization & Switching
     -------------------------------------------------------------------------- */
  if (window.PortfolioStorage) {
    const currentTheme = window.PortfolioStorage.getTheme();
    window.PortfolioStorage.setTheme(currentTheme);

    const toggleButtons = document.querySelectorAll(".theme-toggle");
    toggleButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        window.PortfolioStorage.toggleTheme();
      });
    });
  }

  /* --------------------------------------------------------------------------
     2. Sticky Header & Navigation
     -------------------------------------------------------------------------- */
  const header = document.querySelector(".site-header");
  const mobileToggle = document.querySelector(".mobile-toggle");
  const mobileDrawer = document.querySelector(".mobile-drawer");
  const navLinks = document.querySelectorAll(".nav-link");

  function handleScroll() {
    if (!header) return;
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // Mobile Drawer Toggle (Section 15: Mobile Navigation & Section 17: Accessibility)
  if (mobileToggle && mobileDrawer) {
    const focusableSelectors = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function openDrawer() {
      mobileToggle.classList.add("active");
      mobileToggle.setAttribute("aria-expanded", "true");
      mobileDrawer.classList.add("active");
      mobileDrawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      // Transfer focus to the first navigable link inside drawer
      const focusableEls = mobileDrawer.querySelectorAll(focusableSelectors);
      if (focusableEls.length) {
        setTimeout(() => focusableEls[0].focus(), 50);
      }
    }

    function closeDrawer() {
      mobileToggle.classList.remove("active");
      mobileToggle.setAttribute("aria-expanded", "false");
      mobileDrawer.classList.remove("active");
      mobileDrawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";

      // Return focus to the toggle button so keyboard user is not disoriented
      mobileToggle.focus();
    }

    mobileToggle.addEventListener("click", () => {
      const isOpen = mobileDrawer.classList.contains("active");
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    // Close the navigation menu when any navigation item is selected
    const allDrawerLinks = mobileDrawer.querySelectorAll("a");
    allDrawerLinks.forEach(link => {
      link.addEventListener("click", () => {
        closeDrawer();
      });
    });

    // Circular keyboard Tab trapping inside mobile navigation drawer
    mobileDrawer.addEventListener("keydown", e => {
      if (e.key !== "Tab") return;

      const focusableEls = Array.from(mobileDrawer.querySelectorAll(focusableSelectors));
      if (!focusableEls.length) return;

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && mobileDrawer.classList.contains("active")) {
        closeDrawer();
      }
    });
  }

  // Smooth Scrolling for Internal Section Links (Section 15: Smooth Scrolling)
  const internalLinks = document.querySelectorAll('a[href^="#"], a[href^="index.html#"], .nav-link');
  internalLinks.forEach(link => {
    link.addEventListener("click", function(e) {
      const href = this.getAttribute("href");
      if (!href) return;

      if (href === "index.html" || href === "#home" || href === "#top" || href === "") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const hashIndex = href.indexOf("#");
      if (hashIndex !== -1) {
        const targetId = href.substring(hashIndex + 1);
        const targetElem = document.getElementById(targetId);
        if (targetElem) {
          e.preventDefault();
          const navOffset = header ? header.offsetHeight : 72;
          const targetPos = targetElem.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({ top: targetPos, behavior: "smooth" });

          // Update URL hash smoothly without jump
          if (history.pushState) {
            history.pushState(null, null, `#${targetId}`);
          }
        }
      }
    });
  });

  // Active Navigation Highlighting (Section 15: Active Navigation)
  const sections = document.querySelectorAll("section[id]");
  const allNavLinks = document.querySelectorAll(".nav-link");

  function setActiveNavLink(id) {
    allNavLinks.forEach(link => {
      const href = link.getAttribute("href");
      if (href === `#${id}` || (id === "home" && (href === "index.html" || href === "#home"))) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      } else if (href && (href.startsWith("#") || href === "index.html")) {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    });
  }

  if (sections.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            setActiveNavLink(id);
          }
        });
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );
    sections.forEach(s => navObserver.observe(s));
  }

  // Active navigation fallback for reaching the bottom of the page
  window.addEventListener("scroll", () => {
    const isAtBottom = (window.innerHeight + window.pageYOffset) >= (document.documentElement.scrollHeight - 60);
    if (isAtBottom && document.getElementById("contact")) {
      setActiveNavLink("contact");
    }
  }, { passive: true });

  /* --------------------------------------------------------------------------
     3. Dynamic Hero Typewriter Effect
     -------------------------------------------------------------------------- */
  const textElement = document.querySelector(".hero-typing-text");
  if (textElement) {
    const roles = [
      "Full-Stack Developer",
      "Software Engineer",
      "Frontend Architect",
      "Systems Thinker",
      "Problem Solver"
    ];

    let roleIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    function typeLoop() {
      const current = roles[roleIdx];

      if (isDeleting) {
        textElement.textContent = current.substring(0, charIdx - 1);
        charIdx--;
      } else {
        textElement.textContent = current.substring(0, charIdx + 1);
        charIdx++;
      }

      let speed = isDeleting ? 45 : 90;

      if (!isDeleting && charIdx === current.length) {
        speed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
        speed = 400;
      }

      setTimeout(typeLoop, speed);
    }

    typeLoop();
  }

  /* --------------------------------------------------------------------------
     4. Animated Numerical Counters
     -------------------------------------------------------------------------- */
  const counters = document.querySelectorAll(".stat-number[data-target]");
  if (counters.length) {
    function animateCounter(counter) {
      const target = parseInt(counter.getAttribute("data-target"), 10) || 0;
      const duration = 1500;
      const fps = 60;
      const totalFrames = Math.round(duration / (1000 / fps));
      let frame = 0;

      const timer = setInterval(() => {
        frame++;
        const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
        const currentCount = Math.round(target * progress);
        counter.textContent = currentCount;

        if (frame >= totalFrames) {
          counter.textContent = target;
          clearInterval(timer);
        }
      }, 1000 / fps);
    }

    if ("IntersectionObserver" in window) {
      const counterObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.25 }
      );
      counters.forEach(counter => counterObserver.observe(counter));
    } else {
      counters.forEach(counter => animateCounter(counter));
    }
  }

  /* --------------------------------------------------------------------------
     5. Developer Terminal Mockup Tabs
     -------------------------------------------------------------------------- */
  const tabs = document.querySelectorAll(".terminal-tab");
  const panels = document.querySelectorAll(".terminal-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", function() {
      const targetPanelId = this.getAttribute("data-tab");

      tabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach(p => p.classList.remove("active"));

      this.classList.add("active");
      this.setAttribute("aria-selected", "true");

      const activePanel = document.getElementById(targetPanelId);
      if (activePanel) {
        activePanel.classList.add("active");
      }
    });
  });

  /* --------------------------------------------------------------------------
     6. Skills Progress Bar Animation on Scroll
     -------------------------------------------------------------------------- */
  const skillBars = document.querySelectorAll(".skill-bar-fill[data-level]");
  if (skillBars.length && "IntersectionObserver" in window) {
    const skillsObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const bar = entry.target;
            const level = bar.getAttribute("data-level");
            bar.style.width = `${level}%`;
            skillsObserver.unobserve(bar);
          }
        });
      },
      { threshold: 0.25 }
    );
    skillBars.forEach(bar => skillsObserver.observe(bar));
  } else {
    skillBars.forEach(bar => {
      bar.style.width = `${bar.getAttribute("data-level")}%`;
    });
  }

  /* --------------------------------------------------------------------------
     7. Featured Projects Filter Tabs
     -------------------------------------------------------------------------- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card[data-category]");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      filterBtns.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      this.classList.add("active");
      this.setAttribute("aria-pressed", "true");

      const filterValue = this.getAttribute("data-filter");

      projectCards.forEach(card => {
        const cardCategory = card.getAttribute("data-category");
        if (filterValue === "all" || cardCategory === filterValue) {
          card.style.display = "flex";
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
          }, 50);
        } else {
          card.style.opacity = "0";
          card.style.transform = "translateY(12px)";
          setTimeout(() => {
            card.style.display = "none";
          }, 250);
        }
      });
    });
  });

  /* --------------------------------------------------------------------------
     8. Contact Form Client-Side Validation & Local Storage Simulation
     -------------------------------------------------------------------------- */
  const contactForm = document.getElementById("public-contact-form");
  const formStatus = document.getElementById("form-status-msg");

  if (contactForm && formStatus) {
    const nameInput = document.getElementById("contact-name");
    const emailInput = document.getElementById("contact-email");
    const subjectInput = document.getElementById("contact-subject");
    const messageInput = document.getElementById("contact-message");
    const formFields = [nameInput, emailInput, subjectInput, messageInput];

    // Live reset of field errors as user corrects them
    formFields.forEach(input => {
      if (input) {
        input.addEventListener("input", () => {
          if (input.classList.contains("is-invalid")) {
            input.classList.remove("is-invalid");
            input.setAttribute("aria-invalid", "false");
          }
        });
      }
    });

    function setFormError(input, message) {
      formStatus.className = "form-status error";
      formStatus.innerHTML = `<span aria-hidden="true" class="form-status-icon">⚠️</span><strong>Error:</strong> ${message}`;
      if (input) {
        input.classList.add("is-invalid");
        input.setAttribute("aria-invalid", "true");
        input.focus();
      }
    }

    contactForm.addEventListener("submit", function(e) {
      e.preventDefault();

      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const subject = subjectInput ? subjectInput.value.trim() : "";
      const message = messageInput ? messageInput.value.trim() : "";

      // Reset previous error states
      formFields.forEach(input => {
        if (input) {
          input.classList.remove("is-invalid");
          input.setAttribute("aria-invalid", "false");
        }
      });

      // 1. Validate: Name is required
      if (!name) {
        setFormError(nameInput, "Please enter your name.");
        return;
      }

      // 2. Validate: Email is required and must have a valid format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        setFormError(emailInput, "Please enter your email address.");
        return;
      }

      if (!emailRegex.test(email)) {
        setFormError(emailInput, "Please provide a valid email format (e.g. name@example.com).");
        return;
      }

      // 3. Validate: Subject is required
      if (!subject) {
        setFormError(subjectInput, "Please enter a subject.");
        return;
      }

      // 4. Validate: Message is required
      if (!message) {
        setFormError(messageInput, "Please enter your message.");
        return;
      }

      // ======================================================================
      // Architecture Hook (Section 19: Future Workflow Architecture)
      // Workflow: Contact -> Local Storage -> Admin -> Messages
      // ======================================================================
      const messagePayload = {
        id: "msg_" + Date.now(),
        name: name,
        email: email,
        subject: subject,
        message: message,
        createdAt: new Date().toISOString(),
        read: false
      };

      // Architectural interface ready for future Contact Messages Module:
      if (window.PortfolioStorage) {
        // Future module activates:
        // const existingMessages = window.PortfolioStorage.getJSON(window.PortfolioStorage.STORAGE_KEYS.MESSAGES, []);
        // existingMessages.push(messagePayload);
        // window.PortfolioStorage.setJSON(window.PortfolioStorage.STORAGE_KEYS.MESSAGES, existingMessages);
      }

      // Friendly success message after successful validation (Non-color reliant: checkmark + text)
      formStatus.className = "form-status success";
      formStatus.innerHTML = `<span aria-hidden="true" class="form-status-icon">✅</span><strong>Thank you, ${name}!</strong> Your message has been sent successfully. I'll get back to you as soon as possible.`;
      contactForm.reset();

      setTimeout(() => {
        formStatus.className = "form-status";
        formStatus.textContent = "";
      }, 7000);
    });
  }

  /* --------------------------------------------------------------------------
     9. Desktop Ambient Mouse Glow Follower
     -------------------------------------------------------------------------- */
  const ambientGlow = document.querySelector(".ambient-glow");
  if (ambientGlow && !window.matchMedia("(pointer: coarse)").matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;
    let active = false;

    window.addEventListener("mousemove", e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!active) {
        ambientGlow.style.opacity = "1";
        active = true;
      }
    }, { passive: true });

    window.addEventListener("mouseleave", () => {
      ambientGlow.style.opacity = "0";
      active = false;
    });

    function animateGlow() {
      curX += (mouseX - curX) * 0.08;
      curY += (mouseY - curY) * 0.08;
      ambientGlow.style.transform = `translate(calc(${curX}px - 50%), calc(${curY}px - 50%))`;
      requestAnimationFrame(animateGlow);
    }
    requestAnimationFrame(animateGlow);
  }

  /* --------------------------------------------------------------------------
     10. Scroll Reveal Observer
     -------------------------------------------------------------------------- */
  const revealElements = document.querySelectorAll(".reveal-on-scroll");
  if (revealElements.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add("is-revealed"));
  }

  /* --------------------------------------------------------------------------
     11. Dynamic Copyright Year
     -------------------------------------------------------------------------- */
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  /* --------------------------------------------------------------------------
     12. Back to Top Smooth Scrolling & Floating Button Reveal
     -------------------------------------------------------------------------- */
  const backToTopBtn = document.getElementById("back-to-top-btn");
  const floatingBackToTop = document.getElementById("floating-back-to-top");

  function handleScrollToTop(e) {
    if (e) e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", handleScrollToTop);
  }

  if (floatingBackToTop) {
    floatingBackToTop.addEventListener("click", handleScrollToTop);

    window.addEventListener("scroll", () => {
      if (window.scrollY > 350) {
        floatingBackToTop.classList.add("visible");
      } else {
        floatingBackToTop.classList.remove("visible");
      }
    }, { passive: true });
  }

  /* --------------------------------------------------------------------------
     13. Dynamic Content Hydration Architecture Hooks (Section 19)
     Workflow: Admin CRUD -> Local Storage -> Public Portfolio
     -------------------------------------------------------------------------- */
  function checkDynamicContentHydration() {
    if (!window.PortfolioStorage) return;

    // Hook 1: Dynamic Projects Hydration (Future Projects Module)
    const storedProjects = window.PortfolioStorage.getJSON(window.PortfolioStorage.STORAGE_KEYS.PROJECTS, null);
    if (storedProjects && Array.isArray(storedProjects) && storedProjects.length > 0) {
      console.log(`[Architecture Hook] ${storedProjects.length} dynamic projects detected in LocalStorage.`);
      // Future module will invoke renderDynamicProjects(storedProjects) here
    }

    // Hook 2: Dynamic Skills Hydration (Future Skills Module)
    const storedSkills = window.PortfolioStorage.getJSON(window.PortfolioStorage.STORAGE_KEYS.SKILLS, null);
    if (storedSkills && Array.isArray(storedSkills) && storedSkills.length > 0) {
      console.log(`[Architecture Hook] ${storedSkills.length} dynamic skills detected in LocalStorage.`);
      // Future module will invoke renderDynamicSkills(storedSkills) here
    }

    // Hook 3: Dynamic Blog Articles Hydration (Future Blog Module)
    const storedBlogs = window.PortfolioStorage.getJSON(window.PortfolioStorage.STORAGE_KEYS.BLOGS, null);
    if (storedBlogs && Array.isArray(storedBlogs) && storedBlogs.length > 0) {
      console.log(`[Architecture Hook] ${storedBlogs.length} dynamic articles detected in LocalStorage.`);
      // Future module will invoke renderDynamicBlogs(storedBlogs) here
    }
  }

  checkDynamicContentHydration();
});

