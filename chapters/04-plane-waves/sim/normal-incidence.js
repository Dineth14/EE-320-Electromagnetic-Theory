/* chapters/04-plane-waves/sim/normal-incidence.js
   Normal Incidence at an Interface
   – Incident wave from left, reflected wave going left, transmitted going right
   – Interface at center with η₁ / η₂ labeled
   – Γ and τ computed and displayed
   – Slider for η₂/η₁ ratio */
(function () {
  var canvas = document.getElementById('canvas-incidence');
  if (!canvas) return;
  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  var ratioSlider = document.getElementById('inc-ratio');
  var ratioVal = document.getElementById('inc-ratio-val');
  var gammaVal = document.getElementById('inc-gamma-val');
  var tauVal = document.getElementById('inc-tau-val');

  var paused = false, time = 0;
  var container = document.getElementById('incidence-sim');
  if (container) SimUtils.setupControls(container, {
    onPause: function () { paused = true; },
    onPlay: function () { paused = false; },
    onReset: function () { time = 0; }
  });

  function draw(dt) {
    if (paused) return;
    time += dt;
    var ratio = parseFloat(ratioSlider ? ratioSlider.value : 3);
    if (ratioVal) ratioVal.textContent = ratio.toFixed(1);

    /* Compute Γ and τ */
    var Gamma = (ratio - 1) / (ratio + 1);
    var tau = 2 * ratio / (ratio + 1);
    if (gammaVal) gammaVal.textContent = Gamma.toFixed(3);
    if (tauVal) tauVal.textContent = tau.toFixed(3);

    ctx.clearRect(0, 0, W, H);

    var mid = W / 2;
    var omega = 4;
    var k1 = 0.04;
    /* In medium 2, wavelength changes: k2 = k1 * η₁/η₂ (for lossless) */
    var k2 = k1 / ratio;
    var amp = 40;
    var cy = H / 2;

    /* Medium backgrounds */
    ctx.fillStyle = 'rgba(79,195,247,0.05)';
    ctx.fillRect(0, 0, mid, H);
    ctx.fillStyle = 'rgba(255,213,79,0.05)';
    ctx.fillRect(mid, 0, W - mid, H);

    /* Interface line */
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(mid, 0);
    ctx.lineTo(mid, H);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Medium labels */
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Medium 1 (η₁)', mid / 2, 20);
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('Medium 2 (η₂)', mid + (W - mid) / 2, 20);

    /* Incident wave (medium 1, traveling +z) — blue */
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x = 0; x < mid; x += 2) {
      var z = x - mid; /* negative z */
      var val = amp * Math.sin(k1 * z - omega * time);
      if (x === 0) ctx.moveTo(x, cy + val); else ctx.lineTo(x, cy + val);
    }
    ctx.stroke();

    /* Reflected wave (medium 1, traveling -z) — red */
    ctx.strokeStyle = '#ef5350';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x = 0; x < mid; x += 2) {
      var z = x - mid;
      var val = amp * Gamma * Math.sin(-k1 * z - omega * time);
      if (x === 0) ctx.moveTo(x, cy + val); else ctx.lineTo(x, cy + val);
    }
    ctx.stroke();

    /* Total field in medium 1 — white, thin */
    ctx.strokeStyle = 'rgba(232,234,246,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var x = 0; x < mid; x += 2) {
      var z = x - mid;
      var inc = amp * Math.sin(k1 * z - omega * time);
      var ref = amp * Gamma * Math.sin(-k1 * z - omega * time);
      if (x === 0) ctx.moveTo(x, cy + inc + ref); else ctx.lineTo(x, cy + inc + ref);
    }
    ctx.stroke();

    /* Transmitted wave (medium 2) — gold */
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var x = mid; x < W; x += 2) {
      var z = x - mid;
      var val = amp * tau * Math.sin(k2 * z - omega * time);
      if (x === mid) ctx.moveTo(x, cy + val); else ctx.lineTo(x, cy + val);
    }
    ctx.stroke();

    /* Propagation arrows */
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 1.5;
    SimUtils.drawArrow(ctx, 30, H - 30, 70, H - 30, 8);
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('incident', 75, H - 26);

    ctx.strokeStyle = '#ef5350';
    SimUtils.drawArrow(ctx, 70, H - 15, 30, H - 15, 8);
    ctx.fillStyle = '#ef5350';
    ctx.fillText('reflected', 75, H - 11);

    ctx.strokeStyle = '#ffd54f';
    SimUtils.drawArrow(ctx, mid + 10, H - 30, mid + 50, H - 30, 8);
    ctx.fillStyle = '#ffd54f';
    ctx.textAlign = 'left';
    ctx.fillText('transmitted', mid + 55, H - 26);

    /* Coefficients display */
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('Γ = ' + Gamma.toFixed(3) + '   τ = ' + tau.toFixed(3), W / 2, H - 8);

    /* SWR */
    var swr = (1 + Math.abs(Gamma)) / (1 - Math.abs(Gamma));
    ctx.fillText('SWR = ' + (swr > 100 ? '∞' : swr.toFixed(2)), W / 2, 40);
  }

  SimUtils.createLoop(draw);

  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
  });
})();
