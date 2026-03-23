/* ============================================================
   Charged Particle in E and B Fields
   RK4 integration, cyclotron / helical / drift orbits
   ============================================================ */
(function () {
  'use strict';
  var canvas = document.getElementById('canvas-particle');
  if (!canvas) return;

  var info = SimUtils.initCanvas(canvas);
  var ctx = info.ctx, W = info.w, H = info.h;

  // Parameters (displayed as 2D projection of 3D motion)
  var Bz = 2.0;  // T, into the screen
  var Ey = 0.0;  // V/m
  var v0x = 2.0; // initial velocity x
  var v0z = 0.0; // velocity along B (into screen, affects helix pitch)
  var qm = 1.0;  // charge/mass ratio (normalized)

  var bzSlider = document.getElementById('particle-bz');
  var eySlider = document.getElementById('particle-ey');
  var vxSlider = document.getElementById('particle-vx');
  var vzSlider = document.getElementById('particle-vz');
  var bzVal = document.getElementById('particle-bz-val');
  var eyVal = document.getElementById('particle-ey-val');
  var vxVal = document.getElementById('particle-vx-val');
  var vzVal = document.getElementById('particle-vz-val');

  function readSliders() {
    if (bzSlider) Bz = parseFloat(bzSlider.value);
    if (eySlider) Ey = parseFloat(eySlider.value);
    if (vxSlider) v0x = parseFloat(vxSlider.value);
    if (vzSlider) v0z = parseFloat(vzSlider.value);
    if (bzVal) bzVal.textContent = Bz.toFixed(1) + ' T';
    if (eyVal) eyVal.textContent = Ey.toFixed(1) + ' V/m';
    if (vxVal) vxVal.textContent = v0x.toFixed(1) + ' m/s';
    if (vzVal) vzVal.textContent = v0z.toFixed(1) + ' m/s';
  }

  [bzSlider, eySlider, vxSlider, vzSlider].forEach(function (s) {
    if (s) s.addEventListener('input', function () {
      readSliders();
      resetTrajectory();
    });
  });

  var trail = [];
  var state = [0, 0, 0, 0]; // x, y, vx, vy

  function resetTrajectory() {
    state = [W * 0.2, H * 0.5, v0x * 30, 0]; // scale velocities for display
    trail = [];
  }

  readSliders();
  resetTrajectory();

  // Equations of motion: F = q(E + v×B)
  // For 2D projection (x-y plane), B along z (into screen):
  // ax = (q/m)(Ex + vy*Bz)
  // ay = (q/m)(Ey - vx*Bz)
  function derivs(s) {
    var vx = s[2], vy = s[3];
    var ax = qm * (vy * Bz);
    var ay = qm * (Ey * 30 - vx * Bz); // scale Ey for display
    return [vx, vy, ax, ay];
  }

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy < H; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // B field indicators (crosses for into screen)
    if (Bz > 0) {
      ctx.font = '10px Inter';
      ctx.fillStyle = 'rgba(79,195,247,0.15)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var bx = 30; bx < W; bx += 60) {
        for (var by = 30; by < H; by += 60) {
          ctx.fillText('×', bx, by);
        }
      }
      ctx.fillStyle = 'rgba(79,195,247,0.4)';
      ctx.font = '12px Inter';
      ctx.textAlign = 'right';
      ctx.fillText('B = ' + Bz.toFixed(1) + ' T (into screen)', W - 10, 20);
    }

    // E field indicator
    if (Math.abs(Ey) > 0.01) {
      ctx.fillStyle = 'rgba(255,213,79,0.4)';
      ctx.font = '12px Inter';
      ctx.textAlign = 'right';
      ctx.fillText('E = ' + Ey.toFixed(1) + ' V/m (vertical)', W - 10, 38);
      // Draw E arrows on left
      for (var yy = 40; yy < H; yy += 60) {
        var edir = Ey > 0 ? -15 : 15;
        SimUtils.drawArrow(ctx, 15, yy, 15, yy + edir, 'rgba(255,213,79,0.3)', 4);
      }
    }

    // Integrate with small sub-steps for accuracy
    var subSteps = 8;
    var subDt = dt / subSteps;
    for (var i = 0; i < subSteps; i++) {
      state = SimUtils.rk4Step3D(state, derivs, subDt * 60); // time scale
      trail.push({ x: state[0], y: state[1] });
    }

    // Keep trail manageable
    if (trail.length > 3000) trail = trail.slice(trail.length - 3000);

    // Wrap around if particle leaves bounds
    if (state[0] < -50 || state[0] > W + 50 || state[1] < -50 || state[1] > H + 50) {
      state[0] = W * 0.2;
      state[1] = H * 0.5;
    }

    // Draw trail
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (var i = 1; i < trail.length; i++) {
        ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.strokeStyle = 'rgba(102, 187, 106, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Glow near end
      var lastN = Math.min(100, trail.length);
      ctx.beginPath();
      ctx.moveTo(trail[trail.length - lastN].x, trail[trail.length - lastN].y);
      for (var i = trail.length - lastN + 1; i < trail.length; i++) {
        ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.strokeStyle = '#66bb6a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Draw particle
    var px = state[0], py = state[1];
    var grad = ctx.createRadialGradient(px, py, 0, px, py, 15);
    grad.addColorStop(0, 'rgba(102,187,106,0.5)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(px - 15, py - 15, 30, 30);

    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#66bb6a';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', px, py);

    // Velocity vector
    var vScale = 3;
    SimUtils.drawArrow(ctx, px, py, px + state[2] * vScale, py + state[3] * vScale, '#ffd54f', 6);

    // Info
    var speed = Math.sqrt(state[2] * state[2] + state[3] * state[3]);
    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('|v| = ' + (speed / 30).toFixed(2) + ' m/s', 10, H - 10);

    if (v0z > 0) {
      ctx.fillText('vz = ' + v0z.toFixed(1) + ' m/s → helical motion (3D)', 10, H - 28);
    }
  }

  var loop = SimUtils.createLoop(draw);

  SimUtils.setupControls('particle-sim', loop, function () {
    readSliders();
    resetTrajectory();
  });

  window.addEventListener('resize', function () {
    info = SimUtils.initCanvas(canvas);
    ctx = info.ctx; W = info.w; H = info.h;
    resetTrajectory();
  });
})();
