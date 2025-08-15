(function () {
  const root = document.documentElement;
  const baseRem = parseFloat(getComputedStyle(root).fontSize) || 16;

  function updateHeroScale() {
    const currentRem = parseFloat(getComputedStyle(root).fontSize) || baseRem;
    const scale = currentRem / baseRem; // >1 si el texto crece, <1 si achica
    root.style.setProperty('--hero-scale', scale.toFixed(3));
  }

  // Actualiza en eventos típicos y también con un pequeño polling (por si el navegador no emite eventos en zoom de texto)
  updateHeroScale();
  window.addEventListener('resize', updateHeroScale);
  window.addEventListener('orientationchange', updateHeroScale);

  // Polling suave para cubrir “zoom solo texto” en Firefox
  let lastRem = baseRem;
  setInterval(() => {
    const currentRem = parseFloat(getComputedStyle(root).fontSize) || baseRem;
    if (Math.abs(currentRem - lastRem) > 0.25) { // umbral para evitar ruido
      lastRem = currentRem;
      updateHeroScale();
    }
  }, 300);
})();
