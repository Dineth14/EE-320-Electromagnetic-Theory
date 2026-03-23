/* ============================================================
   Magnetic Dipole 3D — Three.js visualization
   ============================================================ */
(function () {
  'use strict';
  var container = document.getElementById('dipole-3d');
  if (!container || typeof THREE === 'undefined') return;

  var width = container.clientWidth;
  var height = container.clientHeight || 400;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);

  var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(5, 4, 8);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0x404060, 0.5));
  var dLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dLight.position.set(5, 10, 5);
  scene.add(dLight);

  // Dipole (small sphere)
  var dipoleGeo = new THREE.SphereBufferGeometry(0.2, 16, 16);
  var dipoleMat = new THREE.MeshPhongMaterial({ color: 0xffd54f, emissive: 0x443300 });
  var dipoleMesh = new THREE.Mesh(dipoleGeo, dipoleMat);
  scene.add(dipoleMesh);

  // Arrow showing m direction
  var arrowDir = new THREE.Vector3(0, 1, 0);
  var arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, 0), 1.5, 0xffd54f, 0.3, 0.15);
  scene.add(arrowHelper);

  var momentSlider = document.getElementById('dipole-moment');
  var momentValEl = document.getElementById('dipole-moment-val');
  var mMag = 5;

  if (momentSlider) momentSlider.addEventListener('input', function () {
    mMag = parseFloat(this.value);
    if (momentValEl) momentValEl.textContent = mMag.toFixed(1);
    buildFieldLines();
  });

  var fieldLineGroup = new THREE.Group();
  scene.add(fieldLineGroup);

  function dipoleField(x, y, z) {
    var r = Math.sqrt(x * x + y * y + z * z);
    if (r < 0.3) r = 0.3;
    var r3 = r * r * r;
    var r5 = r3 * r * r;
    var mDotR = mMag * y; // m is along y
    var Bx = (3 * mDotR * x) / r5;
    var By = (3 * mDotR * y) / r5 - mMag / r3;
    var Bz = (3 * mDotR * z) / r5;
    return new THREE.Vector3(Bx, By, Bz);
  }

  function buildFieldLines() {
    // Clear old
    while (fieldLineGroup.children.length > 0) {
      var child = fieldLineGroup.children[0];
      fieldLineGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    var numLines = 12;
    var ds = 0.08;
    var maxSteps = 300;

    for (var i = 0; i < numLines; i++) {
      var phi = (i / numLines) * Math.PI * 2;
      var startR = 0.3;
      var startX = startR * Math.cos(phi);
      var startY = startR;
      var startZ = startR * Math.sin(phi);

      var points = [];
      var px = startX, py = startY, pz = startZ;

      for (var step = 0; step < maxSteps; step++) {
        points.push(new THREE.Vector3(px, py, pz));
        var B = dipoleField(px, py, pz);
        var Bmag = B.length();
        if (Bmag < 1e-10) break;
        B.normalize().multiplyScalar(ds);
        px += B.x; py += B.y; pz += B.z;
        var r = Math.sqrt(px * px + py * py + pz * pz);
        if (r > 8 || r < 0.2) break;
      }

      if (points.length > 2) {
        var curve = new THREE.CatmullRomCurve3(points);
        var tubeGeo = new THREE.TubeBufferGeometry(curve, points.length, 0.02, 4, false);
        var tubeMat = new THREE.MeshPhongMaterial({
          color: 0x4fc3f7,
          transparent: true,
          opacity: 0.7
        });
        fieldLineGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
      }
    }

    // Also lines starting downward
    for (var i = 0; i < numLines; i++) {
      var phi = (i / numLines) * Math.PI * 2;
      var startR = 0.3;
      var px = startR * Math.cos(phi);
      var py = -startR;
      var pz = startR * Math.sin(phi);

      var points = [];
      for (var step = 0; step < maxSteps; step++) {
        points.push(new THREE.Vector3(px, py, pz));
        var B = dipoleField(px, py, pz);
        var Bmag = B.length();
        if (Bmag < 1e-10) break;
        B.normalize().multiplyScalar(-ds); // reverse direction
        px += B.x; py += B.y; pz += B.z;
        var r = Math.sqrt(px * px + py * py + pz * pz);
        if (r > 8 || r < 0.2) break;
      }

      if (points.length > 2) {
        var curve = new THREE.CatmullRomCurve3(points);
        var tubeGeo = new THREE.TubeBufferGeometry(curve, points.length, 0.02, 4, false);
        var tubeMat = new THREE.MeshPhongMaterial({
          color: 0x4fc3f7,
          transparent: true,
          opacity: 0.5
        });
        fieldLineGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
      }
    }
  }

  buildFieldLines();

  // Rotate dipole slowly
  var time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    dipoleMesh.rotation.x = Math.sin(time * 0.5) * 0.1;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Reset
  var simContainer = document.getElementById('dipole-sim');
  if (simContainer) {
    var resetBtn = simContainer.querySelector('.btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      camera.position.set(5, 4, 8);
      camera.lookAt(0, 0, 0);
      if (momentSlider) momentSlider.value = 5;
      mMag = 5;
      if (momentValEl) momentValEl.textContent = '5.0';
      buildFieldLines();
    });
  }

  window.addEventListener('resize', function () {
    width = container.clientWidth;
    height = container.clientHeight || 400;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
})();
