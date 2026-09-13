(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function initializeNavigation() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const panel = document.querySelector("[data-nav-panel]");

    if (!toggle || !panel) return;

    const closeMenu = () => {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
    };

    toggle.addEventListener("click", () => {
      const shouldOpen = toggle.getAttribute("aria-expanded") !== "true";
      panel.classList.toggle("is-open", shouldOpen);
      toggle.setAttribute("aria-expanded", String(shouldOpen));
      toggle.setAttribute("aria-label", shouldOpen ? "Close navigation" : "Open navigation");
    });

    panel.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !panel.classList.contains("is-open")) return;
      closeMenu();
      toggle.focus();
    });

    const desktop = window.matchMedia("(min-width: 1021px)");
    if (desktop.addEventListener) desktop.addEventListener("change", closeMenu);
    else desktop.addListener(closeMenu);
  }

  function initializeParticles() {
    const canvas = document.querySelector("[data-particles]");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const colors = ["#ffffff", "#e0e0e0", "#bdbdbd"];
    const dots = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let resizeTimer;
    let frameId;
    let pointerVelocityX = 0;
    let pointerVelocityY = 0;
    let lastPointerX = width / 2;
    let lastPointerY = height / 2;

    const seedDots = () => {
      dots.length = 0;
      const count = Math.max(18, Math.floor((width * height) / 12000));

      for (let index = 0; index < count; index += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;

        dots.push({
          x,
          y,
          baseX: x,
          baseY: y,
          radius: 1.2 + Math.random() * 1.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          phase: Math.random() * Math.PI * 2,
          speed: 0.22 + Math.random() * 0.18,
          amplitude: 32 + Math.random() * 18,
          offset: Math.random() * 1000
        });
      }
    };

    const resizeCanvas = () => {
      const previousWidth = width;
      const previousHeight = height;
      width = window.innerWidth;
      height = window.innerHeight;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      if (!dots.length || Math.abs(width - previousWidth) > 48) {
        seedDots();
        return;
      }

      const scaleX = width / previousWidth;
      const scaleY = height / previousHeight;
      dots.forEach((dot) => {
        dot.x *= scaleX;
        dot.y *= scaleY;
        dot.baseX *= scaleX;
        dot.baseY *= scaleY;
      });
    };

    const drawDots = (timestamp) => {
      context.clearRect(0, 0, width, height);

      dots.forEach((dot) => {
        const time = timestamp / 1000 + dot.offset;
        const waveX = Math.sin(time * dot.speed + dot.phase) * dot.amplitude;
        const waveY = Math.cos(time * dot.speed * 0.9 + dot.phase) * dot.amplitude;

        dot.x += pointerVelocityX * 0.22;
        dot.y += pointerVelocityY * 0.22;
        dot.x += (dot.baseX + waveX - dot.x) * 0.012;
        dot.y += (dot.baseY + waveY - dot.y) * 0.012;

        if (dot.x < -20) dot.x = width + 10;
        if (dot.x > width + 20) dot.x = -10;
        if (dot.y < -20) dot.y = height + 10;
        if (dot.y > height + 20) dot.y = -10;

        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        context.fillStyle = dot.color;
        context.globalAlpha = 0.7;
        context.fill();
      });

      context.globalAlpha = 1;
      pointerVelocityX *= 0.92;
      pointerVelocityY *= 0.92;
    };

    const animate = (timestamp) => {
      drawDots(timestamp);
      frameId = window.requestAnimationFrame(animate);
    };

    resizeCanvas();

    if (reducedMotion.matches) drawDots(0);
    else frameId = window.requestAnimationFrame(animate);

    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeCanvas();
        if (reducedMotion.matches) drawDots(0);
      }, 80);
    }, { passive: true });

    if (finePointer.matches) {
      window.addEventListener("pointermove", (event) => {
        pointerVelocityX = (event.clientX - lastPointerX) * 0.18;
        pointerVelocityY = (event.clientY - lastPointerY) * 0.18;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
      }, { passive: true });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = undefined;
      } else if (!document.hidden && !reducedMotion.matches && !frameId) {
        frameId = window.requestAnimationFrame(animate);
      }
    });
  }

  function initializeCursor() {
    const cursor = document.querySelector("[data-cursor]");
    const glow = document.querySelector("[data-cursor-glow]");

    if (!cursor || !glow || !finePointer.matches || reducedMotion.matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let cursorX = targetX;
    let cursorY = targetY;
    let glowX = targetX;
    let glowY = targetY;

    window.addEventListener("pointermove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.add("is-visible");
      glow.classList.add("is-visible");
    }, { passive: true });

    document.addEventListener("pointerover", (event) => {
      cursor.classList.toggle("is-active", Boolean(event.target.closest("a, button")));
    });

    const animateCursor = () => {
      cursorX += (targetX - cursorX) * 0.22;
      cursorY += (targetY - cursorY) * 0.22;
      glowX += (targetX - glowX) * 0.08;
      glowY += (targetY - glowY) * 0.08;

      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      glow.style.left = `${glowX}px`;
      glow.style.top = `${glowY}px`;

      window.requestAnimationFrame(animateCursor);
    };

    window.requestAnimationFrame(animateCursor);
  }

  initializeNavigation();
  initializeParticles();
  initializeCursor();
})();
