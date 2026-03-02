/**
 * Srinath Kishore Portfolio — main.js
 * Vanilla JS, no dependencies, production-grade
 */

(function () {
  "use strict";

  /* ── Utility ─────────────────────────────────────────────────────── */
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const on = (el, ev, fn, opts) => el?.addEventListener(ev, fn, opts);

  /** Debounce a function */
  function debounce(fn, ms = 60) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  /** Run fn once the DOM is interactive */
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn, { once: true });
  }

  /* ─────────────────────────────────────────────────────────────────
     1. CUSTOM CURSOR
     Only active on pointer (hover-capable) devices — never on touch
  ─────────────────────────────────────────────────────────────────── */
  function initCursor() {
    const dot = qs("#cursorDot");
    const ring = qs("#cursorRing");
    if (!dot || !ring) return;

    // Abort on touch-primary devices; keep native cursor
    if (window.matchMedia("(hover: none)").matches) {
      dot.remove();
      ring.remove();
      return;
    }

    // Signal CSS to hide body cursor and show custom elements
    document.documentElement.classList.add("has-custom-cursor");

    let mx = 0,
      my = 0;
    let rx = 0,
      ry = 0;

    on(
      document,
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.left = mx + "px";
        dot.style.top = my + "px";
      },
      { passive: true },
    );

    function lerpRing() {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(lerpRing);
    }
    lerpRing();

    // Hide cursor when leaving window
    on(document, "mouseleave", () => dot.classList.add("hidden"));
    on(document, "mouseenter", () => dot.classList.remove("hidden"));
  }

  /* ─────────────────────────────────────────────────────────────────
     2. HEADER — scroll state + active nav link
  ─────────────────────────────────────────────────────────────────── */
  function initHeader() {
    const header = qs("#site-header");
    const navLinks = qsa("#site-header nav a");
    const sections = qsa("section[id]");
    if (!header) return;

    let lastScrollY = 0;
    let ticking = false;

    function updateHeader() {
      const scrollY = window.scrollY;
      header.classList.toggle("scrolled", scrollY > 60);

      // Active nav link
      let current = "";
      sections.forEach((sec) => {
        if (scrollY >= sec.offsetTop - 120) {
          current = sec.getAttribute("id");
        }
      });
      navLinks.forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === "#" + current);
      });

      lastScrollY = scrollY;
      ticking = false;
    }

    on(
      window,
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(updateHeader);
          ticking = true;
        }
      },
      { passive: true },
    );

    updateHeader(); // run once on load
  }

  /* ─────────────────────────────────────────────────────────────────
     3. MOBILE NAV — open/close with focus trap
  ─────────────────────────────────────────────────────────────────── */
  function initMobileNav() {
    const mobNav = qs("#mobNav");
    const mobBtn = qs("#mobMenuBtn");
    const mobClose = qs("#mobClose");
    if (!mobNav || !mobBtn) return;

    const focusable = () =>
      qsa("a, button", mobNav).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
      );

    function openNav() {
      mobNav.classList.add("open");
      mobBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      // Focus first link after transition
      setTimeout(() => focusable()[0]?.focus(), 100);
    }

    function closeNav() {
      mobNav.classList.remove("open");
      mobBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      mobBtn.focus();
    }

    // Expose globally for inline onclick handlers
    window.closeMobNav = closeNav;

    on(mobBtn, "click", openNav);
    on(mobClose, "click", closeNav);

    // Escape key closes
    on(document, "keydown", (e) => {
      if (e.key === "Escape" && mobNav.classList.contains("open")) closeNav();
    });

    // Focus trap
    on(mobNav, "keydown", (e) => {
      if (e.key !== "Tab") return;
      const els = focusable();
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Close on backdrop click
    on(mobNav, "click", (e) => {
      if (e.target === mobNav) closeNav();
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     4. SCROLL REVEAL — IntersectionObserver
     Skips animation entirely on Save-Data or slow connections
  ─────────────────────────────────────────────────────────────────── */
  function initScrollReveal() {
    // Immediately reveal on slow/save-data connections or no IO support
    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    const isSlowConn =
      conn && (conn.saveData || ["slow-2g", "2g"].includes(conn.effectiveType));

    if (!("IntersectionObserver" in window) || isSlowConn) {
      qsa(".reveal").forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Stagger siblings in same parent
            const siblings = qsa(".reveal", entry.target.parentElement);
            const idx = siblings.indexOf(entry.target);
            entry.target.style.transitionDelay = idx * 60 + "ms";

            entry.target.classList.add("visible");
            observer.unobserve(entry.target);

            // Clear delay after animation
            setTimeout(
              () => {
                entry.target.style.transitionDelay = "";
              },
              800 + idx * 60,
            );
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px",
      },
    );

    qsa(".reveal").forEach((el) => observer.observe(el));
  }

  /* ─────────────────────────────────────────────────────────────────
     5. HERO HEADLINE — staggered line animation
  ─────────────────────────────────────────────────────────────────── */
  function initHeroHeadline() {
    qsa(".hero-h1 .line").forEach((line) => {
      const delay = parseInt(line.dataset.delay || 0, 10);
      line.style.animationDelay = 220 + delay + "ms";
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     6. STAT COUNTER — animates numbers up when in view
  ─────────────────────────────────────────────────────────────────── */
  function initStatCounters() {
    const counters = qsa(".stat-num[data-target]");
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const dur = 1200; // ms
          const start = performance.now();

          function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / dur, 1);
            // Ease out quart
            const eased = 1 - Math.pow(1 - progress, 4);
            el.textContent = Math.round(eased * target);
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target;
          }

          requestAnimationFrame(tick);
          observer.unobserve(el);
        });
      },
      { threshold: 0.5 },
    );

    counters.forEach((el) => observer.observe(el));
  }

  /* ─────────────────────────────────────────────────────────────────
     7. PARALLAX — subtle hero image drift on scroll
  ─────────────────────────────────────────────────────────────────── */
  function initParallax() {
    const heroImg = qs(".hero-img");
    if (
      !heroImg ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    if (window.matchMedia("(max-width: 1024px)").matches) return;

    let ticking = false;

    on(
      window,
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const offset = scrollY * 0.2;
            heroImg.style.transform = `translateY(${offset}px) scale(1.05)`;
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );
  }

  /* ─────────────────────────────────────────────────────────────────
     8. MARQUEE — pause on hover for accessibility
  ─────────────────────────────────────────────────────────────────── */
  function initMarquees() {
    qsa(".marquee, .marquee--rev, .tech-strip-inner").forEach((el) => {
      on(el.parentElement, "mouseenter", () => {
        el.style.animationPlayState = "paused";
      });
      on(el.parentElement, "mouseleave", () => {
        el.style.animationPlayState = "running";
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     9. PROJECT CARDS — magnetic tilt on mouse
  ─────────────────────────────────────────────────────────────────── */
  function initCardTilt() {
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    qsa(".project-card").forEach((card) => {
      on(card, "mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -4;
        const rotateY = ((x - cx) / cx) * 4;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      });
      on(card, "mouseleave", () => {
        card.style.transform = "";
        card.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
        setTimeout(() => {
          card.style.transition = "";
        }, 600);
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     10. SMOOTH SCROLL — polyfill for nav anchors
  ─────────────────────────────────────────────────────────────────── */
  function initSmoothScroll() {
    qsa('a[href^="#"]').forEach((anchor) => {
      on(anchor, "click", (e) => {
        const id = anchor.getAttribute("href");
        if (id === "#") return;
        const target = qs(id);
        if (!target) return;
        e.preventDefault();

        const navH =
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--nav-h",
            ),
          ) || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - navH;

        window.scrollTo({ top, behavior: "smooth" });

        // Update URL without jumping
        history.pushState(null, "", id);
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     11. PREFERS REDUCED MOTION guard
  ─────────────────────────────────────────────────────────────────── */
  function checkReducedMotion() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      qsa(".reveal").forEach((el) => el.classList.add("visible"));
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     12. HERO IMAGE PARALLAX on device orientation (mobile)
  ─────────────────────────────────────────────────────────────────── */
  function initGyroParallax() {
    if (!window.DeviceOrientationEvent) return;
    if (!window.matchMedia("(hover: none)").matches) return;

    on(
      window,
      "deviceorientation",
      (e) => {
        const tiltX = (e.gamma || 0) / 30; // -1 to 1
        const tiltY = (e.beta || 0) / 30;
        qsa(".float-label").forEach((el, i) => {
          const depth = (i + 1) * 4;
          el.style.transform = `translate(${tiltX * depth}px, ${tiltY * depth}px)`;
        });
      },
      { passive: true },
    );
  }

  /* ─────────────────────────────────────────────────────────────────
     13. EMAIL COPY — click to copy email address
  ─────────────────────────────────────────────────────────────────── */
  function initEmailCopy() {
    const emailLink = qs(".contact-email-link");
    if (!emailLink || !navigator.clipboard) return;

    on(emailLink, "contextmenu", (e) => {
      e.preventDefault();
      const addr = emailLink.textContent.trim();
      navigator.clipboard
        .writeText(addr)
        .then(() => {
          const orig = emailLink.textContent;
          emailLink.textContent = "Copied!";
          setTimeout(() => {
            emailLink.textContent = orig;
          }, 2000);
        })
        .catch(() => {});
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     14. CURSOR RING EXPANSION — delegated via event bubbling
     Only runs when has-custom-cursor is active (pointer devices)
  ─────────────────────────────────────────────────────────────────── */
  function initCursorDelegation() {
    if (!document.documentElement.classList.contains("has-custom-cursor"))
      return;
    const ring = qs("#cursorRing");
    if (!ring) return;

    on(document, "mouseover", (e) => {
      if (
        e.target.closest(
          "a, button, .project-card, .skill-category, .stat-card, .exp-item",
        )
      ) {
        ring.classList.add("expanded");
      }
    });
    on(document, "mouseout", (e) => {
      if (
        e.target.closest(
          "a, button, .project-card, .skill-category, .stat-card, .exp-item",
        )
      ) {
        ring.classList.remove("expanded");
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     15. PAGE LOAD — remove initial paint block
  ─────────────────────────────────────────────────────────────────── */
  function initPageLoad() {
    // Reveal body gracefully
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.4s ease";
    on(window, "load", () => {
      document.body.style.opacity = "1";
    });
    // Fallback if load event already fired
    if (document.readyState === "complete") {
      document.body.style.opacity = "1";
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     16. SCROLL PROGRESS BAR — drives ::after on #site-header
  ─────────────────────────────────────────────────────────────────── */
  function initScrollProgress() {
    const header = qs("#site-header");
    if (!header) return;

    let ticking = false;
    function update() {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      header.style.setProperty("--scroll-progress", pct.toFixed(2) + "%");
      ticking = false;
    }

    on(
      window,
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );

    update();
  }

  /* ─────────────────────────────────────────────────────────────────
     INIT — wire everything up
  ─────────────────────────────────────────────────────────────────── */
  function init() {
    checkReducedMotion();
    initCursor();
    initHeader();
    initMobileNav();
    initHeroHeadline();
    initScrollReveal();
    initStatCounters();
    initParallax();
    initMarquees();
    initCardTilt();
    initSmoothScroll();
    initGyroParallax();
    initEmailCopy();
    initScrollProgress();
    initCursorDelegation();

    // Passive touch support (improves scroll performance on mobile)
    on(window, "touchstart", () => {}, { passive: true });
  }

  initPageLoad();
  ready(init);
})();
