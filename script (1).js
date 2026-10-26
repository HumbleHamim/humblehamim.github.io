function isLight() { return document.documentElement.dataset.theme === 'light'; }

/* 0. Day / night theme switch */
(function () {
  var b = document.getElementById('theme'), r = document.documentElement;
  function label() { b.setAttribute('aria-label', isLight() ? 'Switch to night theme' : 'Switch to day theme'); }
  label();
  b.addEventListener('click', function () {
    var t = isLight() ? 'dark' : 'light';
    r.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    label();
    dispatchEvent(new Event('themechange'));
  });
})();
var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
var mouse = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });

/* 1. Pixel grid: squares glow near cursor and twinkle on their own */
(function () {
  var c = document.getElementById('grid'), ctx = c.getContext('2d');
  var S = 22, cells = {}, w, h, dpr = Math.min(devicePixelRatio || 1, 2), run = false;
  function size() {
    var r = c.parentElement.getBoundingClientRect();
    w = r.width; h = r.height;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function draw() {
    run = false;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(155,163,159,0.10)';
    ctx.beginPath();
    for (var x = 0; x <= w; x += S) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); }
    for (var y = 0; y <= h; y += S) { ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); }
    ctx.stroke();
    var any = false;
    for (var k in cells) {
      var p = k.split(',');
      ctx.fillStyle = (isLight() ? 'rgba(31,122,78,' : 'rgba(111,207,151,') + (cells[k].a * 0.45).toFixed(3) + ')';
      ctx.fillRect(p[0] * S + 1, p[1] * S + 1, S - 1, S - 1);
      cells[k].a -= 0.016;
      if (cells[k].a <= 0) delete cells[k]; else any = true;
    }
    if (any && !still) { run = true; requestAnimationFrame(draw); }
  }
  function kick() { if (!run) { run = true; requestAnimationFrame(draw); } }
  function light(e) {
    if (still) return;
    var r = c.getBoundingClientRect(), t = e.touches ? e.touches[0] : e;
    var cx = Math.floor((t.clientX - r.left) / S), cy = Math.floor((t.clientY - r.top) / S);
    for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++)
      cells[(cx + dx) + ',' + (cy + dy)] = { a: (dx === 0 && dy === 0) ? 1 : 0.55 };
    kick();
  }
  c.parentElement.addEventListener('mousemove', light);
  c.parentElement.addEventListener('touchmove', light, { passive: true });
  if (!still) setInterval(function () {
    cells[Math.floor(Math.random() * (w / S)) + ',' + Math.floor(Math.random() * (h / S))] = { a: 0.7 };
    kick();
  }, 350);
  addEventListener('resize', size);
  size();
})();

/* 2. Pixel sprout: grows on load, sways, leans toward the cursor */
(function () {
  var c = document.getElementById('sprout'), x = c.getContext('2d');
  var P = 8, W = 24, H = 32, t0 = performance.now(), lean = 0;
  c.width = W * P; c.height = H * P;
  function px(gx, gy, col) { x.fillStyle = col; x.fillRect(gx * P, gy * P, P, P); }
  var leaves = [[7, -1], [11, 1], [15, -1], [19, 1]];
  var L1, L2;
  function frame(now) {
    var t = (now - t0) / 1000, g = still ? 1 : Math.min(1, t / 3.4);
    g = 1 - Math.pow(1 - g, 3);
    var r = c.getBoundingClientRect();
    var target = Math.max(-1, Math.min(1, (mouse.x - (r.left + r.width / 2)) / 500));
    lean += (target - lean) * 0.05;
    var sway = still ? 0 : Math.sin(t * 1.4);
    L1 = isLight() ? '#2f9e66' : '#6fcf97'; L2 = isLight() ? '#6fcf97' : '#a9ecc4';
    x.clearRect(0, 0, c.width, c.height);
    for (var i = 6; i <= 17; i++) { px(i, 30, '#4a524e'); px(i, 31, '#3a413e'); }
    for (i = 8; i <= 15; i++) px(i, 29, '#5b645f');
    var h = Math.round(g * 23), base = 28, cx = 11;
    function off(n) { var k = n / 23; return Math.round(k * k * (sway * 2.2 + lean * 5)); }
    for (i = 0; i < h; i++) { px(cx + off(i), base - i, '#2f6b4f'); px(cx + off(i) + 1, base - i, '#2f6b4f'); }
    leaves.forEach(function (L) {
      if (h < L[0] + 3) return;
      var s = Math.min(1, (h - L[0] - 2) / 5), n = Math.max(2, Math.round(s * 4));
      var ox = off(L[0]) + cx + (L[1] > 0 ? 2 : -1), y = base - L[0];
      for (var j = 0; j < n; j++) {
        px(ox + L[1] * j, y - (j > 1 ? 1 : 0), L1);
        if (j > 0) px(ox + L[1] * j, y - 1 - (j > 1 ? 1 : 0), L2);
      }
    });
    if (h > 20) {
      var tx = cx + off(h - 1), ty = base - h;
      px(tx, ty, L2); px(tx + 1, ty, L2); px(tx, ty - 1, L1); px(tx + 1, ty - 1, L1);
      px(tx - 1, ty + 1, L1); px(tx + 2, ty + 1, L1);
    }
    if (!still) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (still) addEventListener('themechange', function () { frame(performance.now()); });
})();

/* 3. Pixel cursor trail (mouse devices only) */
(function () {
  if (still || !matchMedia('(pointer:fine)').matches) return;
  var N = 7, sq = [], pos = [];
  for (var i = 0; i < N; i++) {
    var d = document.createElement('div');
    var s = Math.max(4, 12 - i * 1.2);
    d.className = 'tr' + (i === 0 ? ' head' : '');
    d.style.width = d.style.height = s + 'px';
    d.style.margin = (-s / 2) + 'px 0 0 ' + (-s / 2) + 'px';
    d.style.opacity = (1 - i / N).toFixed(2);
    document.body.appendChild(d); sq.push(d); pos.push({ x: mouse.x, y: mouse.y });
  }
  (function loop() {
    pos[0].x += (mouse.x - pos[0].x) * 0.5; pos[0].y += (mouse.y - pos[0].y) * 0.5;
    for (var i = 1; i < N; i++) { pos[i].x += (pos[i - 1].x - pos[i].x) * 0.35; pos[i].y += (pos[i - 1].y - pos[i].y) * 0.35; }
    for (i = 0; i < N; i++) sq[i].style.transform = 'translate(' + Math.round(pos[i].x / 4) * 4 + 'px,' + Math.round(pos[i].y / 4) * 4 + 'px)';
    requestAnimationFrame(loop);
  })();
  document.addEventListener('mouseover', function (e) {
    sq[0].classList.toggle('big', !!e.target.closest('a,button'));
  });
})();

/* 4. Headline word reveal, scroll progress, scroll reveal */
(function () {
  var h1 = document.querySelector('h1');
  h1.innerHTML = h1.textContent.split(' ').map(function (w, i) {
    return '<span class="w" style="animation-delay:' + (0.15 + i * 0.09) + 's">' + w + '</span>';
  }).join(' ');

  var bar = document.getElementById('bar');
  function prog() {
    var m = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (m > 0 ? scrollY / m : 0) + ')';
  }
  addEventListener('scroll', prog, { passive: true }); prog();

  if (still || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('section h2,.about p,.facts li,.card,.skills>div,.contact p,.links,h3.sub,.role').forEach(function (el, i) {
    el.classList.add('rv');
    el.style.transitionDelay = ((i % 3) * 90) + 'ms';
    io.observe(el);
  });
})();
