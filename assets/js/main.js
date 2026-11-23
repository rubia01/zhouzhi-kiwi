/* ============================================================
   周至猕猴桃 · 交互
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SHOT = /[?&]shot\b/.test(location.search);

  /* ---------------- loader ---------------- */
  const loader = $('#loader');
  document.body.classList.add('is-locked');
  if (SHOT) {
    document.body.classList.add('is-shot');
    if (loader) loader.remove();
  }

  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    if (loader) {
      loader.classList.add('is-done');
      setTimeout(() => loader.remove(), 900);
    }
    document.body.classList.remove('is-locked');
    requestAnimationFrame(() => {
      initReveal();
      if (SHOT) runCounters();
    });
  }
  if (SHOT) {
    boot();
    const yp = new URLSearchParams(location.search).get('y');
    if (yp) {
      const jump = () => window.scrollTo(0, parseInt(yp, 10) || 0);
      jump();
      setTimeout(jump, 60);
      setTimeout(jump, 400);
    }
  } else {
    window.addEventListener('load', () => setTimeout(boot, 620));
    setTimeout(boot, 2600);
  }

  /* ---------------- nav ---------------- */
  const nav = $('#nav');
  const toTop = $('#toTop');
  const progress = $('#scrollProgress');
  const heroBg = $('#heroBg');

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;

      nav.classList.toggle('is-stuck', y > 40);
      toTop.classList.toggle('is-on', y > 700);
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';

      if (heroBg && !reduce && y < window.innerHeight * 1.4) {
        heroBg.style.transform = 'translateY(' + y * 0.26 + 'px)';
      }
      updateTimeline();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------------- reveal ---------------- */
  function initReveal() {
    const items = $$('[data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-in'));
      runCounters();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    items.forEach(el => io.observe(el));

    // counters
    const counters = $$('[data-count]');
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          countUp(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => cio.observe(el));
  }

  const counted = new WeakSet();
  function runCounters() { $$('[data-count]').forEach(countUp); }

  function countUp(el) {
    if (counted.has(el)) return;
    counted.add(el);
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0', 10);
    const final = dec ? target.toFixed(dec) : String(target);
    if (reduce || SHOT) { el.textContent = final; return; }
    const dur = 1500;
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const v = target * e;
      el.textContent = dec ? v.toFixed(dec) : String(Math.round(v));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = final;
    }
    requestAnimationFrame(tick);
  }

  /* ---------------- mobile menu ---------------- */
  const burger = $('#burger');
  const menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.innerHTML = $$('.nav__links a').map((a, i) => {
    return '<a href="' + a.getAttribute('href') + '"><i>0' + (i + 1) + '</i>' + a.textContent.replace(/^\d+/, '') + '</a>';
  }).join('');
  document.body.appendChild(menu);

  function toggleMenu(force) {
    const open = force !== undefined ? force : !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  }
  burger.addEventListener('click', () => toggleMenu());
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------------- nav current ---------------- */
  const navAs = $$('.nav__links a');
  const secs = navAs.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && secs.length) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navAs.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => sio.observe(s));
  }

  /* ---------------- kiwi orb (variety) ---------------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const orbSvg = $('.vpanel__orb svg');

  function buildOrb() {
    if (!orbSvg) return;
    const rays = document.createElementNS(SVGNS, 'g');
    rays.setAttribute('class', 'rays');
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r1 = 21, r2 = 43 + (i % 3) * 4;
      const line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', (100 + Math.cos(a) * r1).toFixed(2));
      line.setAttribute('y1', (100 + Math.sin(a) * r1).toFixed(2));
      line.setAttribute('x2', (100 + Math.cos(a) * r2).toFixed(2));
      line.setAttribute('y2', (100 + Math.sin(a) * r2).toFixed(2));
      line.setAttribute('stroke', '#ffffff');
      line.setAttribute('stroke-width', i % 2 ? 0.8 : 1.5);
      line.setAttribute('opacity', i % 2 ? 0.12 : 0.2);
      rays.appendChild(line);
    }
    orbSvg.insertBefore(rays, orbSvg.querySelector('.core'));

    // 外圈纤维（从籽环到果皮）
    const fibres = document.createElementNS(SVGNS, 'g');
    fibres.setAttribute('class', 'fibres');
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2 + 0.03;
      const r1 = 52, r2 = 86;
      const line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', (100 + Math.cos(a) * r1).toFixed(2));
      line.setAttribute('y1', (100 + Math.sin(a) * r1).toFixed(2));
      line.setAttribute('x2', (100 + Math.cos(a) * r2).toFixed(2));
      line.setAttribute('y2', (100 + Math.sin(a) * r2).toFixed(2));
      line.setAttribute('stroke', '#ffffff');
      line.setAttribute('stroke-width', 0.9);
      line.setAttribute('opacity', i % 2 ? 0.07 : 0.13);
      fibres.appendChild(line);
    }
    orbSvg.insertBefore(fibres, orbSvg.querySelector('.core'));

    const seeds = orbSvg.querySelector('.seeds');
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + 0.08;
      const r = 45 + (i % 2) * 4;
      const cx = 100 + Math.cos(a) * r;
      const cy = 100 + Math.sin(a) * r;
      const el = document.createElementNS(SVGNS, 'ellipse');
      el.setAttribute('cx', cx.toFixed(2));
      el.setAttribute('cy', cy.toFixed(2));
      el.setAttribute('rx', 2.05);
      el.setAttribute('ry', 3.4);
      el.setAttribute('transform', 'rotate(' + ((a * 180) / Math.PI + 90).toFixed(2) + ' ' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ')');
      seeds.appendChild(el);
    }
  }
  buildOrb();

  /* ---------------- variety data ---------------- */
  const V = [
    {
      name: '翠香', en: 'CUI XIANG', tag: '周至自主培育 · 绿心 · 早熟',
      desc: '果肉翠绿，切开是清亮的一汪绿。入口是浓甜，尾调带一点清冽的花香，不腻、不闷，放软了尤其好。九月中下旬就能开园，是每年第一口秋天。',
      time: '9 月上—中旬', brix: '18—20°', size: '80—100 g', flesh: '翠绿',
      color: '#8FBE52', glow: 'rgba(143,190,82,.30)', bars: [92, 76, 58]
    },
    {
      name: '徐香', en: 'XU XIANG', tag: '绿心 · 浓香 · 中熟',
      desc: '切开是黄绿，香气最冲。甜里带一丝清酸，越放越香，是很多人心里的「标准猕猴桃味」。十月上旬开始摘，放得住。',
      time: '10 月上—中旬', brix: '16—18°', size: '90—110 g', flesh: '黄绿',
      color: '#A9BC4E', glow: 'rgba(169,188,78,.30)', bars: [84, 94, 72]
    },
    {
      name: '秦美', en: 'QIN MEI', tag: '绿心 · 大果 · 晚熟',
      desc: '果子大、肉厚、汁水足。酸甜的劲道比前两个更猛，配油腻的东西特别清爽。十月中下旬下树，是关中人吃了三十年的老味道。',
      time: '10 月中—下旬', brix: '15—17°', size: '100—130 g', flesh: '明绿',
      color: '#6E9C3C', glow: 'rgba(110,156,60,.28)', bars: [74, 68, 80]
    },
    {
      name: '海沃德', en: 'HAYWARD', tag: '经典绿心 · 耐贮 · 晚熟',
      desc: '全世界种得最多的那个品种，也是最能走的。皮厚、肉紧、耐贮耐运，放到冬天还是脆生生的绿。甜得克制，酸得干净。',
      time: '10 月下—11 月初', brix: '13—15°', size: '90—120 g', flesh: '浅绿',
      color: '#8FA375', glow: 'rgba(143,163,117,.28)', bars: [66, 60, 96]
    },
    {
      name: '瑞玉', en: 'RUI YU', tag: '周至自主培育 · 绿心 · 新品',
      desc: '周至自己育出来的新优品种。果心细密、籽少，切开几乎是一整块果肉。甜度往上走，酸度收着，适合第一次吃猕猴桃的人。',
      time: '9 月下—10 月初', brix: '17—19°', size: '85—105 g', flesh: '嫩绿',
      color: '#B4CE63', glow: 'rgba(180,206,99,.32)', bars: [88, 70, 64]
    }
  ];

  const panel = $('#vpanel');
  const elName = $('#vName'), elEn = $('#vEn'), elTag = $('#vTag'), elDesc = $('#vDesc');
  const elTime = $('#vTime'), elBrix = $('#vBrix'), elSize = $('#vSize'), elFlesh = $('#vFlesh');
  const bars = $$('.vbar i');

  function paint(i) {
    const d = V[i];
    if (!d) return;
    panel.style.setProperty('--vf', d.color);
    panel.style.setProperty('--glow', d.glow);
    elName.textContent = d.name;
    elEn.textContent = d.en;
    elTag.textContent = d.tag;
    elDesc.textContent = d.desc;
    elTime.textContent = d.time;
    elBrix.textContent = d.brix;
    elSize.textContent = d.size;
    elFlesh.textContent = d.flesh;
    bars.forEach((b, k) => {
      b.style.animation = 'none';
      b.style.setProperty('--w', d.bars[k] + '%');
      void b.offsetWidth;
      b.style.animation = '';
    });
  }

  $$('.vlist__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      $$('.vlist__btn').forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      const i = parseInt(btn.dataset.v, 10);
      panel.classList.add('is-swap');
      setTimeout(() => {
        paint(i);
        panel.classList.remove('is-swap');
      }, reduce ? 0 : 180);
    });
  });

  // 深链：?v=2 直接定位到某个品种
  const vParam = new URLSearchParams(location.search).get('v');
  if (vParam !== null) {
    const btn = $('.vlist__btn[data-v="' + parseInt(vParam, 10) + '"]');
    if (btn) {
      $$('.vlist__btn').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      paint(parseInt(vParam, 10));
    }
  }

  /* ---------------- timeline ---------------- */
  const timeline = $('#timeline');
  const tls = $$('.tl');
  function updateTimeline() {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const anchor = vh * 0.62;
    const passed = Math.min(Math.max(anchor - r.top, 0), r.height);
    timeline.style.setProperty('--progress', (passed / r.height) * 100 + '%');

    tls.forEach(li => {
      const lr = li.getBoundingClientRect();
      li.classList.toggle('is-on', lr.top + 30 < anchor);
    });
  }
  updateTimeline();

  /* ---------------- initial ---------------- */
  onScroll();
})();
