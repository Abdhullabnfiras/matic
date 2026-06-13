/* ============================================================
   MATIC — Interaction & Motion Layer (Vanilla JS)
   ============================================================ */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isAr = document.documentElement.lang === "ar";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------------------------------------------------------
     PRELOADER
  --------------------------------------------------------- */
  const preloader = $("#preloader");
  const bar = $(".preloader__bar span");
  const count = $(".preloader__count");

  function runPreloader() {
    if (!preloader) return;
    let p = 0;
    const tick = () => {
      p += Math.random() * 16 + 6;
      if (p >= 100) p = 100;
      if (bar) bar.style.width = p + "%";
      if (count) count.textContent = String(Math.floor(p)).padStart(3, "0");
      if (p < 100) {
        setTimeout(tick, 110);
      } else {
        setTimeout(() => {
          preloader.classList.add("is-done");
          document.body.style.overflow = "";
          startHero();
        }, 350);
      }
    };
    document.body.style.overflow = "hidden";
    tick();
  }

  /* ---------------------------------------------------------
     HERO ENTRANCE — staggered word reveal
  --------------------------------------------------------- */
  function startHero() {
    const words = $$(".hero__title .word");
    words.forEach((w, i) => {
      w.style.transform = "translateY(110%)";
      w.style.opacity = "0";
      w.style.transition = "transform 1s cubic-bezier(0.16,1,0.3,1), opacity 1s";
      requestAnimationFrame(() => {
        setTimeout(() => {
          w.style.transform = "none";
          w.style.opacity = "1";
        }, 120 + i * 90);
      });
    });
  }

  /* ---------------------------------------------------------
     SPLIT TITLES INTO LINE-MASK REVEALS
  --------------------------------------------------------- */
  function splitLines() {
    $$("[data-split-lines]").forEach((el) => {
      const text = el.textContent.trim();
      const words = text.split(/\s+/);
      el.innerHTML = "";
      // Build words, then wrap by visual lines after layout
      const span = document.createElement("span");
      words.forEach((w, i) => {
        const word = document.createElement("span");
        word.textContent = w + (i < words.length - 1 ? " " : "");
        word.style.display = "inline";
        span.appendChild(word);
      });
      el.appendChild(span);
      // Simpler robust approach: wrap whole text in one animated line
      el.innerHTML = `<span class="reveal-line"><span class="reveal-line__inner">${text}</span></span>`;
    });
  }

  /* ---------------------------------------------------------
     SCROLL REVEAL (IntersectionObserver)
  --------------------------------------------------------- */
  function setupReveal() {
    const items = $$("[data-reveal], [data-split-lines]");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseFloat(el.dataset.delay || 0);
          el.style.transitionDelay = delay + "s";
          el.classList.add("is-visible");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
     NAV — scroll state + hide on scroll down
  --------------------------------------------------------- */
  function setupNav() {
    const nav = $("#nav");
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 40);
      if (y > lastY && y > 400) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // mobile menu
    const burger = $("#burger");
    const menu = $("#mobileMenu");
    const toggle = (open) => {
      burger.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open);
      menu.setAttribute("aria-hidden", !open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => toggle(!menu.classList.contains("is-open")));
    $$(".mobile-menu__links a").forEach((a) => a.addEventListener("click", () => toggle(false)));
  }

  /* ---------------------------------------------------------
     SCROLL PROGRESS BAR
  --------------------------------------------------------- */
  function setupProgress() {
    const bar = $(".scroll-progress");
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (window.scrollY / h) * 100 + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     PARALLAX (translate based on scroll)
  --------------------------------------------------------- */
  function setupParallax() {
    if (reduceMotion) return;
    const els = $$("[data-parallax]");
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - vh / 2;
        const speed = parseFloat(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${center * -speed}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------
     CUSTOM CURSOR + GLOW + MAGNETIC BUTTONS
  --------------------------------------------------------- */
  function setupCursor() {
    if (window.matchMedia("(hover: none)").matches) return;
    const dot = $(".cursor-dot");
    const glow = $(".cursor-glow");
    let mx = 0, my = 0, dx = 0, dy = 0, gx = 0, gy = 0;

    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
    const loop = () => {
      dx += (mx - dx) * 0.35; dy += (my - dy) * 0.35;
      gx += (mx - gx) * 0.12; gy += (my - gy) * 0.12;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
      glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener("mouseleave", () => {
      dot.classList.add("cursor-hidden");
      glow.classList.add("cursor-hidden");
    });
    document.addEventListener("mouseenter", () => {
      dot.classList.remove("cursor-hidden");
      glow.classList.remove("cursor-hidden");
    });

    $$("a, button, [data-magnetic], .tilt").forEach((el) => {
      el.addEventListener("mouseenter", () => dot.classList.add("is-active"));
      el.addEventListener("mouseleave", () => dot.classList.remove("is-active"));
    });

    // magnetic
    $$("[data-magnetic]").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transition = "transform 0s";
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------
     3D TILT on product cards
  --------------------------------------------------------- */
  function setupTilt() {
    if (reduceMotion || window.matchMedia("(hover: none)").matches) return;
    $$(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = "transform 0s";
        card.style.transform = `perspective(900px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
        card.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------
     APPLICATIONS TABS
  --------------------------------------------------------- */
  function setupApps() {
    const items = $$(".apps__item");
    const panels = $$(".apps__panel");
    items.forEach((item) => {
      const activate = () => {
        const idx = item.dataset.app;
        items.forEach((i) => i.classList.toggle("is-active", i === item));
        panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === idx));
      };
      item.addEventListener("click", activate);
      item.addEventListener("mouseenter", activate);
    });
  }

  /* ---------------------------------------------------------
     COUNTERS
  --------------------------------------------------------- */
  function setupCounters() {
    const nums = $$("[data-count]");
    if (!("IntersectionObserver" in window)) {
      nums.forEach((n) => (n.textContent = n.dataset.count));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const dur = 1600; const start = performance.now();
        const step = (now) => {
          const t = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.floor(eased * target);
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = target;
        };
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach((n) => io.observe(n));
  }

  /* ---------------------------------------------------------
     TIMELINE PROGRESS
  --------------------------------------------------------- */
  function setupTimeline() {
    const wrap = $(".timeline");
    const prog = $(".timeline__progress");
    if (!wrap || !prog) return;
    const onScroll = () => {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height + vh * 0.4;
      const passed = vh * 0.6 - r.top;
      const pct = Math.max(0, Math.min(1, passed / total));
      prog.style.height = pct * 100 + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     GALLERY (generated) + LIGHTBOX
  --------------------------------------------------------- */
  const galleryData = isAr ? [
    { title: "مجموعة طابعات ماتيك", tag: "التصنيع", src: "1.png" },
    { title: "رأس الطباعة الدقيق", tag: "الهندسة", src: "2.png" },
    { title: "طابعة ماتيك كور", tag: "تصميم المنتجات", src: "3.png" },
    { title: "داخل ورشة العمل", tag: "الهندسة", src: "4.png" },
    { title: "تفاصيل طبقة تلو الأخرى", tag: "الرعاية الصحية", src: "2.png" },
    { title: "صُنعت في العراق", tag: "التصنيع", src: "1.png" },
    { title: "مدمجة بتصميمها", tag: "التعليم", src: "3.png" },
    { title: "مصممة لتدوم", tag: "الهندسة", src: "4.png" },
  ] : [
    { title: "The MATIC Lineup", tag: "Manufacturing", src: "1.png" },
    { title: "Precision Print Head", tag: "Engineering", src: "2.png" },
    { title: "MATIC Core", tag: "Product Design", src: "3.png" },
    { title: "In The Workshop", tag: "Engineering", src: "4.png" },
    { title: "Layer-by-Layer Detail", tag: "Healthcare", src: "2.png" },
    { title: "Built In Iraq", tag: "Manufacturing", src: "1.png" },
    { title: "Compact By Design", tag: "Education", src: "3.png" },
    { title: "Engineered To Last", tag: "Engineering", src: "4.png" },
  ];

  function buildGallery() {
    const grid = $("#galleryGrid");
    if (!grid) return;
    galleryData.forEach((g, i) => {
      const item = document.createElement("figure");
      item.className = "gallery__item";
      item.setAttribute("data-reveal", "");
      item.dataset.delay = (i % 3) * 0.08;
      item.innerHTML = `
        <div class="gallery__item-art">
          <img src="${g.src}" alt="${g.title}" loading="lazy" />
        </div>
        <div class="gallery__item-overlay">
          <div><small>${g.tag}</small><span>${g.title}</span></div>
        </div>`;
      item.addEventListener("click", () => openLightbox(g));
      grid.appendChild(item);
    });
  }

  // lightbox element
  let lightbox;
  function buildLightbox() {
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.innerHTML = `
      <div class="lightbox__content" role="dialog" aria-modal="true">
        <button class="lightbox__close" aria-label="Close">×</button>
        <div class="lightbox__art"><img alt="" /></div>
        <div class="lightbox__caption"><h3></h3><p></p></div>
      </div>`;
    document.body.appendChild(lightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.closest(".lightbox__close")) closeLightbox();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
  }
  function openLightbox(g) {
    const img = $(".lightbox__art img", lightbox);
    if (g.src) { img.src = g.src; img.alt = g.title; }
    $(".lightbox__caption h3", lightbox).textContent = g.title;
    $(".lightbox__caption p", lightbox).textContent =
      isAr ? `ماتيك — ${g.tag}.` : `MATIC — ${g.tag.toLowerCase()}.`;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* ---------------------------------------------------------
     HERO PARTICLE SYSTEM (canvas)
  --------------------------------------------------------- */
  function setupParticles() {
    const canvas = $("#heroParticles");
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    let w, h, particles, raf;
    const COUNT = window.innerWidth < 768 ? 36 : 80;

    function resize() {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    }
    function init() {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.3 * devicePixelRatio,
        r: (Math.random() * 1.6 + 0.4) * devicePixelRatio,
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = window.__maticTheme === "light"
          ? "rgba(17,17,17,0.45)" : "rgba(255,255,255,0.5)";
        ctx.fill();
        // connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const max = 120 * devicePixelRatio;
          if (dist < max) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(214,32,0,${0.18 * (1 - dist / max)})`;
            ctx.lineWidth = devicePixelRatio;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    window.addEventListener("resize", () => { cancelAnimationFrame(raf); resize(); init(); draw(); });
  }

  /* ---------------------------------------------------------
     CONTACT FORM
  --------------------------------------------------------- */
  function setupForm() {
    const form = $("#contactForm");
    const note = $("#formNote");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#name").value.trim();
      const email = $("#email").value.trim();
      const msg = $("#message").value.trim();
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name || !validEmail || !msg) {
        note.textContent = "Please complete all required fields with a valid email.";
        note.className = "contact__note is-err";
        return;
      }
      note.textContent = "Thank you — your message is on its way. We'll reply within one business day.";
      note.className = "contact__note is-ok";
      form.reset();
    });
  }

  /* ---------------------------------------------------------
     THEME TOGGLE (light / dark)
  --------------------------------------------------------- */
  function setupTheme() {
    const btn = $("#themeToggle");
    if (!btn) return;
    const root = document.documentElement;
    const apply = (theme) => {
      if (theme === "light") root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme");
      btn.setAttribute("aria-label",
        theme === "light" ? "Switch to dark mode" : "Switch to light mode");
      window.__maticTheme = theme;
      document.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
    };
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      try { localStorage.setItem("matic-theme", next); } catch (e) {}
      apply(next);
    });
    window.__maticTheme = root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  /* ---------------------------------------------------------
     SMOOTH ANCHOR SCROLL
  --------------------------------------------------------- */
  function setupAnchors() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id === "#" || !id) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  function init() {
    $("#year").textContent = new Date().getFullYear();
    setupTheme();
    splitLines();
    setupReveal();
    setupNav();
    setupProgress();
    setupParallax();
    setupCursor();
    setupTilt();
    setupApps();
    setupCounters();
    setupTimeline();
    buildGallery();
    buildLightbox();
    setupParticles();
    setupForm();
    setupAnchors();
    runPreloader();
    // re-observe newly created gallery reveals
    setupReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
