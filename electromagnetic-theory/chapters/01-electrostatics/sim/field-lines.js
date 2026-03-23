/* ============================================================
   Electric Field Line Visualizer
   Place up to 8 charges, field lines via RK4, viridis colormap.
   ============================================================ */
(function () {
  'use strict';
  var canvas = document.getElementById('canvas-fieldlines');
  if (!canvas) return;

  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  var charges = [];
  var maxCharges = 8;
  var showEquipotentials = false;
  var placeMag = 5;

  var magSlider = document.getElementById('fl-magnitude');
  var magVal = document.getElementById('fl-mag-val');
  var equipBtn = document.getElementById('fl-equip-toggle');

  if (magSlider) magSlider.addEventListener('input', function () {
    placeMag = parseInt(this.value);
    if (magVal) magVal.textContent = placeMag;
  });

  if (equipBtn) equipBtn.addEventListener('click', function () {
    showEquipotentials = !showEquipotentials;
    equipBtn.textContent = 'Equipotentials: ' + (showEquipotentials ? 'ON' : 'OFF');
    drawAll();
  });

  // Place charges on click
  canvas.addEventListener('click', function (e) {
    if (charges.length >= maxCharges) return;
    var pos = SimUtils.getPointerPos(canvas, e);
    charges.push({ x: pos.x, y: pos.y, q: placeMag });
    drawAll();
  });

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (charges.length >= maxCharges) return;
    var pos = SimUtils.getPointerPos(canvas, e);
    charges.push({ x: pos.x, y: pos.y, q: -placeMag });
    drawAll();
  });

  // Touch support: long press for negative
  var touchTimer = null;
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    var pos = SimUtils.getPointerPos(canvas, e);
    touchTimer = setTimeout(function () {
      if (charges.length < maxCharges) {
        charges.push({ x: pos.x, y: pos.y, q: -placeMag });
        drawAll();
      }
      touchTimer = null;
    }, 500);
  }, { passive: false });

  canvas.addEventListener('touchend', function (e) {
    if (touchTimer !== null) {
      clearTimeout(touchTimer);
      touchTimer = null;
      if (charges.length < maxCharges) {
        var pos = SimUtils.getPointerPos(canvas, e.changedTouches ? e : e);
        // Use last known position from touchstart
        var last = charges.length > 0 ? charges[charges.length - 1] : null;
        if (!last || SimUtils.dist(last.x, last.y, 0, 0) > 0) {
          // Already placed via long press? skip
        }
      }
    }
  });

  function eField(x, y) {
    var ex = 0, ey = 0;
    for (var i = 0; i < charges.length; i++) {
      var c = charges[i];
      var dx = x - c.x, dy = y - c.y;
      var r2 = dx * dx + dy * dy;
      if (r2 < 25) r2 = 25;
      var r = Math.sqrt(r2);
      var e = c.q / r2;
      ex += e * dx / r;
      ey += e * dy / r;
    }
    return { x: ex, y: ey };
  }

  function potential(x, y) {
    var v = 0;
    for (var i = 0; i < charges.length; i++) {
      var c = charges[i];
      var r = SimUtils.dist(x, y, c.x, c.y);
      if (r < 5) r = 5;
      v += c.q / r;
    }
    return v;
  }

  function drawFieldLine(startX, startY, direction) {
    var ds = direction * 3;
    var px = startX, py = startY;
    var points = [{ x: px, y: py }];

    for (var step = 0; step < 300; step++) {
      var next = SimUtils.rk4Step(px, py,
        function (x, y) { var e = eField(x, y); var m = Math.sqrt(e.x * e.x + e.y * e.y) + 1e-10; return e.x / m; },
        function (x, y) { var e = eField(x, y); var m = Math.sqrt(e.x * e.x + e.y * e.y) + 1e-10; return e.y / m; },
        ds
      );
      px = next.x;
      py = next.y;
      if (px < -20 || px > W + 20 || py < -20 || py > H + 20) break;

      // Check if near any charge
      var nearCharge = false;
      for (var i = 0; i < charges.length; i++) {
        if (SimUtils.dist(px, py, charges[i].x, charges[i].y) < 8) {
          nearCharge = true;
          break;
        }
      }
      if (nearCharge) break;
      points.push({ x: px, y: py });
    }
    return points;
  }

  function drawAll() {
    ctx.clearRect(0, 0, W, H);

    if (charges.length === 0) {
      ctx.font = '14px Inter';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'center';
      ctx.fillText('Click to place positive charges, right-click for negative (max 8)', W / 2, H / 2);
      return;
    }

    // Equipotential contours
    if (showEquipotentials) {
      var step = 4;
      var imgData = ctx.createImageData(Math.ceil(W / step), Math.ceil(H / step));
      var data = imgData.data;
      var potentials = [];

      for (var py = 0; py < H; py += step) {
        for (var px = 0; px < W; px += step) {
          potentials.push(potential(px, py));
        }
      }

      var maxP = 0;
      potentials.forEach(function (v) { if (Math.abs(v) > maxP) maxP = Math.abs(v); });
      if (maxP === 0) maxP = 1;

      var idx = 0;
      for (var i = 0; i < potentials.length; i++) {
        var t = (potentials[i] / maxP + 1) / 2; // map to 0-1
        var col = SimUtils.viridis(t);
        var matches = col.match(/\d+/g);
        data[idx] = parseInt(matches[0]);
        data[idx + 1] = parseInt(matches[1]);
        data[idx + 2] = parseInt(matches[2]);
        data[idx + 3] = 60;
        idx += 4;
      }
      ctx.putImageData(imgData, 0, 0);
      // Scale up
      var tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgData.width;
      tempCanvas.height = imgData.height;
      tempCanvas.getContext('2d').putImageData(imgData, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tempCanvas, 0, 0, W, H);
    }

    // Field lines from positive charges
    var linesPerCharge = 16;
    charges.forEach(function (ch) {
      if (ch.q <= 0) return;
      for (var i = 0; i < linesPerCharge; i++) {
        var angle = (i / linesPerCharge) * Math.PI * 2;
        var sx = ch.x + 10 * Math.cos(angle);
        var sy = ch.y + 10 * Math.sin(angle);
        var pts = drawFieldLine(sx, sy, 1);
        if (pts.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var j = 1; j < pts.length; j++) {
          ctx.lineTo(pts[j].x, pts[j].y);
        }

        // Color by local field strength
        var midPt = pts[Math.floor(pts.length / 2)];
        var eMid = eField(midPt.x, midPt.y);
        var eMag = Math.sqrt(eMid.x * eMid.x + eMid.y * eMid.y);
        var t = SimUtils.clamp(eMag * 50, 0, 1);
        ctx.strokeStyle = SimUtils.viridis(t);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // If only negative charges, draw lines inward
    var hasPositive = charges.some(function (c) { return c.q > 0; });
    if (!hasPositive) {
      charges.forEach(function (ch) {
        for (var i = 0; i < linesPerCharge; i++) {
          var angle = (i / linesPerCharge) * Math.PI * 2;
          var sx = ch.x + 10 * Math.cos(angle);
          var sy = ch.y + 10 * Math.sin(angle);
          var pts = drawFieldLine(sx, sy, -1);
          if (pts.length < 2) continue;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = '#4fc3f7';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    }

    // Draw charges
    charges.forEach(function (ch) {
      ctx.beginPath();
      ctx.arc(ch.x, ch.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = ch.q >= 0 ? '#ef5350' : '#4fc3f7';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch.q >= 0 ? '+' : '−', ch.x, ch.y);
    });
  }

  drawAll();

  // Reset
  var container = document.getElementById('fieldlines-sim');
  if (container) {
    var resetBtn = container.querySelector('.btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        charges = [];
        showEquipotentials = false;
        if (equipBtn) equipBtn.textContent = 'Equipotentials: OFF';
        drawAll();
      });
    }
  }

  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
    drawAll();
  });
})();
