/* ============================================================
   周至猕猴桃 · 3D 剖面交互
   一颗带绒毛的猕猴桃：拖动旋转，点击切开。
   ============================================================ */

const stage      = document.querySelector('.stage3d');
const canvas     = document.getElementById('kiwiCanvas');
const fallbackEl = document.getElementById('stageFallback');
const cutBtn     = document.getElementById('cutBtn');
const cutBtnText = document.getElementById('cutBtnText');
const parts      = Array.from(document.querySelectorAll('.part'));

const params = new URLSearchParams(location.search);
const SHOT = params.has('shot');
const START_OPEN = params.get('cut') === '1';
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!stage || !canvas) {
  // 没有舞台就直接退出
} else {
  run();
}

function fail(reason) {
  console.warn('[kiwi3d]', reason);
  if (fallbackEl) fallbackEl.hidden = false;
  if (canvas) canvas.style.display = 'none';
  const hint = document.getElementById('stageHint');
  if (hint) hint.style.display = 'none';
  if (cutBtn) cutBtn.disabled = true;
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

async function run() {
  if (!hasWebGL()) return fail('没有 WebGL');

  const THREE = window.THREE;
  if (!THREE) return fail('three.js 没加载上');

  /* ---------- 纹理 ---------- */
  function makeFuzzTexture(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');

    g.fillStyle = '#5E3D22';
    g.fillRect(0, 0, size, size);

    // 水平 wrap 辅助：跨左边界补画到右侧，反之亦然，保证球面 UV 接缝连续
    const atX = (x, w, fn) => {
      fn(x);
      if (x < w) fn(x + size);
      if (x > size - w) fn(x - size);
    };

    for (let i = 0; i < 300; i++) {
      const r = size * (0.02 + Math.random() * 0.1);
      const x = Math.random() * size;
      const y = Math.random() * size;
      g.globalAlpha = 0.09 + Math.random() * 0.14;
      g.fillStyle = Math.random() > 0.5 ? '#8B6039' : '#33200F';
      atX(x, r, (px) => {
        g.beginPath();
        g.arc(px, y, r, 0, Math.PI * 2);
        g.fill();
      });
    }

    // 绒毛
    g.lineCap = 'round';
    const count = Math.round((size * size) / 96);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const a = Math.random() * Math.PI * 2;
      const len = size * 0.0022 + Math.random() * size * 0.0075;
      g.globalAlpha = 0.08 + Math.random() * 0.3;
      g.strokeStyle = Math.random() > 0.4 ? '#DCBB8C' : '#2C1B0A';
      g.lineWidth = 0.5 + Math.random() * 1.35;
      atX(x, len + 2, (px) => {
        g.beginPath();
        g.moveTo(px, y);
        g.lineTo(px + Math.cos(a) * len, y + Math.sin(a) * len);
        g.stroke();
      });
    }

    // 细密噪点
    for (let i = 0; i < 26000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      g.globalAlpha = 0.03 + Math.random() * 0.1;
      g.fillStyle = Math.random() > 0.5 ? '#D8B98C' : '#2A1A0C';
      atX(x, 2, (px) => g.fillRect(px, y, 1.4, 1.4));
    }
    g.globalAlpha = 1;
    return c;
  }

  function makeFleshTexture(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const cx = size / 2, cy = size / 2, R = size / 2;

    g.fillStyle = '#6E4A2E';
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();

    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.96);
    grad.addColorStop(0.00, '#FBF8DC');
    grad.addColorStop(0.09, '#F2F1C4');
    grad.addColorStop(0.20, '#D8E39A');
    grad.addColorStop(0.38, '#B4CB5E');
    grad.addColorStop(0.66, '#8FB646');
    grad.addColorStop(1.00, '#749E35');
    g.fillStyle = grad;
    g.beginPath(); g.arc(cx, cy, R * 0.96, 0, Math.PI * 2); g.fill();

    // 切口边缘：果皮断面
    g.lineWidth = R * 0.05;
    g.strokeStyle = 'rgba(94,61,34,.9)';
    g.beginPath(); g.arc(cx, cy, R * 0.975, 0, Math.PI * 2); g.stroke();

    g.save();
    g.translate(cx, cy);
    for (let i = 0; i < 900; i++) {
      const a = Math.random() * Math.PI * 2;
      const r0 = R * (0.04 + Math.random() * 0.09);
      const r1 = R * (0.55 + Math.random() * 0.38);
      const bend = (Math.random() - 0.5) * 0.2;
      g.globalAlpha = 0.05 + Math.random() * 0.13;
      g.strokeStyle = Math.random() > 0.3 ? '#ffffff' : '#5E7F2C';
      g.lineWidth = R * 0.0015 + Math.random() * R * 0.0075;
      g.beginPath();
      g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      g.quadraticCurveTo(
        Math.cos(a + bend) * ((r0 + r1) / 2),
        Math.sin(a + bend) * ((r0 + r1) / 2),
        Math.cos(a) * r1, Math.sin(a) * r1
      );
      g.stroke();
    }
    g.restore();

    const seedCount = 118;
    for (let i = 0; i < seedCount; i++) {
      const a = (i / seedCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.05;
      const rr = R * (0.30 + Math.random() * 0.055);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      g.save();
      g.translate(x, y);
      g.rotate(a + Math.PI / 2 + (Math.random() - 0.5) * 0.3);
      g.globalAlpha = 0.9;
      g.fillStyle = 'rgba(60,40,20,.22)';
      g.beginPath(); g.ellipse(1.4, 2.4, R * 0.010, R * 0.019, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2B1F14';
      g.beginPath(); g.ellipse(0, 0, R * 0.0086, R * 0.0172, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.20)';
      g.beginPath(); g.ellipse(-R * 0.002, -R * 0.005, R * 0.0026, R * 0.0058, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }

    g.globalAlpha = 1;
    const glow = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.19);
    glow.addColorStop(0, 'rgba(255,255,235,.34)');
    glow.addColorStop(1, 'rgba(255,255,235,0)');
    g.fillStyle = glow;
    g.beginPath(); g.arc(cx, cy, R * 0.19, 0, Math.PI * 2); g.fill();

    const vig = g.createRadialGradient(cx, cy, R * 0.8, cx, cy, R);
    vig.addColorStop(0, 'rgba(58,38,18,0)');
    vig.addColorStop(1, 'rgba(58,38,18,.5)');
    g.fillStyle = vig;
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();

    return c;
  }

  /* ---------- 场景 ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  // 兼容 r149（encoding）与 r152+（colorSpace）
  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if (THREE.sRGBEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  const markSRGB = (tex) => {
    if (THREE.SRGBColorSpace && 'colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    return tex;
  };

  scene.add(new THREE.HemisphereLight(0xc8d8b4, 0x0e1a12, 0.62));

  const key = new THREE.DirectionalLight(0xfff2d6, 1.55);
  key.position.set(3.2, 4.2, 4.4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x93bb5c, 0.7);
  rim.position.set(-4.2, -1.4, -3.2);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffffff, 0.3);
  fill.position.set(-1, -3.4, 2.6);
  scene.add(fill);

  const fuzzCanvas = makeFuzzTexture(1024);
  const fuzzTex = markSRGB(new THREE.CanvasTexture(fuzzCanvas));
  fuzzTex.wrapS = fuzzTex.wrapT = THREE.RepeatWrapping;
  fuzzTex.repeat.set(1.7, 1);
  fuzzTex.anisotropy = 4;

  // 注意：不要给球体加 bumpMap —— UV 接缝处 dFdx 会炸，出现一条亮线
  const skinMat = new THREE.MeshStandardMaterial({
    map: fuzzTex,
    roughness: 1,
    metalness: 0
  });

  const fleshTex = markSRGB(new THREE.CanvasTexture(makeFleshTexture(1024)));
  fleshTex.anisotropy = 4;

  const fleshMat = new THREE.MeshPhysicalMaterial({
    map: fleshTex,
    emissive: 0xffffff,
    emissiveMap: fleshTex,
    emissiveIntensity: 0.05,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.35,
    side: THREE.DoubleSide
  });

  const R = 1;
  const shellGeoBack = new THREE.SphereGeometry(R, 96, 72, Math.PI, Math.PI);  // z < 0
  const shellGeoFront = new THREE.SphereGeometry(R, 96, 72, 0, Math.PI);      // z > 0
  const discGeo = new THREE.CircleGeometry(R * 1.02, 96);

  const backHalf = new THREE.Group();
  backHalf.add(new THREE.Mesh(shellGeoBack, skinMat));
  backHalf.add(new THREE.Mesh(discGeo, fleshMat));

  const frontHalf = new THREE.Group();
  frontHalf.add(new THREE.Mesh(shellGeoFront, skinMat));
  const frontDisc = new THREE.Mesh(discGeo, fleshMat);
  frontDisc.position.z = 0.002;
  frontHalf.add(frontDisc);

  const kiwi = new THREE.Group();
  kiwi.add(backHalf, frontHalf);
  kiwi.scale.set(1.34, 0.83, 0.86);
  scene.add(kiwi);

  /* ---------- 状态 ---------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));

  let rotX = 0.24, rotY = -0.42;
  let tRotX = 0.24, tRotY = -0.42;
  let vel = 0;
  let dragging = false;
  let moved = false;
  let lastX = 0, lastY = 0, downAt = 0, downX = 0, downY = 0;
  let open = START_OPEN ? 1 : 0;
  let openTarget = START_OPEN ? 1 : 0;
  let idleAt = 0;
  let autoSpin = !reduce;

  function syncParts() {
    parts.forEach((p, i) => {
      if (openTarget > 0.5) {
        setTimeout(() => p.classList.add('is-on'), reduce ? 0 : 220 + i * 130);
      } else {
        p.classList.remove('is-on');
      }
    });
  }

  function setOpen(v) {
    openTarget = v ? 1 : 0;
    if (v) {
      tRotX = 0.05; tRotY = 0;
      vel = 0;
    }
    idleAt = performance.now();
    if (cutBtnText) cutBtnText.textContent = v ? '合上' : '切开';
    if (cutBtn) cutBtn.classList.toggle('is-open', !!v);
    if (stage) stage.dataset.open = v ? '1' : '0';
    syncParts();
  }

  if (START_OPEN) {
    setOpen(true);
  }

  cutBtn && cutBtn.addEventListener('click', () => setOpen(openTarget < 0.5));

  /* ---------- 拖动 ---------- */
  function onDown(e) {
    dragging = true;
    moved = false;
    lastX = downX = e.clientX;
    lastY = downY = e.clientY;
    downAt = performance.now();
    vel = 0;
    if (stage) stage.classList.add('is-touched');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  }

  function onMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) moved = true;
    tRotY += dx * 0.0075;
    tRotX = clamp(tRotX + dy * 0.0055, -1.0, 1.0);
    vel = dx * 0.0075;
    idleAt = performance.now();
  }

  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    const quick = performance.now() - downAt < 420;
    if (!moved && quick) setOpen(openTarget < 0.5);
    idleAt = performance.now();
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', (e) => { if (dragging) onUp(e); });

  if (reduce) autoSpin = false;

  /* ---------- resize ---------- */
  function resize() {
    const rect = stage.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize', resize);

  /* ---------- loop ---------- */
  let visible = true;
  let running = false;
  let last = performance.now();

  function update(dt) {
    if (!dragging) {
      if (Math.abs(vel) > 0.00002) {
        tRotY += vel;
        vel *= Math.pow(0.92, dt * 60);
      } else {
        vel = 0;
      }
      if (autoSpin && openTarget < 0.5 && performance.now() - idleAt > 2600) {
        tRotY += dt * 0.16;
      }
    }
    rotX = damp(rotX, tRotX, 7.5, dt);
    rotY = damp(rotY, tRotY, 7.5, dt);
    kiwi.rotation.x = rotX;
    kiwi.rotation.y = rotY;

    const speed = reduce ? 30 : 5.2;
    open = damp(open, openTarget, speed, dt);

    const sep = 1.03 * open;
    backHalf.position.x = -sep;
    backHalf.rotation.y = -0.24 * open;
    frontHalf.position.x = sep;
    frontHalf.rotation.y = (Math.PI + 0.24) * open;
    frontHalf.position.z = 0;

    // 切开后整体缩小，两片才装得进画面
    const s = 1 - open * 0.38;
    kiwi.scale.set(1.34 * s, 0.83 * s, 0.86 * s);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        visible = en.isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      });
    }, { threshold: 0.05 }).observe(stage);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) start();
  });

  start();

  // 首帧渲染一帧，避免空白
  update(0.016);
  renderer.render(scene, camera);

  if (SHOT) {
    // 静态截图：把动画直接推到终态
    open = openTarget;
    if (START_OPEN) {
      rotX = tRotX = 0.05;
      rotY = tRotY = 0;
    }
    update(0.016);
    kiwi.rotation.x = rotX;
    kiwi.rotation.y = rotY;
    renderer.render(scene, camera);
  }
}
