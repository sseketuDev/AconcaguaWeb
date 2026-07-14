/**
 * main.js — Aconcagua Webs
 * 1. Nav: fondo al hacer scroll
 * 2. Hamburger móvil
 * 3. Smooth scroll con offset para nav fijo
 * 4. Scroll reveal (IntersectionObserver)
 * 5. Slider horizontal de proyectos
 *    — Detección automática PC / Móvil vía matchMedia
 *    — Drag (mouse + touch nativo)
 *    — Flechas Prev / Next
 *    — Dots de navegación activos
 *    — Soporte de teclado ← →
 */

/* ── UTILIDAD: acceso seguro al DOM ─────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ═══════════════════════════════════════════════════════════════════════
   1. NAV — FONDO AL SCROLL
═══════════════════════════════════════════════════════════════════════ */
const nav = $('#nav');

if (nav) {
    const updateNav = () => {
        nav.classList.toggle('is-scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
}

/* ═══════════════════════════════════════════════════════════════════════
   2. HAMBURGER MÓVIL
═══════════════════════════════════════════════════════════════════════ */
const navToggle = $('#nav-toggle');
const mobileNav = $('#mobile-nav');

if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
        const open = mobileNav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.innerHTML = open
            ? '<i class="fas fa-times" aria-hidden="true"></i>'
            : '<i class="fas fa-bars"  aria-hidden="true"></i>';
    });

    $$('a', mobileNav).forEach(a => {
        a.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
        });
    });
}

/* ═══════════════════════════════════════════════════════════════════════
   3. SMOOTH SCROLL (offset por el nav fijo)
═══════════════════════════════════════════════════════════════════════ */
$$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id === '#') return;
        const target = $(id);
        if (target) {
            e.preventDefault();
            window.scrollTo({
                top: target.offsetTop - (parseInt(getComputedStyle(document.documentElement)
                    .getPropertyValue('--nav-h')) || 68),
                behavior: 'smooth',
            });
        }
    });
});

/* ═══════════════════════════════════════════════════════════════════════
   4. SCROLL REVEAL
═══════════════════════════════════════════════════════════════════════ */
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObs = new IntersectionObserver(
        entries => entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                revealObs.unobserve(e.target);
            }
        }),
        { threshold: 0.1 }
    );
    $$('.reveal').forEach(el => revealObs.observe(el));
} else {
    /* Sin animaciones: hacer todo visible de inmediato */
    $$('.reveal').forEach(el => el.classList.add('visible'));
}

/* ═══════════════════════════════════════════════════════════════════════
   5. SLIDER HORIZONTAL DE PROYECTOS
═══════════════════════════════════════════════════════════════════════ */
(function initSlider() {
    const track     = $('#slider-track');
    const prevBtn   = $('#slider-prev');
    const nextBtn   = $('#slider-next');
    const dotsWrap  = $('#slider-dots');

    if (!track) return;

    const slides = $$('.slide', track);
    if (!slides.length) return;

    /* ── DETECCIÓN DE DISPOSITIVO ─────────────────────────────────────
       ≥769 px → captura escritorio (data-pc)
       ≤768 px → captura móvil     (data-movil)                       */
    const mqMobile = window.matchMedia('(max-width: 768px)');

    function setImages() {
        const isMobile = mqMobile.matches;
        slides.forEach(slide => {
            const img = $('.project-img', slide);
            if (!img) return;
            const src = isMobile
                ? (img.dataset.movil || img.dataset.pc || '')
                : (img.dataset.pc   || img.dataset.movil || '');
            /* Solo actualizar si el src cambia (evita re-descarga) */
            if (src && img.getAttribute('src') !== src) img.src = src;
        });
    }

    /* Re-evaluar al cambiar tamaño */
    mqMobile.addEventListener('change', setImages);

    /* ── DOTS ─────────────────────────────────────────────────────────── */
    if (dotsWrap) {
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className   = 'slider-dot';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Proyecto ${i + 1}`);
            dot.addEventListener('click', () => scrollToSlide(i));
            dotsWrap.appendChild(dot);
        });
    }

    function getDots() {
        return dotsWrap ? $$('.slider-dot', dotsWrap) : [];
    }

    function setActiveDot(index) {
        getDots().forEach((d, i) => {
            d.classList.toggle('active', i === index);
            d.setAttribute('aria-selected', String(i === index));
        });
    }

    /* ── SCROLL A SLIDE ─────────────────────────────────────────────── */
    function scrollToSlide(index) {
        const slide = slides[index];
        if (!slide) return;
        /* scrollIntoView con inline: 'center' respeta scroll-snap */
        slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    /* Índice actual basado en posición de scroll */
    let currentIndex = 0;

    function findCurrentIndex() {
        const center = track.scrollLeft + track.clientWidth / 2;
        let closest = 0, minDist = Infinity;
        slides.forEach((s, i) => {
            const sc = s.offsetLeft + s.offsetWidth / 2;
            const d  = Math.abs(sc - center);
            if (d < minDist) { minDist = d; closest = i; }
        });
        return closest;
    }

    /* Observador de intersección para activar dot y botones */
    const slideObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting && e.intersectionRatio >= 0.5) {
                currentIndex = slides.indexOf(e.target);
                setActiveDot(currentIndex);
                if (prevBtn) prevBtn.disabled = currentIndex === 0;
                if (nextBtn) nextBtn.disabled = currentIndex === slides.length - 1;
            }
        });
    }, { root: track, threshold: 0.5 });

    slides.forEach(s => slideObs.observe(s));

    /* ── FLECHAS ────────────────────────────────────────────────────── */
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const i = findCurrentIndex();
            if (i > 0) scrollToSlide(i - 1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const i = findCurrentIndex();
            if (i < slides.length - 1) scrollToSlide(i + 1);
        });
    }

    /* ── TECLADO ────────────────────────────────────────────────────── */
    track.setAttribute('tabindex', '0');
    track.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollToSlide(Math.max(0, findCurrentIndex() - 1));
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollToSlide(Math.min(slides.length - 1, findCurrentIndex() + 1));
        }
    });

    /* ── DRAG CON MOUSE ──────────────────────────────────────────────
       Activa drag solo si el movimiento supera el umbral,
       para no bloquear clicks normales en links o botones.            */
    let isDragging  = false;
    let startX      = 0;
    let startScroll = 0;
    let moved       = false;
    const DRAG_THRESHOLD = 6;  /* px mínimos de movimiento */

    track.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        isDragging  = false;
        moved       = false;
        startX      = e.pageX;
        startScroll = track.scrollLeft;
    });

    document.addEventListener('mousemove', e => {
        if (startX === null) return;
        const dx = e.pageX - startX;
        if (!moved && Math.abs(dx) > DRAG_THRESHOLD) {
            moved = true;
            isDragging = true;
            track.classList.add('is-dragging');
        }
        if (isDragging) {
            e.preventDefault();
            track.scrollLeft = startScroll - dx;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            track.classList.remove('is-dragging');
            /* Pequeño retraso para evitar que el mouseup active links */
            setTimeout(() => { isDragging = false; startX = null; }, 50);
        } else {
            startX = null;
        }
    });

    /* Bloquear click en links si hubo drag */
    track.addEventListener('click', e => {
        if (moved) {
            e.preventDefault();
            e.stopPropagation();
            moved = false;
        }
    }, true);

    /* ── TOUCH — el scroll nativo ya funciona con scroll-snap ─────────
       Solo necesitamos actualizar el dot al terminar el touch.        */
    track.addEventListener('touchend', () => {
        /* Pequeño retraso para que el snap termine antes de actualizar */
        setTimeout(() => {
            const i = findCurrentIndex();
            setActiveDot(i);
            if (prevBtn) prevBtn.disabled = i === 0;
            if (nextBtn) nextBtn.disabled = i === slides.length - 1;
        }, 120);
    }, { passive: true });

    /* ── INICIALIZACIÓN ─────────────────────────────────────────────── */
    setImages();
    setActiveDot(0);
    if (prevBtn) prevBtn.disabled = true;

})();
