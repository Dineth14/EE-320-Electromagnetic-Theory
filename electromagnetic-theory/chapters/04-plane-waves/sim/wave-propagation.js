/* chapters/04-plane-waves/sim/wave-propagation.js
   Plane wave propagation in lossless & lossy media
   – Sinusoidal E and B waves traveling +z
   – Envelope decay for lossy (α > 0)
   – Animated field vectors at sample points */
(function () {
  var canvas = document.getElementById('canvas-wave');
  if (!canvas) return;
  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  var freqSlider = document.getElementById('wave-freq');
  var alphaSlider = document.getElementById('wave-alpha');
  var freqVal = document.getElementById('wave-freq-val');
  var alphaVal = document.getElementById('wave-alpha-val');

  var paused = false, time = 0;
  var container = document.getElementById('wave-sim');
  if (container) SimUtils.setupControls(container, {
    onPause: function () { paused = true; },
    onPlay: function () { paused = false; },
    onReset: function () { time = 0; }
  });

  function draw(dt) {
    if (paused) return;
    time += dt;
    var freq = parseFloat(freqSlider ? freqSlider.value : 2);
    var alpha = parseFloat(alphaSlider ? alphaSlider.value : 0);
    if (freqVal) freqVal.textContent = freq.toFixed(1);
    if (alphaVal) alphaVal.textContent = alpha.toFixed(1);

    ctx.clearRect(0, 0, W, H);

    var omega = freq * 2;
    var k = 0.04 * freq;
    var cyE = H * 0.3;
    var cyB = H * 0.7;
    var amp = 50;

    /* Propagation axis */
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, cyE); ctx.lineTo(W, cyE);
    ctx.moveTo(0, cyB); ctx.lineTo(W, cyB);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Envelope for lossy */
    if (alpha > 0.05) {
      ctx.strokeStyle = 'rgba(239,83,80,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (var x = 0; x < W; x += 2) {
        var env = amp * Math.exp(-alpha * x / W * 3);
        if (x === 0) ctx.moveTo(x, cyE - env); else ctx.lineTo(x, cyE - env);
      }
      ctx.stroke();
      ctx.beginPath();
      for (var x = 0; x < W; x += 2) {
        var env = amp * Math.exp(-alpha * x / W * 3);
        if (x === 0) ctx.moveTo(x, cyE + env); else ctx.lineTo(x, cyE + env);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    /* E-field wave (blue) */
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var x = 0; x < W; x += 2) {
      var decay = Math.exp(-alpha * x / W * 3);
      var Ey = amp * decay * Math.sin(k * x - omega * time);
      if (x === 0) ctx.moveTo(x, cyE + Ey); else ctx.lineTo(x, cyE + Ey);
    }
    ctx.stroke();

    /* B-field wave (gold) */
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var x = 0; x < W; x += 2) {
      var decay = Math.exp(-alpha * x / W * 3);
      var Bz = amp * decay * Math.sin(k * x - omega * time);
      if (x === 0) ctx.moveTo(x, cyB + Bz); else ctx.lineTo(x, cyB + Bz);
    }
    ctx.stroke();

    /* Field vectors at sample points */
    for (var px = 25; px < W; px += 50) {
      var decay = Math.exp(-alpha * px / W * 3);
      var val = amp * decay * Math.sin(k * px - omega * time);
      if (Math.abs(val) > 1) {
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 1.5;
        SimUtils.drawArrow(ctx, px, cyE, px, cyE + val, 4);
        ctx.strokeStyle = '#ffd54f';
        SimUtils.drawArrow(ctx, px, cyB, px, cyB + val, 4);
      }
    }

    /* Labels */
    ctx.font = 'bold 13px Inter';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText('E-field', 8, cyE - amp - 10);
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('B-field', 8, cyB - amp - 10);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('z →', W - 10, H - 8);

    if (alpha > 0.05) {
      ctx.fillStyle = '#ef5350';
      ctx.textAlign = 'left';
      ctx.fillText('Lossy (α = ' + alpha.toFixed(1) + ')', 8, 16);
    } else {
      ctx.fillStyle = '#66bb6a';
      ctx.textAlign = 'left';
      ctx.fillText('Lossless', 8, 16);
    }
  }

  SimUtils.createLoop(draw);

  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
  });
})();
