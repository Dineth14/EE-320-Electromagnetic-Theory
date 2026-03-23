/* ============================================================
   Shared Simulation Utilities
   ============================================================ */
var SimUtils = (function () {
  'use strict';

  /* --- High-DPI Canvas Setup --- */
  function initCanvas(canvasEl) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvasEl.getBoundingClientRect();
    canvasEl.width = rect.width * dpr;
    canvasEl.height = rect.height * dpr;
    var ctx = canvasEl.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: rect.width, h: rect.height, dpr: dpr };
  }

  /* --- Animation Loop with delta-time --- */
  function createLoop(updateFn) {
    var running = true;
    var lastTime = 0;
    var rafId = null;

    function tick(timestamp) {
      if (!running) return;
      var dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
      dt = Math.min(dt, 0.05); // cap
      lastTime = timestamp;
      updateFn(dt, timestamp);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return {
      pause: function () { running = false; },
      play: function () { if (!running) { running = true; lastTime = 0; rafId = requestAnimationFrame(tick); } },
      toggle: function () { if (running) this.pause(); else this.play(); return running; },
      isRunning: function () { return running; },
      destroy: function () { running = false; if (rafId) cancelAnimationFrame(rafId); }
    };
  }

  /* --- RK4 Integrator (2D) --- */
  function rk4Step(x, y, dxFn, dyFn, ds) {
    var k1x = dxFn(x, y);
    var k1y = dyFn(x, y);
    var k2x = dxFn(x + 0.5 * ds * k1x, y + 0.5 * ds * k1y);
    var k2y = dyFn(x + 0.5 * ds * k1x, y + 0.5 * ds * k1y);
    var k3x = dxFn(x + 0.5 * ds * k2x, y + 0.5 * ds * k2y);
    var k3y = dyFn(x + 0.5 * ds * k2x, y + 0.5 * ds * k2y);
    var k4x = dxFn(x + ds * k3x, y + ds * k3y);
    var k4y = dyFn(x + ds * k3x, y + ds * k3y);
    return {
      x: x + (ds / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
      y: y + (ds / 6) * (k1y + 2 * k2y + 2 * k3y + k4y)
    };
  }

  /* --- 3D RK4 step --- */
  function rk4Step3D(state, derivFn, dt) {
    // state = [x, y, z, vx, vy, vz]
    var k1 = derivFn(state);
    var s2 = state.map(function (v, i) { return v + 0.5 * dt * k1[i]; });
    var k2 = derivFn(s2);
    var s3 = state.map(function (v, i) { return v + 0.5 * dt * k2[i]; });
    var k3 = derivFn(s3);
    var s4 = state.map(function (v, i) { return v + dt * k3[i]; });
    var k4 = derivFn(s4);
    return state.map(function (v, i) {
      return v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    });
  }

  /* --- Viridis-like colormap --- */
  function viridis(t) {
    t = Math.max(0, Math.min(1, t));
    var r = Math.round(255 * (0.267 + t * (0.329 + t * (-1.44 + t * 1.85))));
    var g = Math.round(255 * (0.004 + t * (1.42 + t * (-1.07 + t * 0.37))));
    var b = Math.round(255 * (0.329 + t * (1.44 + t * (-3.32 + t * 2.16))));
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* --- Draw arrow --- */
  function drawArrow(ctx, x1, y1, x2, y2, color, headLen) {
    headLen = headLen || 8;
    var dx = x2 - x1, dy = y2 - y1;
    var angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  /* --- Distance --- */
  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  }

  /* --- Clamp --- */
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  /* --- Setup pause/play/reset buttons --- */
  function setupControls(containerId, loop, resetFn) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var pauseBtn = container.querySelector('.btn-pause');
    var resetBtn = container.querySelector('.btn-reset');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        var running = loop.toggle();
        pauseBtn.textContent = running ? '⏸ Pause' : '▶ Play';
      });
    }
    if (resetBtn && resetFn) {
      resetBtn.addEventListener('click', function () {
        resetFn();
      });
    }
  }

  /* --- Mouse / Touch helpers --- */
  function getPointerPos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    var clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  return {
    initCanvas: initCanvas,
    createLoop: createLoop,
    rk4Step: rk4Step,
    rk4Step3D: rk4Step3D,
    viridis: viridis,
    drawArrow: drawArrow,
    dist: dist,
    clamp: clamp,
    setupControls: setupControls,
    getPointerPos: getPointerPos
  };
})();
