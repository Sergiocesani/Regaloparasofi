document.addEventListener("DOMContentLoaded", () => {
  const isLogin = document.body.classList.contains('login-body');
  const isCarta = document.body.classList.contains('carta-body');

  if (isLogin) {
    const form = document.getElementById("loginForm");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = document.getElementById("nombre").value.trim();
      const apodo  = document.getElementById("apodo").value.trim();
      const color  = document.getElementById("color").value;
      if (!nombre || !apodo) return;

      localStorage.setItem("nombre", nombre);
      localStorage.setItem("apodo", apodo);
      localStorage.setItem("color", color);

      window.location.href = "carta.html";
    });
  }

  if (isCarta) {
    const nombre = localStorage.getItem("nombre") || "Amor";
    const apodo  = localStorage.getItem("apodo")  || "";
    const color  = localStorage.getItem("color")  || "#ffeffa";
    const textoColor = esColorOscuro(color) ? "#ffffff" : "#111111";

    document.documentElement.style.setProperty('--bg', color);
    document.documentElement.style.setProperty('--fg', textoColor);

    const saludo = document.getElementById("saludo");
    if (saludo) saludo.textContent = `Hola ${nombre} 💖 ${apodo ? `(${apodo})` : ''}`;

    wireSobre();
    wireCarrusel();     // mantiene el carrusel actual
    wireGaara();        // 🔥 Gaara animado
  }
});

/* Utilidades */
function esColorOscuro(hexColor) {
  const r = parseInt(hexColor.slice(1,3), 16);
  const g = parseInt(hexColor.slice(3,5), 16);
  const b = parseInt(hexColor.slice(5,7), 16);
  const luminancia = 0.299*r + 0.587*g + 0.114*b;
  return luminancia < 140;
}

/* ===== Música al abrir el sobre (gesto directo) ===== */
let musicStarted = false;
function startMusicDirect() {
  const audio = document.getElementById('musicaFondo');
  if (!audio || musicStarted) return;

  audio.loop = true;
  audio.muted = false;
  audio.volume = 0.0;

  const p = audio.play();
  if (p && typeof p.then === 'function') {
    p.then(() => {
      musicStarted = true;
      const target = 0.7, step = 0.05;
      const iv = setInterval(() => {
        audio.volume = Math.min(target, audio.volume + step);
        if (audio.volume >= target) clearInterval(iv);
      }, 120);
    }).catch(() => {
      const resume = () => {
        document.removeEventListener('click', resume);
        document.removeEventListener('keydown', resume);
        startMusicDirect();
      };
      document.addEventListener('click', resume, { once: true });
      document.addEventListener('keydown', resume, { once: true });
    });
  }
}

/* Lógica del sobre (scroll OK y botón cerrar) */
function wireSobre() {
  const sobre  = document.getElementById('sobre');
  const toggle = document.getElementById('abrirCartaBtn');
  const cerrar = document.getElementById('cerrarCartaBtn');
  const papel  = document.getElementById('carta-papel');
  const papelInterior = document.querySelector('.papel-interior');
  const guia   = document.getElementById('guia');
  const galeria = document.getElementById('galeria'); // puede no existir

  if (!sobre || !toggle || !papel || !papelInterior) return;

  papelInterior.setAttribute('tabindex', '0');

  const abrir = () => {
    const isOpen = sobre.classList.toggle('abierta');
    toggle.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      startMusicDirect();
      setTimeout(() => { papelInterior.focus({ preventScroll: false }); }, 0);

      const dur = getComputedStyle(papel).transitionDuration;
      const ms = parseFloat(dur) * (dur.includes('ms') ? 1 : 1000) || 1200;
      setTimeout(() => {
        if (guia) { guia.classList.add('activa'); guia.setAttribute('aria-hidden', 'false'); }
        if (galeria) resaltarSecuencial(galeria.querySelectorAll('img'));
      }, ms + 150);
    } else {
      if (guia) { guia.classList.remove('activa'); guia.setAttribute('aria-hidden', 'true'); }
      if (galeria) galeria.querySelectorAll('img').forEach(img => img.classList.remove('destacar', 'pulso'));
    }
  };

  const cerrarCarta = () => {
    if (!sobre.classList.contains('abierta')) return;
    sobre.classList.remove('abierta');
    toggle.setAttribute('aria-expanded', 'false');
    if (guia) { guia.classList.remove('activa'); guia.setAttribute('aria-hidden', 'true'); }
  };

  toggle.addEventListener('click', abrir);
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });
  cerrar?.addEventListener('click', cerrarCarta);

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarCarta(); });

  window.addEventListener('keydown', (e) => {
    if (document.activeElement && papel.contains(document.activeElement)) {
      if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key)) {
        e.stopPropagation();
      }
    }
  }, true);
}

/* Resaltado secuencial (si existiera una mini galería) */
function resaltarSecuencial(nodes) {
  const fotos = Array.from(nodes);
  if (!fotos.length) return;

  let i = 0;
  const aplicar = () => {
    fotos.forEach(f => f.classList.remove('destacar', 'pulso'));
    const target = fotos[i % fotos.length];
    target.classList.add('destacar', 'pulso');
    i++;
  };
  aplicar();
  const interval = setInterval(aplicar, 2400);
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) clearInterval(interval);
}

/* =========================
   CARRUSEL + FONDO DINÁMICO
   ========================= */
function wireCarrusel() {
  const pageBg   = document.getElementById('pageBg');
  const lineaAmor = document.getElementById('lineaAmor');
  const slide    = document.getElementById('slide');
  const slideImg = document.getElementById('slideImg');
  const slideCap = document.getElementById('slideCap');
  const btnPrev  = document.getElementById('btnPrev');
  const btnNext  = document.getElementById('btnNext');

  if (!pageBg || !lineaAmor || !slide || !slideImg || !slideCap || !btnPrev || !btnNext) return;

  const fotos = Array.from(lineaAmor.querySelectorAll('img')).filter(img => !!img.getAttribute('src'));
  if (!fotos.length) return;

  const items = fotos.map((img, idx) => ({
    src: img.getAttribute('src'),
    alt: img.getAttribute('alt') || `Recuerdo ${idx + 1}`
  }));

  let index = 0;
  let expandAutoTimer = null;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AUTO_FULL_MS = 2200;
  const useAutoFull = !prefersReduced;

  function setBackground(src, mode) {
    pageBg.style.backgroundImage = `url("${src}")`;
    pageBg.classList.remove('bg-medium', 'bg-full');
    pageBg.classList.add(mode === 'full' ? 'bg-full' : 'bg-medium');
  }

  function dispatchSlideChange() {
    window.dispatchEvent(new CustomEvent('slidechange', { detail: { index } }));
  }

  function render() {
    const { src, alt } = items[index];
    slideImg.src = src;
    slideImg.alt = alt;
    slideCap.textContent = alt;
    setBackground(src, 'medium');
    dispatchSlideChange();
  }

  function goTo(newIndex, expandFull = useAutoFull) {
    index = (newIndex + items.length) % items.length;
    const { src, alt } = items[index];

    slideImg.src = src;
    slideImg.alt = alt;
    slideCap.textContent = alt;

    clearTimeout(expandAutoTimer);
    setBackground(src, expandFull ? 'full' : 'medium');

    if (expandFull && useAutoFull) {
      expandAutoTimer = setTimeout(() => { setBackground(src, 'medium'); }, AUTO_FULL_MS);
    }

    dispatchSlideChange();
  }

  const next = () => goTo(index + 1, true);
  const prev = () => goTo(index - 1, true);

  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  slide.addEventListener('click', () => {
    const isFull = pageBg.classList.contains('bg-full');
    setBackground(items[index].src, isFull ? 'medium' : 'full');
    clearTimeout(expandAutoTimer);
  });

  // Evitar que el carrusel robe flechas si estás en la carta
  window.addEventListener('keydown', (e) => {
    const papel = document.getElementById('carta-papel');
    if (document.activeElement && papel && papel.contains(document.activeElement)) {
      if (['ArrowLeft','ArrowRight'].includes(e.key)) {
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    }
  }, true);

  slide.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
  });

  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    const papel = document.getElementById('carta-papel');
    const enCarta = document.activeElement && papel && papel.contains(document.activeElement);
    if (tag === 'input' || tag === 'textarea' || enCarta) return;
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
  });

  render();
}

/* =========================
   GAARA animado (señala y hace jutsu)
   ========================= */
function wireGaara() {
  const gaara = document.querySelector('.gaara');
  const bubble = document.getElementById('gaaraBubble');
  if (!gaara || !bubble) return;

  const frases = [
    "¡Mirá esta!",
    "¡Qué momento!",
    "✨ Recuerdo épico",
    "💞 Amo esta",
    "🌀 ¡Jutsu de arena!"
  ];
  let f = 0;

  function hacerJutsu() {
    gaara.classList.add('jutsu');
    bubble.textContent = frases[f++ % frases.length];
    setTimeout(() => gaara.classList.remove('jutsu'), 600);
  }

  // Cada vez que cambia la diapositiva, Gaara reacciona
  window.addEventListener('slidechange', hacerJutsu);

  // También reaccioná cuando el usuario abre el sobre por primera vez
  const abrir = () => { hacerJutsu(); document.removeEventListener('click', abrir); };
  document.addEventListener('click', abrir, { once: true });
}
