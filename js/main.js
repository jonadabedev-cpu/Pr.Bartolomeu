/**
 * ==========================================================================
 * MÉTODO KAIRÓS® — main.js
 * Lógica geral do site: reprodução segura do vídeo de fundo, ano dinâmico
 * no rodapé, scroll suave para âncoras e pequenas melhorias de UX.
 * ==========================================================================
 */

(function () {
  "use strict";

  /* --------------------------------------------------------------------
   * 1. VÍDEO DE FUNDO DO HERO — garante autoplay em todos os navegadores
   * ------------------------------------------------------------------ */
  function initHeroVideo() {
    const video = document.querySelector(".hero__video");
    if (!video) return;

    video.muted = true;
    video.setAttribute("muted", "");
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay bloqueado — tenta novamente na primeira interação
        const resume = () => {
          video.play();
          document.removeEventListener("touchstart", resume);
          document.removeEventListener("click", resume);
        };
        document.addEventListener("touchstart", resume, { once: true });
        document.addEventListener("click", resume, { once: true });
      });
    }
  }

  /* --------------------------------------------------------------------
   * 2. ANO DINÂMICO NO RODAPÉ
   * ------------------------------------------------------------------ */
  function setCurrentYear() {
    const el = document.querySelector("[data-current-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* --------------------------------------------------------------------
   * 3. SCROLL SUAVE COM OFFSET DE NAVEGAÇÃO FIXA
   * ------------------------------------------------------------------ */
  function initSmoothAnchors() {
    const nav = document.querySelector(".nav");
    const navHeight = nav ? nav.offsetHeight : 0;

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const targetId = anchor.getAttribute("href");
        if (!targetId || targetId === "#") return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  }

  /* --------------------------------------------------------------------
   * 4. LAZY LOAD DE IMAGENS COM [loading="lazy"] — fallback de fade-in
   * ------------------------------------------------------------------ */
  function initImageFade() {
    document.querySelectorAll("img[loading='lazy']").forEach((img) => {
      if (img.complete) return;
      img.style.opacity = "0";
      img.style.transition = "opacity 600ms ease";
      img.addEventListener("load", () => (img.style.opacity = "1"), { once: true });
    });
  }

  /* --------------------------------------------------------------------
   * INIT
   * ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    initHeroVideo();
    setCurrentYear();
    initSmoothAnchors();
    initImageFade();
  });
})();