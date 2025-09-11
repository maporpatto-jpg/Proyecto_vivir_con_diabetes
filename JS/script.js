/* JS/script.js
   Vivir con Diabetes — utilidades de UI + accesibilidad
   - Sincroniza --hero-scale con el zoom de texto (REM)
   - Expone --header-h con la altura real del <header> (para anclas)
   - Enfoca el <main> al usar el skip-link
   - Asegura scroll-margin-top en secciones con id
*/
(() => {
  const root = document.documentElement;

  // 1) HERO: escalar imagen según zoom de texto (REM)
  const BASE_REM = 16;
  function setHeroScale() {
    const rem = parseFloat(getComputedStyle(root).fontSize) || BASE_REM;
    const scale = rem / BASE_REM;
    root.style.setProperty('--hero-scale', String(scale));
  }

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => setHeroScale());
    ro.observe(root);
  }
  window.addEventListener('resize', setHeroScale);
  window.addEventListener('orientationchange', setHeroScale);

  // 2) HEADER: publicar su altura
  function setHeaderVar() {
    const header = document.querySelector('header');
    if (!header) return;
    const h = Math.ceil(header.getBoundingClientRect().height);
    root.style.setProperty('--header-h', h + 'px');
  }

  let resizeTimer = null;
  function onResize() {
    setHeroScale();
    setHeaderVar();
  }
  window.addEventListener('load', onResize);
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 120);
  });

  // 3) Skip link
  function wireSkipLink() {
    const skip = document.querySelector('.skip-link');
    const main = document.getElementById('contenido');
    if (!skip || !main) return;
    skip.addEventListener('click', () => {
      setTimeout(() => { main.focus(); }, 0);
    });
  }
  document.addEventListener('DOMContentLoaded', wireSkipLink);

  // 4) scroll-margin-top para anclas
  function addScrollMarginToAnchors() {
    const anchors = document.querySelectorAll('section[id], h2[id], h3[id], main[id="contenido"]');
    anchors.forEach(el => {
      el.style.scrollMarginTop = 'calc(var(--header-h, 72px) + 12px)';
    });
  }
  document.addEventListener('DOMContentLoaded', addScrollMarginToAnchors);

  // 5) Inicialización
  setHeroScale();
  setHeaderVar();
})();

/* ===== Validación accesible del formulario + envío nativo (sin AJAX) ===== */
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const fields = {
    nombre: document.getElementById('nombre'),
    email: document.getElementById('email'),
    telefono: document.getElementById('telefono'),
    asunto: document.getElementById('asunto'),
    mensaje: document.getElementById('mensaje'),
    acepto: document.getElementById('acepto')
  };

  const errors = {
    nombre: document.getElementById('error-nombre'),
    email: document.getElementById('error-email'),
    telefono: document.getElementById('error-telefono'),
    asunto: document.getElementById('error-asunto'),
    mensaje: document.getElementById('error-mensaje'),
    acepto: document.getElementById('error-acepto')
  };

  const status = document.getElementById('form-status');

  function setError(input, msg) {
    input.setAttribute('aria-invalid', 'true');
    const id = input.id;
    if (errors[id]) errors[id].textContent = msg || '';
  }
  function clearError(input) {
    input.removeAttribute('aria-invalid');
    const id = input.id;
    if (errors[id]) errors[id].textContent = '';
  }

  function validateNombre() {
    const v = fields.nombre.value.trim();
    if (v.length < 2) { setError(fields.nombre, 'Ingresá al menos 2 caracteres.'); return false; }
    clearError(fields.nombre); return true;
  }
  function validateEmail() {
    const v = fields.email.value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!ok) { setError(fields.email, 'Ingresá un correo válido.'); return false; }
    clearError(fields.email); return true;
  }
  function validateTelefono() {
    const v = fields.telefono.value.trim();
    if (v && !/^[0-9+\-\s()]{6,20}$/.test(v)) {
      setError(fields.telefono, 'Usá solo números, espacios, +, -, ().'); return false;
    }
    clearError(fields.telefono); return true;
  }
  function validateAsunto() {
    if (!fields.asunto.value) { setError(fields.asunto, 'Elegí un asunto.'); return false; }
    clearError(fields.asunto); return true;
  }
  function validateMensaje() {
    const v = fields.mensaje.value.trim();
    if (v.length < 10) { setError(fields.mensaje, 'Contanos un poco más (mínimo 10 caracteres).'); return false; }
    clearError(fields.mensaje); return true;
  }
  function validateAcepto() {
    if (!fields.acepto.checked) { setError(fields.acepto, 'Debés aceptar para continuar.'); return false; }
    clearError(fields.acepto); return true;
  }

  // Validación en vivo
  fields.nombre.addEventListener('input', validateNombre);
  fields.email.addEventListener('input', validateEmail);
  fields.telefono.addEventListener('input', validateTelefono);
  fields.asunto.addEventListener('change', validateAsunto);
  fields.mensaje.addEventListener('input', validateMensaje);
  fields.acepto.addEventListener('change', validateAcepto);

  // Envío nativo (sin fetch): si valida, dejamos que el navegador haga el POST
  form.addEventListener('submit', (e) => {
    const validators = [
      validateNombre, validateEmail, validateTelefono,
      validateAsunto, validateMensaje, validateAcepto
    ];

    let firstInvalid = null;
    let ok = true;

    validators.forEach(fn => {
      const valid = fn();
      if (!valid && !firstInvalid) {
        firstInvalid = document.querySelector('[aria-invalid="true"]');
        ok = false;
      }
    });

    if (!ok) {
      e.preventDefault();
      status.textContent = 'Revisá los campos marcados en rojo.';
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Importante: NO hacemos preventDefault si todo está OK.
    // El navegador enviará el formulario a Formspree y se verá su página de “Gracias”.
    status.textContent = 'Enviando...';
  });

  // (Dejamos el modal por si en el futuro volvemos a AJAX)
  function openConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;

    const prev = document.activeElement;
    modal.hidden = false;

    const focusables = modal.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    (first || modal).focus();

    const btnClose = modal.querySelector('#modal-close');
    function close() {
      modal.hidden = true;
      if (prev && typeof prev.focus === 'function') prev.focus();
      modal.removeEventListener('keydown', onKeyDown);
      modal.removeEventListener('click', onBackdrop);
      btnClose?.removeEventListener('click', close);
    }
    function onKeyDown(ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); close(); }
      if (ev.key === 'Tab' && focusables.length) {
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      }
    }
    function onBackdrop(ev) {
      if (ev.target === modal) close();
    }

    btnClose?.addEventListener('click', close);
    modal.addEventListener('keydown', onKeyDown);
    modal.addEventListener('click', onBackdrop);
  }
})();
