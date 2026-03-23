/* chapters/04-plane-waves/sim/skin-effect.js
   Skin Effect Visualizer
   – Cross-section of a conductor
   – Current density J decays as e^{-z/δ}
   – Viridis heat-map overlay
   – Animated wave penetrating surface */
(function () {
  var canvas = document.getElementById('canvas-skin');
  if (!canvas) return;
  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  var freqSlider = document.getElementById('skin-freq');
  var sigmaSlider = document.getElementById('skin-sigma');
  var freqVal = document.getElementById('skin-freq-val');
  var sigmaVal = document.getElementById('skin-sigma-val');
  var deltaVal = document.getElementById('skin-delta-val');

  var paused = false, time = 0;
  var container = document.getElementById('skin-sim');
  if (container) SimUtils.setupControls(container, {
    onPause: function () { paused = true; },
    onPlay: function () { paused = false; },
    onReset: function () { time = 0; }
  });

  function draw(dt) {
    if (paused) return;
    time += dt;
    var freq = parseFloat(freqSlider ? freqSlider.value : 3);
    var sigma = parseFloat(sigmaSlider ? sigmaSlider.value : 5);
    if (freqVal) freqVal.textContent = freq.toFixed(1);
    if (sigmaVal) sigmaVal.textContent = sigma.toFixed(1);

    /* skin depth in normalised units */
    var skinD = 1 / Math.sqrt(Math.PI * freq * sigma);
    if (deltaVal) deltaVal.textContent = skinD.toFixed(3) + ' (norm)';

    ctx.clearRect(0, 0, W, H);

    var margin = 40;
    var condLeft = margin;
    var condWidth = W - 2 * margin;
    var condTop = 60;
    var condH = H - 100;

    /* Conductor body */
    ctx.fillStyle = 'rgba(80,80,100,0.3)';
    ctx.fillRect(condLeft, condTop, condWidth, condH);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(condLeft, condTop, condWidth, condH);

    /* Surface label */
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Surface →', condLeft + 20, condTop - 8);
    ctx.fillText('← Interior', condLeft + condWidth - 30, condTop - 8);

    /* Depth axis label */
    ctx.save();
    ctx.translate(condLeft + condWidth + 25, condTop + condH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('depth z →', 0, 0);
    ctx.restore();

    /* Heat map: J(z) = J_0 * e^{-z/δ} * cos(z/δ - ωt) */
    var omega = freq * 4;
    var cellSize = 4;
    for (var x = 0; x < condWidth; x += cellSize) {
      for (var y = 0; y < condH; y += cellSize) {
        /* z = distance from left surface */
        var zNorm = x / condWidth * 3; /* 0 to 3 skin depths */
        var envelope = Math.exp(-zNorm / skinD);
        var wave = envelope * Math.cos(zNorm / skinD - omega * time);
        var mag = Math.abs(wave);
        var col = SimUtils.viridis(SimUtils.clamp(mag, 0, 1));
        ctx.fillStyle = col;
        ctx.fillRect(condLeft + x, condTop + y, cellSize, cellSize);
      }
    }

    /* Skin depth marker */
    var skinPixX = (skinD / 3) * condWidth;
    if (skinPixX < condWidth) {
      ctx.strokeStyle = '#ef5350';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(condLeft + skinPixX, condTop);
      ctx.lineTo(condLeft + skinPixX, condTop + condH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef5350';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('δₛ', condLeft + skinPixX, condTop + condH + 15);
    }

    /* 1/e marker */
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('1/e amplitude at δₛ', condLeft + skinPixX + 8, condTop + condH + 15);

    /* Top graph: J(z) envelope */
    var graphY = condTop + condH + 30;
    var graphH = 30;
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x = 0; x < condWidth; x += 2) {
      var zNorm = x / condWidth * 3;
      var env = Math.exp(-zNorm / skinD);
      var py = graphY + graphH * (1 - env);
      if (x === 0) ctx.moveTo(condLeft + x, py); else ctx.lineTo(condLeft + x, py);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('|J(z)|/J₀', condLeft, graphY - 3);

    /* Title */
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Current Density in Conductor', W / 2, 18);
    ctx.font = '11px Inter';
    ctx.fillText('δₛ = ' + skinD.toFixed(3) + ' (normalised)', W / 2, 36);
  }

  SimUtils.createLoop(draw);

  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
  });
})();
