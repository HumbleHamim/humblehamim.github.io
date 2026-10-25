document.getElementById('yr').textContent = new Date().getFullYear();

/* Pixel grid: squares light up green near the cursor, then fade */
(function(){
  var c = document.getElementById('grid'), ctx = c.getContext('2d');
  var S = 22, cells = {}, w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function size(){
    var r = c.parentElement.getBoundingClientRect();
    w = r.width; h = r.height;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle = 'rgba(155,163,159,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x <= w; x += S){ ctx.moveTo(x+.5,0); ctx.lineTo(x+.5,h); }
    for (var y = 0; y <= h; y += S){ ctx.moveTo(0,y+.5); ctx.lineTo(w,y+.5); }
    ctx.stroke();
    var any = false;
    for (var k in cells){
      var a = cells[k].a, p = k.split(',');
      ctx.fillStyle = 'rgba(111,207,151,' + (a * 0.45).toFixed(3) + ')';
      ctx.fillRect(p[0]*S+1, p[1]*S+1, S-1, S-1);
      cells[k].a -= 0.018;
      if (cells[k].a <= 0) delete cells[k]; else any = true;
    }
    if (any && !still) requestAnimationFrame(draw);
  }
  function light(e){
    if (still) return;
    var r = c.getBoundingClientRect();
    var t = e.touches ? e.touches[0] : e;
    var cx = Math.floor((t.clientX - r.left) / S), cy = Math.floor((t.clientY - r.top) / S);
    for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++){
      var k = (cx+dx) + ',' + (cy+dy);
      cells[k] = { a: (dx === 0 && dy === 0) ? 1 : 0.55 };
    }
    requestAnimationFrame(draw);
  }
  c.parentElement.addEventListener('mousemove', light);
  c.parentElement.addEventListener('touchmove', light, {passive:true});
  window.addEventListener('resize', size);
  size();
})();
