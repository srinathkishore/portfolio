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
     Only active on hover-capable (non-touch) devices.
     Hides completely when cursor leaves the page.
  ─────────────────────────────────────────────────────────────────── */
  function initCursor() {
    const dot = qs("#cursorDot");
    const ring = qs("#cursorRing");
    if (!dot || !ring) return;

    if (window.matchMedia("(hover: none)").matches) {
      dot.remove();
      ring.remove();
      return;
    }

    document.documentElement.classList.add("has-custom-cursor");

    let mx = 0,
      my = 0;
    let rx = 0,
      ry = 0;
    let visible = false;

    function showCursor() {
      if (visible) return;
      visible = true;
      dot.classList.remove("hidden");
      ring.classList.remove("hidden");
    }

    function hideCursor() {
      visible = false;
      dot.classList.add("hidden");
      ring.classList.add("hidden");
    }

    on(
      document,
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.left = mx + "px";
        dot.style.top = my + "px";
        showCursor();
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

    on(document, "mouseleave", hideCursor);
    on(document, "mouseenter", showCursor);

    hideCursor();
  }

  /* ─────────────────────────────────────────────────────────────────
     2. HEADER — scroll state + active nav link
  ─────────────────────────────────────────────────────────────────── */
  function initHeader() {
    const header = qs("#site-header");
    const navLinks = qsa("#site-header nav a");
    const sections = qsa("section[id]");
    if (!header) return;

    let ticking = false;

    function updateHeader() {
      const scrollY = window.scrollY;
      header.classList.toggle("scrolled", scrollY > 60);

      let current = "";
      sections.forEach((sec) => {
        if (scrollY >= sec.offsetTop - 120) current = sec.getAttribute("id");
      });
      navLinks.forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === "#" + current);
      });

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

    updateHeader();
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
      setTimeout(() => focusable()[0]?.focus(), 100);
    }

    function closeNav() {
      mobNav.classList.remove("open");
      mobBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      mobBtn.focus();
    }

    window.closeMobNav = closeNav;

    on(mobBtn, "click", openNav);
    on(mobClose, "click", closeNav);

    on(document, "keydown", (e) => {
      if (e.key === "Escape" && mobNav.classList.contains("open")) closeNav();
    });

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

    on(mobNav, "click", (e) => {
      if (e.target === mobNav) closeNav();
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     4. SCROLL REVEAL — IntersectionObserver
  ─────────────────────────────────────────────────────────────────── */
  function initScrollReveal() {
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
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const siblings = qsa(".reveal", entry.target.parentElement);
            const idx = siblings.indexOf(entry.target);
            entry.target.style.transitionDelay = idx * 60 + "ms";
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
            setTimeout(
              () => {
                entry.target.style.transitionDelay = "";
              },
              800 + idx * 60,
            );
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
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
          const dur = 1200;
          const start = performance.now();

          function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / dur, 1);
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
     Uses translateY only; initial scale is handled by CSS transform-origin
     so the image never downscales below 100% quality.
  ─────────────────────────────────────────────────────────────────── */
  function initParallax() {
    const heroImg = qs(".hero-img");
    if (!heroImg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 1024px)").matches) return;

    let ticking = false;

    on(
      window,
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            heroImg.style.transform = `translateY(${scrollY * 0.18}px)`;
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
     9. SMOOTH SCROLL — polyfill for nav anchors
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
        history.pushState(null, "", id);
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     10. REDUCED MOTION guard — reveal all immediately if preferred
  ─────────────────────────────────────────────────────────────────── */
  function checkReducedMotion() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      qsa(".reveal").forEach((el) => el.classList.add("visible"));
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     11. GYRO PARALLAX — floating labels on mobile tilt
  ─────────────────────────────────────────────────────────────────── */
  function initGyroParallax() {
    if (!window.DeviceOrientationEvent) return;
    if (!window.matchMedia("(hover: none)").matches) return;

    on(
      window,
      "deviceorientation",
      (e) => {
        const tiltX = (e.gamma || 0) / 30;
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
     12. EMAIL COPY — right-click to copy email address
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
     13. CURSOR RING EXPANSION — expand ring on interactive elements
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
     14. PAGE LOAD — fade body in after load
  ─────────────────────────────────────────────────────────────────── */
  function initPageLoad() {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.4s ease";
    on(window, "load", () => {
      document.body.style.opacity = "1";
    });
    if (document.readyState === "complete") document.body.style.opacity = "1";
  }

  /* ─────────────────────────────────────────────────────────────────
     15. SCROLL PROGRESS BAR — drives ::after on #site-header
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
     CHESS.COM LIVE STATS
  ─────────────────────────────────────────────────────────────────── */
  function initChessStats() {
    const container = qs("#chessLiveStats");
    const skeleton = qs("#chessSkeleton");
    if (!container) return;

    const FORMATS = [
      { key: "chess_rapid", label: "Rapid" },
      { key: "chess_blitz", label: "Blitz" },
      { key: "chess_bullet", label: "Bullet" },
    ];

    fetch("https://api.chess.com/pub/player/srinath_kishore/stats", {
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => {
        skeleton && skeleton.remove();

        let totalGames = 0;
        let totalWins = 0;
        const formatRows = [];

        FORMATS.forEach(({ key, label }) => {
          const fmt = data[key];
          if (!fmt || !fmt.last) return;
          const rating = fmt.last.rating ?? "—";
          const rec = fmt.record ?? {};
          const wins = rec.win ?? 0;
          const games = wins + (rec.loss ?? 0) + (rec.draw ?? 0);
          totalGames += games;
          totalWins += wins;
          const row = document.createElement("div");
          row.className = "chess-format-row";
          row.innerHTML = `
            <span class="chess-format-name">${label} RATING</span>
            <span class="chess-format-rating">${rating}</span>
            <span class="chess-format-record">
              <span class="rec-wins">${wins} Wins</span>
              <span class="rec-games"> / ${games} Games</span>
            </span>`;
          formatRows.push(row);
        });

        const hero = document.createElement("div");
        hero.className = "chess-total-hero";
        hero.innerHTML = `
          <div class="chess-total-stat">
            <span class="chess-total-num">${totalGames.toLocaleString()}</span>
            <span class="chess-total-label">Total Games</span>
          </div>
          <div class="chess-total-stat chess-total-stat--wins">
            <span class="chess-total-num chess-total-num--wins">${totalWins.toLocaleString()}</span>
            <span class="chess-total-label">Wins</span>
          </div>`;
        container.appendChild(hero);

        if (!formatRows.length) {
          container.innerHTML += `<p style="font-size:0.8rem;color:var(--silver)">No game data yet.</p>`;
          return;
        }
        formatRows.forEach((r) => container.appendChild(r));

        const tactics = data.tactics;
        if (tactics && tactics.highest) {
          const pr = document.createElement("div");
          pr.className = "chess-puzzle-row";
          pr.innerHTML = `
            <span class="chess-puzzle-label">Puzzle Rating</span>
            <span class="chess-puzzle-rating">${tactics.highest.rating}</span>`;
          container.appendChild(pr);
        }
      })
      .catch(() => {
        skeleton && skeleton.remove();
        container.innerHTML = `
          <div class="chess-format-row">
            <span class="chess-format-icon">⏱</span>
            <span class="chess-format-name">Rapid</span>
            <span class="chess-format-rating" style="color:var(--silver);font-size:0.75rem">Active Player</span>
          </div>
          <p style="font-size:0.72rem;color:var(--silver);padding:var(--space-1) 0;opacity:0.55">
            Live stats unavailable — visit profile for details.
          </p>`;
      });
  }

  /* ─────────────────────────────────────────────────────────────────
   LEETCODE LIVE STATS
   Renders a dashboard matching the chess stats format:
   total solved hero + difficulty breakdown rows
─────────────────────────────────────────────────────────────────── */
  function initLeetCodeStats() {
    const container = qs("#lcLiveStats");
    const skeleton = qs("#lcSkeleton");
    if (!container) return;

    const STATIC = {
      totalSolved: 621,
      easySolved: 516,
      totalEasy: 929,
      mediumSolved: 96,
      totalMedium: 2019,
      hardSolved: 9,
      totalHard: 912,
      totalQuestions: 3860,
      attempting: 15,
      badges: 2,
      ranking: null,
      acceptanceRate: null,
    };

    function renderLCStats(d) {
      skeleton && skeleton.remove();

      const totalSolvedHero = document.createElement("div");
      totalSolvedHero.className = "chess-total-hero";
      totalSolvedHero.innerHTML = `
      <div class="chess-total-stat">
        <span class="chess-total-num">${d.totalSolved.toLocaleString()}</span>
        <span class="chess-total-label">Total Problems Solved</span>
      </div>`;
      container.appendChild(totalSolvedHero);

      const difficulties = [
        {
          label: "Easy",
          solved: d.easySolved,
          total: d.totalEasy,
          color: "#00b8a3",
        },
        {
          label: "Medium",
          solved: d.mediumSolved,
          total: d.totalMedium,
          color: "#ffa116",
        },
        {
          label: "Hard",
          solved: d.hardSolved,
          total: d.totalHard,
          color: "#ff375f",
        },
      ];

      difficulties.forEach(({ label, solved, total, color }) => {
        const row = document.createElement("div");
        row.className = "chess-format-row";
        row.innerHTML = `
        <span class="chess-format-name">${label}</span>
        <span class="chess-format-rating" style="color: ${color}">${solved} / ${total}</span>`;
        container.appendChild(row);
      });

      const bottomRow = document.createElement("div");
      bottomRow.className = "chess-puzzle-row";
      bottomRow.innerHTML = `
      <span class="chess-puzzle-label">Attempting</span>
      <span class="chess-puzzle-rating">${d.attempting || 15}</span>`;
      container.appendChild(bottomRow);
    }

    fetch("https://leetcode-stats-api.herokuapp.com/user7929B")
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => {
        if (data.status !== "success") throw new Error("bad status");
        renderLCStats({ ...STATIC, ...data });
      })
      .catch(() => renderLCStats(STATIC));
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
    initSmoothScroll();
    initGyroParallax();
    initEmailCopy();
    initScrollProgress();
    initCursorDelegation();
    initChessStats();
    initLeetCodeStats();

    on(window, "touchstart", () => {}, { passive: true });
  }

  initPageLoad();
  ready(init);
})();
