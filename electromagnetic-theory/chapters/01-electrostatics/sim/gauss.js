/* ============================================================
   Gauss's Law Interactive Simulation
   Choose geometry, animate Gaussian surface, show flux.
   ============================================================ */
(function () {
  'use strict';
  var canvas = document.getElementById('canvas-gauss');
  if (!canvas) return;

  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  var geoSelect = document.getElementById('gauss-geometry');
  var chargeSlider = document.getElementById('gauss-charge');
  var radiusSlider = document.getElementById('gauss-radius');
  var chargeVal = document.getElementById('gauss-charge-val');
  var fluxVal = document.getElementById('gauss-flux-val');

  var geometry = 'sphere';
  var Qenc = 10; // μC
  var surfRadius = 70;
  var animPhase = 0;
  var eps0 = 8.854e-12;

  if (geoSelect) geoSelect.addEventListener('change', function () { geometry = this.value; });
  if (chargeSlider) chargeSlider.addEventListener('input', function () {
    Qenc = parseFloat(this.value);
    if (chargeVal) chargeVal.textContent = Qenc.toFixed(1) + ' μC';
  });
  if (radiusSlider) radiusSlider.addEventListener('input', function () {
    surfRadius = parseInt(this.value);
  });

  function draw(dt) {
    animPhase += dt * 1.5;
    ctx.clearRect(0, 0, W, H);

    var cx = W / 2, cy = H / 2;

    // Calculate flux
    var QSI = Qenc * 1e-6;
    var flux = QSI / eps0;
    if (fluxVal) fluxVal.textContent = flux.toExponential(2) + ' N·m²/C';

    if (geometry === 'sphere') {
      drawSphere(cx, cy);
    } else if (geometry === 'cylinder') {
      drawCylinder(cx, cy);
    } else {
      drawPlane(cx, cy);
    }
  }

  function drawSphere(cx, cy) {
    // Central charge
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ef5350';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+Q', cx, cy);

    // Gaussian sphere (animated dashed)
    ctx.beginPath();
    ctx.arc(cx, cy, surfRadius, 0, Math.PI * 2);
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -animPhase * 20;
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText('Gaussian Surface', cx, cy - surfRadius - 12);

    // E field arrows through surface
    var numArrows = 16;
    for (var i = 0; i < numArrows; i++) {
      var angle = (i / numArrows) * Math.PI * 2 + animPhase * 0.2;
      var sx = cx + surfRadius * Math.cos(angle);
      var sy = cy + surfRadius * Math.sin(angle);
      var arrowLen = 15 + 10 * (0.5 + 0.5 * Math.sin(animPhase * 3 + i));
      var ex = sx + arrowLen * Math.cos(angle);
      var ey = sy + arrowLen * Math.sin(angle);
      SimUtils.drawArrow(ctx, sx, sy, ex, ey, 'rgba(79,195,247,0.7)', 6);
    }

    // Flux patches visualization
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var px = cx + surfRadius * Math.cos(angle);
      var py = cy + surfRadius * Math.sin(angle);
      var patchSize = 6 + 4 * Math.abs(Math.sin(animPhase + i));
      ctx.beginPath();
      ctx.arc(px, py, patchSize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,213,79,' + (0.2 + 0.3 * Math.abs(Math.sin(animPhase + i))) + ')';
      ctx.fill();
    }

    // Equation
    ctx.font = '13px JetBrains Mono';
    ctx.fillStyle = '#ffd54f';
    ctx.textAlign = 'center';
    ctx.fillText('∮ E·dA = Q/ε₀ = ' + (Qenc * 1e-6 / eps0).toExponential(2) + ' N·m²/C', cx, H - 20);

    // E field at surface
    var rMeters = surfRadius / 100;
    var Esurface = (Qenc * 1e-6) / (4 * Math.PI * eps0 * rMeters * rMeters);
    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('E at surface = ' + Esurface.toExponential(2) + ' V/m', cx, H - 40);
  }

  function drawCylinder(cx, cy) {
    // Line charge
    ctx.beginPath();
    ctx.moveTo(cx, cy - 80);
    ctx.lineTo(cx, cy + 80);
    ctx.strokeStyle = '#ef5350';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.font = '11px Inter';
    ctx.fillStyle = '#ef5350';
    ctx.textAlign = 'left';
    ctx.fillText('λ (line charge)', cx + 8, cy - 70);

    // Gaussian cylinder
    var halfH = 60;
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -animPhase * 20;

    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy - halfH, surfRadius, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Bottom ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy + halfH, surfRadius, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Side lines
    ctx.beginPath();
    ctx.moveTo(cx - surfRadius, cy - halfH);
    ctx.lineTo(cx - surfRadius, cy + halfH);
    ctx.moveTo(cx + surfRadius, cy - halfH);
    ctx.lineTo(cx + surfRadius, cy + halfH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Radial E arrows along sides
    for (var j = -2; j <= 2; j++) {
      var yy = cy + j * 20;
      var arrowLen = 18 + 8 * Math.sin(animPhase * 2 + j);
      SimUtils.drawArrow(ctx, cx + surfRadius, yy, cx + surfRadius + arrowLen, yy, 'rgba(79,195,247,0.7)', 6);
      SimUtils.drawArrow(ctx, cx - surfRadius, yy, cx - surfRadius - arrowLen, yy, 'rgba(79,195,247,0.7)', 6);
    }

    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = '#4fc3f7';
    ctx.textAlign = 'center';
    ctx.fillText('Gaussian Cylinder', cx, cy - halfH - 25);

    ctx.font = '13px JetBrains Mono';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('E(2πsL) = λL/ε₀  →  E = λ/(2πε₀s)', cx, H - 20);
  }

  function drawPlane(cx, cy) {
    // Infinite plane (drawn as a vertical line)
    ctx.fillStyle = 'rgba(239,83,80,0.3)';
    ctx.fillRect(cx - 3, 20, 6, H - 40);
    ctx.font = '11px Inter';
    ctx.fillStyle = '#ef5350';
    ctx.textAlign = 'left';
    ctx.fillText('σ (surface charge)', cx + 10, 35);

    // Pillbox
    var boxW = surfRadius;
    var boxH = 40;
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -animPhase * 20;
    ctx.strokeRect(cx - boxW, cy - boxH, boxW * 2, boxH * 2);
    ctx.setLineDash([]);

    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = '#4fc3f7';
    ctx.textAlign = 'center';
    ctx.fillText('Pillbox', cx, cy - boxH - 10);

    // E arrows from both faces
    var arrowLen = 20 + 10 * Math.sin(animPhase * 2);
    for (var j = -1; j <= 1; j += 2) {
      for (var k = -1; k <= 1; k++) {
        var yy = cy + k * 15;
        var startX = cx + j * boxW;
        SimUtils.drawArrow(ctx, startX, yy, startX + j * arrowLen, yy, 'rgba(79,195,247,0.7)', 6);
      }
    }

    ctx.font = '13px JetBrains Mono';
    ctx.fillStyle = '#ffd54f';
    ctx.textAlign = 'center';
    ctx.fillText('2EA = σA/ε₀  →  E = σ/(2ε₀)', cx, H - 20);
  }

  var loop = SimUtils.createLoop(draw);

  function reset() {
    if (geoSelect) geoSelect.value = 'sphere';
    geometry = 'sphere';
    if (chargeSlider) chargeSlider.value = 10;
    Qenc = 10;
    if (radiusSlider) radiusSlider.value = 70;
    surfRadius = 70;
    if (chargeVal) chargeVal.textContent = '10.0 μC';
    animPhase = 0;
  }

  SimUtils.setupControls('gauss-sim', loop, reset);

  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
  });
})();
