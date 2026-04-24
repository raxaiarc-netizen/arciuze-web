/* arciuze landing — interactions
   - scroll reveals via IntersectionObserver
   - stat count-up on reveal
   - REC · NO number scramble (decodes hero metadata)
   - ticket tilt on pointer move
   - signal-card light-tracking (updates CSS variables)
   - waitlist form stub
   ---------------------------------------------------- */

(() => {
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Reveal observer ------------------- */
  const revealIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealIO.unobserve(entry.target);
      }
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  for (const el of document.querySelectorAll('[data-reveal]')) {
    revealIO.observe(el);
  }

  /* per-item stagger for cities row */
  document.querySelectorAll('.cities__list .city').forEach((el, i) => {
    el.style.setProperty('--city-i', i);
  });

  /* ---------- 2. Stat count-up -------------------- */
  const countObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      const target = parseFloat(el.dataset.countTo);
      if (Number.isNaN(target)) { countObserver.unobserve(el); continue; }
      const duration = 1300;
      const start = performance.now();
      const from = 0;
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutExpo
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        const value = from + (target - from) * eased;
        el.textContent = Number.isInteger(target) ? Math.round(value) : value.toFixed(1);
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target;
      };
      requestAnimationFrame(step);
      countObserver.unobserve(el);
    }
  }, { threshold: 0.4 });
  for (const el of document.querySelectorAll('[data-count-to]')) countObserver.observe(el);

  /* ---------- 3. Number scramble (REC · NO) ------- */
  const scrambleEls = document.querySelectorAll('.num-scramble');
  const glyphs = '0123456789';
  const scramble = (el) => {
    const target = (el.dataset.target || el.textContent).toString();
    const total = 900;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / total);
      let out = '';
      for (let i = 0; i < target.length; i++) {
        const char = target[i];
        const revealAt = (i + 1) / target.length;
        if (t >= revealAt) out += char;
        else out += glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      el.textContent = out;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
  };

  const scrambleIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        scramble(entry.target);
        scrambleIO.unobserve(entry.target);
      }
    }
  }, { threshold: 0.6 });
  scrambleEls.forEach(el => scrambleIO.observe(el));

  /* ---------- 4. Ticket tilt ---------------------- */
  if (!prefersReducedMotion) {
    const ticket = document.querySelector('.ticket[data-tilt]');
    if (ticket) {
      let raf = 0;
      let targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;

      const onMove = (e) => {
        const r = ticket.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        // y rotate follows x, x rotate follows y
        targetRY = (px - 0.5) * 12;
        targetRX = -(py - 0.5) * 10;
        if (!raf) raf = requestAnimationFrame(loop);
      };
      const onLeave = () => {
        targetRX = 0; targetRY = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      };
      const loop = () => {
        curRX += (targetRX - curRX) * 0.12;
        curRY += (targetRY - curRY) * 0.12;
        ticket.style.transform =
          `perspective(1400px) rotateX(${curRX.toFixed(2)}deg) rotateY(${curRY.toFixed(2)}deg) translateZ(0)`;
        if (Math.abs(curRX - targetRX) > 0.02 || Math.abs(curRY - targetRY) > 0.02) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = 0;
        }
      };

      ticket.addEventListener('pointermove', onMove);
      ticket.addEventListener('pointerleave', onLeave);

      /* idle gentle sway */
      let t0 = performance.now();
      const idle = (t) => {
        if (raf) return requestAnimationFrame(idle);
        const elapsed = (t - t0) / 1000;
        const x = Math.sin(elapsed * 0.6) * 1.4;
        const y = Math.cos(elapsed * 0.45) * 1.8;
        ticket.style.transform = `perspective(1400px) rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
        requestAnimationFrame(idle);
      };
      requestAnimationFrame(idle);
    }
  }

  /* ---------- 5. Signal pointer glow -------------- */
  document.querySelectorAll('.signal').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
    });
  });

  /* ---------- 6. Nav scroll state (subtle) -------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    let scrolled = false;
    const onScroll = () => {
      const s = window.scrollY > 12;
      if (s !== scrolled) {
        scrolled = s;
        nav.classList.toggle('is-scrolled', s);
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 7. Smooth anchor scrolling ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: y, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- 8. Waitlist submission -------------- */
  window.__arciuzeSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = form.querySelector('.btn--primary');
    const label = form.querySelector('.form__cta-label');
    const orig = label.textContent;
    label.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      label.textContent = 'On the list ✓';
      btn.style.background = 'var(--green, #34C759)';
      form.querySelectorAll('.form__input').forEach(i => i.disabled = true);
      setTimeout(() => {
        label.textContent = orig;
        btn.disabled = false;
        btn.style.background = '';
        form.reset();
        form.querySelectorAll('.form__input').forEach(i => i.disabled = false);
      }, 3200);
    }, 900);
    return false;
  };
})();
