/* ============================================================
   Biot-Savart Field Visualizer
   Wire / Circular Loop / Solenoid — animated current, field vectors
   ============================================================ */
(function () {
  'use strict';
  var canvas = document.getElementById('canvas-biot');
  if (!canvas) return;

  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  var sourceSelect = document.getElementById('biot-source');
  var currentSlider = document.getElementById('biot-current');
  var currentValEl = document.getElementById('biot-current-val');

  var source = 'wire';
  var current = 10;
  var animT = 0;

  if (sourceSelect) sourceSelect.addEventListener('change', function () { source = this.value; });
  if (currentSlider) currentSlider.addEventListener('input', function () {
    current = parseInt(this.value);
    if (currentValEl) currentValEl.textContent = current + ' A';
  });

  var mu0 = 4 * Math.PI * 1e-7;

  function draw(dt) {
    animT += dt;
    ctx.clearRect(0, 0, W, H);

    var cx = W / 2, cy = H / 2;

    if (source === 'wire') drawWire(cx, cy);
    else if (source === 'loop') drawLoop(cx, cy);
    else drawSolenoid(cx, cy);
  }

  function drawWire(cx, cy) {
    // Current-carrying wire (vertical)
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, H);
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Animated current dots
    var dotSpacing = 30;
    var offset = (animT * 80) % dotSpacing;
    for (var y = -dotSpacing + offset; y < H + dotSpacing; y += dotSpacing) {
      ctx.beginPath();
      ctx.arc(cx, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd54f';
      ctx.fill();
    }

    ctx.font = '11px Inter';
    ctx.fillStyle = '#ffd54f';
    ctx.textAlign = 'left';
    ctx.fillText('I = ' + current + ' A ↑', cx + 10, 25);

    // B field vectors on grid
    var gridStep = 40;
    for (var gx = gridStep; gx < W; gx += gridStep) {
      for (var gy = gridStep; gy < H; gy += gridStep) {
        var dx = gx - cx, dy = gy - cy;
        var s = Math.sqrt(dx * dx + dy * dy);
        if (s < 20) continue;

        // B field direction: tangential (right-hand rule for upward current)
        // B = mu0 * I / (2*pi*s), direction = phi_hat
        var Bmag = mu0 * current / (2 * Math.PI * (s / 100));
        var phiX = -dy / s; // tangential direction
        var phiY = dx / s;

        var arrowScale = SimUtils.clamp(Bmag * 2e5, 3, 18);
        var col = SimUtils.viridis(SimUtils.clamp(Bmag * 1e5, 0, 1));
        SimUtils.drawArrow(ctx, gx, gy, gx + phiX * arrowScale, gy + phiY * arrowScale, col, 5);
      }
    }
  }

  function drawLoop(cx, cy) {
    // Draw circular loop (viewed from side, current in plane)
    var R = 60;

    ctx.beginPath();
    ctx.ellipse(cx, cy, R, R * 0.3, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Animated current dots around loop
    var numDots = 12;
    for (var i = 0; i < numDots; i++) {
      var angle = (i / numDots) * Math.PI * 2 + animT * 2;
      var dx = cx + R * Math.cos(angle);
      var dy = cy + R * 0.3 * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(dx, dy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd54f';
      ctx.fill();
    }

    ctx.font = '11px Inter';
    ctx.fillStyle = '#ffd54f';
    ctx.textAlign = 'center';
    ctx.fillText('I = ' + current + ' A', cx, cy + R * 0.3 + 20);

    // B field on axis (vertical through center)
    var Rmeters = R / 100;
    for (var z = -150; z <= 150; z += 25) {
      var zMeters = z / 100;
      var denom = Math.pow(Rmeters * Rmeters + zMeters * zMeters, 1.5);
      if (denom < 1e-10) denom = 1e-10;
      var Bz = mu0 * current * Rmeters * Rmeters / (2 * denom);
      var arrowLen = SimUtils.clamp(Bz * 1e5, 3, 20);

      var py = cy + z;
      if (py < 10 || py > H - 10) continue;

      SimUtils.drawArrow(ctx, cx, py, cx, py - arrowLen, SimUtils.viridis(SimUtils.clamp(Bz * 5e4, 0, 1)), 5);
    }

    // Off-axis approximate arrows
    for (var gx = cx - 160; gx <= cx + 160; gx += 50) {
      for (var gy = cy - 120; gy <= cy + 120; gy += 50) {
        if (Math.abs(gx - cx) < 30 && Math.abs(gy - cy) < 40) continue;
        var dx = gx - cx, dy = gy - cy;
        var r = Math.sqrt(dx * dx + dy * dy) / 100;
        if (r < 0.1) continue;
        // Dipole approximation
        var cosTheta = -dy / (r * 100);
        var sinTheta = dx / (r * 100);
        var m = current * Math.PI * Rmeters * Rmeters;
        var Br = mu0 * 2 * m * cosTheta / (4 * Math.PI * r * r * r);
        var Btheta = mu0 * m * sinTheta / (4 * Math.PI * r * r * r);
        var bx = Br * sinTheta + Btheta * cosTheta;
        var by = -(Br * cosTheta - Btheta * sinTheta);
        var bmag = Math.sqrt(bx * bx + by * by);
        if (bmag < 1e-12) continue;
        var scale = SimUtils.clamp(bmag * 3e5, 3, 15);
        SimUtils.drawArrow(ctx, gx, gy, gx + bx / bmag * scale, gy + by / bmag * scale, 'rgba(79,195,247,0.5)', 4);
      }
    }
  }

  function drawSolenoid(cx, cy) {
    var numTurns = 8;
    var solLen = 200;
    var solR = 40;
    var startX = cx - solLen / 2;

    // Draw coils
    for (var i = 0; i < numTurns; i++) {
      var x = startX + (i + 0.5) * (solLen / numTurns);
      ctx.beginPath();
      ctx.ellipse(x, cy, 8, solR, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Current dot
      var dotAngle = animT * 3 + i * 0.5;
      ctx.beginPath();
      ctx.arc(x + 8 * Math.cos(dotAngle), cy + solR * Math.sin(dotAngle), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd54f';
      ctx.fill();
    }

    // Top and bottom lines
    ctx.beginPath();
    ctx.moveTo(startX, cy - solR);
    ctx.lineTo(startX + solLen, cy - solR);
    ctx.moveTo(startX, cy + solR);
    ctx.lineTo(startX + solLen, cy + solR);
    ctx.strokeStyle = 'rgba(255,213,79,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '11px Inter';
    ctx.fillStyle = '#ffd54f';
    ctx.textAlign = 'center';
    ctx.fillText('n turns/length, I = ' + current + ' A', cx, cy + solR + 25);

    // B field inside (uniform, horizontal)
    var n = numTurns / (solLen / 100);
    var Binside = mu0 * n * current;

    for (var y = cy - solR + 15; y <= cy + solR - 15; y += 20) {
      for (var x = startX + 15; x < startX + solLen - 15; x += 30) {
        var arrowLen = SimUtils.clamp(Binside * 1e4, 8, 18);
        SimUtils.drawArrow(ctx, x, y, x + arrowLen, y, '#4fc3f7', 5);
      }
    }

    // Label inside B
    ctx.font = '12px JetBrains Mono';
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText('B = μ₀nI = ' + Binside.toExponential(2) + ' T', cx, cy - solR - 12);

    // Outside: arrows curving around (schematic)
    var outsideArrows = [
      { x: startX - 30, y: cy, dx: 0, dy: -12 },
      { x: startX + solLen + 30, y: cy, dx: 0, dy: 12 },
      { x: cx, y: cy - solR - 30, dx: -15, dy: 0 },
      { x: cx, y: cy + solR + 30, dx: 15, dy: 0 }
    ];
    outsideArrows.forEach(function (a) {
      SimUtils.drawArrow(ctx, a.x, a.y, a.x + a.dx, a.y + a.dy, 'rgba(79,195,247,0.3)', 4);
    });
  }

  var loop = SimUtils.createLoop(draw);

  function reset() {
    if (sourceSelect) sourceSelect.value = 'wire';
    source = 'wire';
    if (currentSlider) currentSlider.value = 10;
    current = 10;
    if (currentValEl) currentValEl.textContent = '10 A';
    animT = 0;
  }

  SimUtils.setupControls('biot-sim', loop, reset);

  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
  });
})();
