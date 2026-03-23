/* chapters/04-plane-waves/sim/polarization.js
   Polarization Visualizer
   – Left: 3D-ish perspective of E(z,t) spiral
   – Right: Cross-section showing E-tip trace (linear / circular / elliptical)
   – Sliders: Ex0, Ey0, phase delta */
(function () {
  var canvas = document.getElementById('canvas-polarization');
  if (!canvas) return;
  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  var exSlider = document.getElementById('pol-ex');
  var eySlider = document.getElementById('pol-ey');
  var deltaSlider = document.getElementById('pol-delta');
  var exVal = document.getElementById('pol-ex-val');
  var eyVal = document.getElementById('pol-ey-val');
  var deltaVal = document.getElementById('pol-delta-val');

  var paused = false, time = 0;
  var container = document.getElementById('pol-sim');
  if (container) SimUtils.setupControls(container, {
    onPause: function () { paused = true; },
    onPlay: function () { paused = false; },
    onReset: function () { time = 0; }
  });

  function draw(dt) {
    if (paused) return;
    time += dt;

    var Ex0 = parseFloat(exSlider ? exSlider.value : 1);
    var Ey0 = parseFloat(eySlider ? eySlider.value : 1);
    var delta = parseFloat(deltaSlider ? deltaSlider.value : 90) * Math.PI / 180;
    if (exVal) exVal.textContent = Ex0.toFixed(2);
    if (eyVal) eyVal.textContent = Ey0.toFixed(2);
    if (deltaVal) deltaVal.textContent = parseFloat(deltaSlider ? deltaSlider.value : 90).toFixed(0);

    ctx.clearRect(0, 0, W, H);

    var split = W * 0.55;
    var omega = 3;
    var k = 0.03;
    var scale = 50;

    /* ====== LEFT: 3D perspective of wave ====== */
    var cx = split * 0.5;
    var cy = H * 0.5;

    /* Draw propagation axis (z) going into screen as perspective */
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 120, cy + 50);
    ctx.lineTo(cx + 120, cy - 50);
    ctx.stroke();

    /* Draw x and y axes at front plane */
    ctx.strokeStyle = 'rgba(79,195,247,0.3)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 60);
    ctx.lineTo(cx, cy + 60);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,213,79,0.3)';
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy);
    ctx.lineTo(cx + 60, cy);
    ctx.stroke();

    /* E-field spiral along z */
    var numZ = 50;
    ctx.beginPath();
    for (var i = 0; i < numZ; i++) {
      var z = i * 6;
      var phase = k * z - omega * time;
      var ex = Ex0 * scale * Math.cos(phase);
      var ey = Ey0 * scale * Math.cos(phase + delta);

      /* Perspective projection: z goes towards upper-right */
      var pFactor = 1 - i / numZ * 0.5;
      var ox = cx + (i / numZ - 0.5) * 200;
      var oy = cy - (i / numZ - 0.5) * 80;
      var px = ox + ex * pFactor * 0.7;
      var py = oy + ey * pFactor * 0.7;

      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(79,195,247,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Current E vector at z=0 */
    var phase0 = -omega * time;
    var Exnow = Ex0 * scale * Math.cos(phase0);
    var Eynow = Ey0 * scale * Math.cos(phase0 + delta);
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2.5;
    SimUtils.drawArrow(ctx, cx, cy, cx + Exnow * 0.7, cy + Eynow * 0.7, 8);

    /* Labels */
    ctx.font = '11px Inter';
    ctx.fillStyle = '#4fc3f7';
    ctx.textAlign = 'center';
    ctx.fillText('x', cx, cy - 66);
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('y', cx + 66, cy + 4);

    /* ====== RIGHT: Cross-section (E-tip trace) ====== */
    var rcx = split + (W - split) / 2;
    var rcy = H / 2;
    var rScale = 55;

    /* Draw axes */
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rcx - rScale - 15, rcy);
    ctx.lineTo(rcx + rScale + 15, rcy);
    ctx.moveTo(rcx, rcy - rScale - 15);
    ctx.lineTo(rcx, rcy + rScale + 15);
    ctx.stroke();

    /* Trace the full ellipse */
    ctx.beginPath();
    for (var a = 0; a < Math.PI * 2; a += 0.02) {
      var tx = Ex0 * rScale * Math.cos(a);
      var ty = Ey0 * rScale * Math.cos(a + delta);
      if (a < 0.01) ctx.moveTo(rcx + tx, rcy + ty); else ctx.lineTo(rcx + tx, rcy + ty);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* Animated trail (last ~40 steps) */
    var trail = 40;
    ctx.beginPath();
    for (var i = 0; i < trail; i++) {
      var t2 = time - (trail - i) * 0.025;
      var p2 = -omega * t2;
      var tx = Ex0 * rScale * Math.cos(p2);
      var ty = Ey0 * rScale * Math.cos(p2 + delta);
      if (i === 0) ctx.moveTo(rcx + tx, rcy + ty); else ctx.lineTo(rcx + tx, rcy + ty);
    }
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Current point */
    var nowX = Ex0 * rScale * Math.cos(-omega * time);
    var nowY = Ey0 * rScale * Math.cos(-omega * time + delta);
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(rcx + nowX, rcy + nowY, 5, 0, Math.PI * 2);
    ctx.fill();

    /* E vector */
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2;
    SimUtils.drawArrow(ctx, rcx, rcy, rcx + nowX, rcy + nowY, 7);

    /* Polarization type label */
    var label = 'Elliptical';
    var dMod = Math.abs(delta);
    if (Ex0 < 0.02 || Ey0 < 0.02 || dMod < 0.05 || Math.abs(dMod - Math.PI) < 0.05) {
      label = 'Linear';
    } else if (Math.abs(Ex0 - Ey0) < 0.05 && Math.abs(dMod - Math.PI / 2) < 0.05) {
      label = delta > 0 ? 'LHCP' : 'RHCP';
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, rcx, rcy + rScale + 30);

    ctx.font = '11px Inter';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Ex', rcx + rScale + 10, rcy + 4);
    ctx.fillText('Ey', rcx + 4, rcy - rScale - 6);

    /* Section labels */
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('3D View', split / 2, 14);
    ctx.fillText('Cross-Section', rcx, 14);
  }

  SimUtils.createLoop(draw);

  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
  });
})();
