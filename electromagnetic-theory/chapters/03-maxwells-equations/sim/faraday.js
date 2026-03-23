/* chapters/03-maxwells-equations/sim/faraday.js
   Faraday Induction Simulator
   – Rectangular conducting loop moves through a region of non-uniform B
   – Coloured arrows show B(x) gradient
   – Current & EMF computed in real-time
   – Live EMF vs time graph bottom strip */
(function () {
  var canvas = document.getElementById('canvas-faraday');
  if (!canvas) return;
  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  /* Controls */
  var velSlider = document.getElementById('faraday-vel');
  var gradSlider = document.getElementById('faraday-grad');
  var velVal = document.getElementById('faraday-vel-val');
  var gradVal = document.getElementById('faraday-grad-val');
  var emfVal = document.getElementById('faraday-emf-val');

  var paused = false;
  var container = document.getElementById('faraday-sim');
  if (container) SimUtils.setupControls(container, {
    onPause: function () { paused = true; },
    onPlay: function () { paused = false; },
    onReset: function () { reset(); }
  });

  /* State */
  var loopX, loopY, loopW, loopH;
  var time, emfHistory;

  function reset() {
    loopW = 80;
    loopH = 60;
    loopX = 30;
    loopY = H * 0.35 - loopH / 2;
    time = 0;
    emfHistory = [];
  }
  reset();

  var graphH = 70;

  /* B field: gradient in x — B_z(x) = grad * x / W */
  function Bz(x) {
    var grad = parseFloat(gradSlider ? gradSlider.value : 2);
    return grad * (x / W);
  }

  /* Flux through loop = integral B(x) dx * loopH */
  function flux() {
    var x1 = loopX, x2 = loopX + loopW;
    var grad = parseFloat(gradSlider ? gradSlider.value : 2);
    /* integral of (grad * x / W) dx from x1 to x2 = grad / W * (x2^2 - x1^2) / 2 */
    var phi = (grad / W) * (x2 * x2 - x1 * x1) / 2 * loopH;
    return phi;
  }

  function draw(dt) {
    if (paused) { return; }
    /* Update */
    var vel = parseFloat(velSlider ? velSlider.value : 2);
    loopX += vel * dt * 60;
    if (loopX > W + 20) loopX = -loopW - 20;
    time += dt;

    /* EMF = −dΦ/dt ≈ −B(x2)*v*loopH + B(x1)*v*loopH  (for a rigid moving loop) */
    var v = vel * 60;
    var x1 = loopX, x2 = loopX + loopW;
    var emf = -(Bz(x2) - Bz(x1)) * v * loopH * 0.0001;
    emfHistory.push(emf);
    if (emfHistory.length > 200) emfHistory.shift();

    if (velVal) velVal.textContent = vel.toFixed(1);
    if (gradVal) gradVal.textContent = parseFloat(gradSlider ? gradSlider.value : 2).toFixed(1);
    if (emfVal) emfVal.textContent = emf.toFixed(4) + ' V';

    /* Draw */
    ctx.clearRect(0, 0, W, H);
    var fieldH = H - graphH;

    /* B field arrows (background) */
    for (var gx = 20; gx < W; gx += 40) {
      for (var gy = 20; gy < fieldH; gy += 40) {
        var b = Bz(gx);
        var maxB = parseFloat(gradSlider ? gradSlider.value : 2);
        var frac = Math.min(b / maxB, 1);
        var col = SimUtils.viridis(frac);
        ctx.fillStyle = col;
        var r = 2 + frac * 4;
        /* Draw × symbols for B into the page */
        ctx.lineWidth = 1;
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.moveTo(gx - r, gy - r);
        ctx.lineTo(gx + r, gy + r);
        ctx.moveTo(gx + r, gy - r);
        ctx.lineTo(gx - r, gy + r);
        ctx.stroke();
      }
    }

    /* Gradient label */
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('B weak', 5, fieldH - 5);
    ctx.textAlign = 'right';
    ctx.fillText('B strong →', W - 5, fieldH - 5);

    /* Loop */
    var lx = loopX, ly = loopY, lw = loopW, lh = loopH;
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 3;
    ctx.strokeRect(lx, ly, lw, lh);

    /* Direction arrows on loop (current direction depends on sign of emf) */
    var dir = emf > 0 ? 1 : -1;
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    /* Top edge */
    var mx = lx + lw / 2, my = ly;
    SimUtils.drawArrow(ctx, mx - dir * 15, my, mx + dir * 15, my, 6);
    /* Bottom edge */
    my = ly + lh;
    SimUtils.drawArrow(ctx, mx + dir * 15, my, mx - dir * 15, my, 6);

    /* Current indicator */
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(emf > 0 ? 'I ↺ (CCW)' : 'I ↻ (CW)', lx + lw / 2, ly - 10);

    /* Velocity arrow */
    ctx.strokeStyle = '#ef5350';
    ctx.lineWidth = 2;
    SimUtils.drawArrow(ctx, lx + lw + 10, ly + lh / 2, lx + lw + 30, ly + lh / 2, 8);
    ctx.fillStyle = '#ef5350';
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('v', lx + lw + 32, ly + lh / 2 + 4);

    /* EMF graph */
    var gy0 = fieldH + 5;
    ctx.fillStyle = 'rgba(10,14,26,0.8)';
    ctx.fillRect(0, gy0, W, graphH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    var mid = gy0 + graphH / 2;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(W, mid);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('EMF(t)', 5, gy0 + 12);

    if (emfHistory.length > 1) {
      ctx.beginPath();
      var maxEmf = 0.01;
      for (var i = 0; i < emfHistory.length; i++) maxEmf = Math.max(maxEmf, Math.abs(emfHistory[i]));
      for (var i = 0; i < emfHistory.length; i++) {
        var px = (i / 200) * W;
        var py = mid - (emfHistory[i] / maxEmf) * (graphH / 2 - 5);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  var loop = SimUtils.createLoop(draw);

  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
    reset();
  });
})();
