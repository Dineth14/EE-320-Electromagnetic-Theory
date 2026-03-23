/* chapters/03-maxwells-equations/sim/em-coupling.js
   Poynting Vector Flow Visualiser
   – Animated E and B fields of a propagating wave
   – Poynting vector S = E × H shown as directional arrows
   – Colour-coded magnitude using viridis
   – Frequency & amplitude sliders */
(function () {
  var canvas = document.getElementById('canvas-poynting');
  if (!canvas) return;
  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  var freqSlider = document.getElementById('poynting-freq');
  var ampSlider = document.getElementById('poynting-amp');
  var freqVal = document.getElementById('poynting-freq-val');
  var ampVal = document.getElementById('poynting-amp-val');

  var paused = false;
  var container = document.getElementById('poynting-sim');
  if (container) SimUtils.setupControls(container, {
    onPause: function () { paused = true; },
    onPlay: function () { paused = false; },
    onReset: function () { time = 0; }
  });

  var time = 0;

  function draw(dt) {
    if (paused) return;
    time += dt;
    var freq = parseFloat(freqSlider ? freqSlider.value : 2);
    var amp = parseFloat(ampSlider ? ampSlider.value : 1.5);
    if (freqVal) freqVal.textContent = freq.toFixed(1);
    if (ampVal) ampVal.textContent = amp.toFixed(1);

    ctx.clearRect(0, 0, W, H);

    var omega = freq * 2;
    var k = 0.03 * freq;
    var cy = H / 2;

    /* Draw propagation axis */
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    /* E-field (vertical, blue) */
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x = 0; x < W; x += 2) {
      var Ey = amp * 40 * Math.sin(k * x - omega * time);
      var y = cy + Ey;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    /* B-field (horizontal amplitude, drawn as perpendicular sine, gold) */
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x = 0; x < W; x += 2) {
      /* B is in z-direction; we represent it as offset in different axis on screen */
      var Bz = amp * 40 * Math.sin(k * x - omega * time);
      /* Draw as smaller dashed wave below */
      var y = cy - Bz * 0.6;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    /* E and B field vectors at sample points */
    for (var px = 30; px < W; px += 60) {
      var phase = k * px - omega * time;
      var Ey = amp * 40 * Math.sin(phase);
      var Bz = amp * 40 * Math.sin(phase);

      /* E arrow (vertical) */
      if (Math.abs(Ey) > 2) {
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 1.5;
        SimUtils.drawArrow(ctx, px, cy, px, cy + Ey, 5);
      }

      /* B arrow (perpendicular — shown as horizontal displacement) */
      if (Math.abs(Bz) > 2) {
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 1.5;
        SimUtils.drawArrow(ctx, px, cy, px, cy - Bz * 0.6, 5);
      }
    }

    /* Poynting vector arrows (along propagation direction, x) */
    for (var px = 40; px < W; px += 50) {
      var phase = k * px - omega * time;
      var E = amp * Math.sin(phase);
      var B = amp * Math.sin(phase);
      var S = E * B; /* S ∝ E × B, direction is +x for forward wave */
      var mag = Math.abs(S);
      if (mag < 0.05) continue;

      var normMag = Math.min(mag / (amp * amp), 1);
      var col = SimUtils.viridis(normMag);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;

      var aLen = normMag * 25;
      var yPos = cy + H * 0.38;
      var dir = S > 0 ? 1 : -1;
      SimUtils.drawArrow(ctx, px - dir * aLen, yPos, px + dir * aLen, yPos, 6);
    }

    /* Labels */
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText('E (vertical)', 10, 20);
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('B (perpendicular)', 10, 36);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Inter';
    ctx.fillText('S = E × H  →  propagation direction', 10, H - 10);

    /* Poynting label */
    ctx.fillStyle = 'rgba(79,195,247,0.6)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Poynting Vector (S)', W / 2, cy + H * 0.38 - 12);

    /* Propagation arrow */
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    SimUtils.drawArrow(ctx, W - 80, 20, W - 30, 20, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('propagation →', W - 10, 18);
  }

  SimUtils.createLoop(draw);

  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
  });
})();
