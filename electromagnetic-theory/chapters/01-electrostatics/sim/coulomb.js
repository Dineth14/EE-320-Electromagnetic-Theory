/* ============================================================
   Coulomb Force Simulator
   Drag two charges, see force vectors update in real time.
   ============================================================ */
(function () {
  'use strict';
  var canvas = document.getElementById('canvas-coulomb');
  if (!canvas) return;

  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  var k = 8.99e9; // Coulomb constant
  var charges = [
    { x: W * 0.35, y: H * 0.5, q: 5 },
    { x: W * 0.65, y: H * 0.5, q: -3 }
  ];

  var dragging = null;

  // Slider elements
  var q1Slider = document.getElementById('coulomb-q1');
  var q2Slider = document.getElementById('coulomb-q2');
  var q1Val = document.getElementById('coulomb-q1-val');
  var q2Val = document.getElementById('coulomb-q2-val');
  var forceVal = document.getElementById('coulomb-force-val');

  function updateSliderDisplay() {
    charges[0].q = parseFloat(q1Slider.value);
    charges[1].q = parseFloat(q2Slider.value);
    q1Val.textContent = (charges[0].q > 0 ? '+' : '') + charges[0].q.toFixed(1) + ' μC';
    q2Val.textContent = (charges[1].q > 0 ? '+' : '') + charges[1].q.toFixed(1) + ' μC';
  }

  if (q1Slider) q1Slider.addEventListener('input', updateSliderDisplay);
  if (q2Slider) q2Slider.addEventListener('input', updateSliderDisplay);

  function getChargeColor(q) {
    return q >= 0 ? '#ef5350' : '#4fc3f7';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy < H; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    var c1 = charges[0], c2 = charges[1];
    var dx = c2.x - c1.x, dy = c2.y - c1.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) dist = 10;

    // Force magnitude (using pixel distance as analog)
    var rMeters = dist / 100; // scaled
    var forceMag = k * Math.abs(c1.q * 1e-6) * Math.abs(c2.q * 1e-6) / (rMeters * rMeters);
    var attractive = (c1.q * c2.q) < 0;

    if (forceVal) forceVal.textContent = forceMag.toExponential(2) + ' N';

    // Force direction
    var ux = dx / dist, uy = dy / dist;
    var arrowLen = SimUtils.clamp(forceMag * 1e-4, 15, 100);

    // Draw dashed line between charges
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.moveTo(c1.x, c1.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance label
    ctx.font = '12px JetBrains Mono';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('r = ' + rMeters.toFixed(2) + ' m', (c1.x + c2.x) / 2, (c1.y + c2.y) / 2 - 10);

    // Force arrows on charge 1
    if (attractive) {
      SimUtils.drawArrow(ctx, c1.x, c1.y, c1.x + ux * arrowLen, c1.y + uy * arrowLen, '#66bb6a', 10);
      SimUtils.drawArrow(ctx, c2.x, c2.y, c2.x - ux * arrowLen, c2.y - uy * arrowLen, '#66bb6a', 10);
    } else {
      SimUtils.drawArrow(ctx, c1.x, c1.y, c1.x - ux * arrowLen, c1.y - uy * arrowLen, '#ef5350', 10);
      SimUtils.drawArrow(ctx, c2.x, c2.y, c2.x + ux * arrowLen, c2.y + uy * arrowLen, '#ef5350', 10);
    }

    // Draw charges
    charges.forEach(function (ch, i) {
      // Glow
      var grad = ctx.createRadialGradient(ch.x, ch.y, 0, ch.x, ch.y, 30);
      var col = getChargeColor(ch.q);
      grad.addColorStop(0, col + '40');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(ch.x - 30, ch.y - 30, 60, 60);

      // Circle
      ctx.beginPath();
      ctx.arc(ch.x, ch.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch.q >= 0 ? '+' : '−', ch.x, ch.y);

      // q label below
      ctx.font = '11px JetBrains Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('q' + (i + 1) + ' = ' + (ch.q > 0 ? '+' : '') + ch.q.toFixed(1) + ' μC', ch.x, ch.y + 32);
    });

    // Force type label
    ctx.font = 'bold 13px Inter';
    ctx.fillStyle = attractive ? '#66bb6a' : '#ef5350';
    ctx.textAlign = 'center';
    ctx.fillText(attractive ? 'Attractive' : 'Repulsive', W / 2, 25);
  }

  // Mouse / Touch interaction
  function pointerDown(e) {
    e.preventDefault();
    var pos = SimUtils.getPointerPos(canvas, e);
    for (var i = 0; i < charges.length; i++) {
      if (SimUtils.dist(pos.x, pos.y, charges[i].x, charges[i].y) < 25) {
        dragging = i;
        return;
      }
    }
  }
  function pointerMove(e) {
    if (dragging === null) return;
    e.preventDefault();
    var pos = SimUtils.getPointerPos(canvas, e);
    charges[dragging].x = SimUtils.clamp(pos.x, 20, W - 20);
    charges[dragging].y = SimUtils.clamp(pos.y, 20, H - 20);
  }
  function pointerUp() { dragging = null; }

  canvas.addEventListener('mousedown', pointerDown);
  canvas.addEventListener('mousemove', pointerMove);
  canvas.addEventListener('mouseup', pointerUp);
  canvas.addEventListener('mouseleave', pointerUp);
  canvas.addEventListener('touchstart', pointerDown, { passive: false });
  canvas.addEventListener('touchmove', pointerMove, { passive: false });
  canvas.addEventListener('touchend', pointerUp);

  var loop = SimUtils.createLoop(function () { updateSliderDisplay(); draw(); });

  function reset() {
    charges[0].x = W * 0.35; charges[0].y = H * 0.5;
    charges[1].x = W * 0.65; charges[1].y = H * 0.5;
    if (q1Slider) q1Slider.value = 5;
    if (q2Slider) q2Slider.value = -3;
  }

  SimUtils.setupControls('coulomb-sim', loop, reset);

  // Resize handler
  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
  });
})();
