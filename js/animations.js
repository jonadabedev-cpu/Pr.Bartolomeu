/**
 * ==========================================================================
 * MÉTODO KAIRÓS® — animations.js
 * Sistema global de animações: scroll reveal (data-anim), parallax de mouse,
 * estado de navegação no scroll, menu mobile e accordion do FAQ.
 * ==========================================================================
 */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* --------------------------------------------------------------------
   * 1. SCROLL REVEAL — Intersection Observer
   * Aplica classe .is-visible quando o elemento [data-anim] entra na tela.
   * Suporta atraso escalonado via atributo [data-anim-delay] (ms).
   * ------------------------------------------------------------------ */
  function initScrollReveal() {
    const targets = document.querySelectorAll("[data-anim]");
    if (!targets.length) return;

    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.getAttribute("data-anim-delay");
            if (delay) el.style.setProperty("--d", `${delay}ms`);
            el.classList.add("is-visible");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* --------------------------------------------------------------------
   * 2. STAGGER AUTOMÁTICO
   * Para grupos [data-anim-group], aplica atraso incremental aos filhos
   * que possuem [data-anim], criando um efeito cascata premium.
   * ------------------------------------------------------------------ */
  function initStaggerGroups() {
    const groups = document.querySelectorAll("[data-anim-group]");
    groups.forEach((group) => {
      const step = parseInt(group.getAttribute("data-anim-group"), 10) || 90;
      const children = group.querySelectorAll("[data-anim]");
      children.forEach((child, i) => {
        child.style.setProperty("--d", `${i * step}ms`);
      });
    });
  }

  /* --------------------------------------------------------------------
   * 3. NAVEGAÇÃO — estado ao rolar + menu mobile
   * ------------------------------------------------------------------ */
  function initNav() {
    const nav = document.querySelector(".nav");
    const toggle = document.querySelector(".nav__toggle");
    const links = document.querySelector(".nav__links");
    if (!nav) return;

    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && links) {
      toggle.addEventListener("click", () => {
        const isOpen = links.classList.toggle("is-open");
        document.body.classList.toggle("nav-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
      });

      links.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          links.classList.remove("is-open");
          document.body.classList.remove("nav-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  /* --------------------------------------------------------------------
   * 4. MOUSE PARALLAX — glow que segue o cursor + parallax leve em cards
   * ------------------------------------------------------------------ */
  function initMouseGlow() {
    if (prefersReducedMotion || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const glow = document.createElement("div");
    glow.className = "mouse-glow";
    document.body.appendChild(glow);

    let rafId = null;
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

    window.addEventListener(
      "mousemove",
      (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        glow.classList.add("is-active");
        if (!rafId) rafId = requestAnimationFrame(render);
      },
      { passive: true }
    );

    document.addEventListener("mouseleave", () => glow.classList.remove("is-active"));

    function render() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      glow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
      }
    }
  }

  /* --------------------------------------------------------------------
   * 5. PARALLAX SUAVE EM ELEMENTOS 3D DO HERO
   * ------------------------------------------------------------------ */
  function initHeroParallax() {
    if (prefersReducedMotion) return;
    const emblem = document.querySelector(".hero__emblem");
    const hero = document.querySelector(".hero");
    if (!emblem || !hero) return;

    hero.addEventListener(
      "mousemove",
      (e) => {
        const { innerWidth, innerHeight } = window;
        const x = (e.clientX / innerWidth - 0.5) * 24;
        const y = (e.clientY / innerHeight - 0.5) * 24;
        emblem.style.transform = `translate(${x}px, ${y}px)`;
      },
      { passive: true }
    );
  }

  /* --------------------------------------------------------------------
   * 6. SCROLL PARALLAX EM VÍDEO DE FUNDO (leve, para profundidade)
   * ------------------------------------------------------------------ */
  function initVideoParallax() {
    if (prefersReducedMotion) return;
    const video = document.querySelector(".hero__video");
    if (!video) return;

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const offset = window.scrollY * 0.18;
          video.style.transform = `translate(-50%, calc(-50% + ${offset}px))`;
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* --------------------------------------------------------------------
   * 7. FAQ ACCORDION
   * ------------------------------------------------------------------ */
  function initFaqAccordion() {
    const items = document.querySelectorAll(".faq__item");
    items.forEach((item) => {
      const question = item.querySelector(".faq__question");
      if (!question) return;
      question.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");
        items.forEach((other) => {
          other.classList.remove("is-open");
          other.querySelector(".faq__question")?.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("is-open");
          question.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* --------------------------------------------------------------------
   * INIT
   * ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    initStaggerGroups();
    initScrollReveal();
    initNav();
    initMouseGlow();
    initHeroParallax();
    initVideoParallax();
    initFaqAccordion();
  });
})();