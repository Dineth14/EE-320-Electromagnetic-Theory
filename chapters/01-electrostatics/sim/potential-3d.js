/* ============================================================
   3D Potential Surface — Two charges rendered with Three.js
   ============================================================ */
(function () {
  'use strict';

  var container = document.getElementById('potential-3d');
  if (!container || typeof THREE === 'undefined') return;

  var width = container.clientWidth;
  var height = container.clientHeight || 400;

  // Scene setup
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);

  var camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  camera.position.set(0, 8, 12);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // Parameters
  var q1 = 5, q2 = -5, sep = 3;
  var gridSize = 60;
  var range = 6;

  // Sliders
  var q1Slider = document.getElementById('pot-q1');
  var q2Slider = document.getElementById('pot-q2');
  var sepSlider = document.getElementById('pot-sep');
  var q1ValEl = document.getElementById('pot-q1-val');
  var q2ValEl = document.getElementById('pot-q2-val');
  var sepValEl = document.getElementById('pot-sep-val');

  function updateParams() {
    if (q1Slider) q1 = parseInt(q1Slider.value);
    if (q2Slider) q2 = parseInt(q2Slider.value);
    if (sepSlider) sep = parseFloat(sepSlider.value);
    if (q1ValEl) q1ValEl.textContent = (q1 > 0 ? '+' : '') + q1;
    if (q2ValEl) q2ValEl.textContent = (q2 > 0 ? '+' : '') + q2;
    if (sepValEl) sepValEl.textContent = sep.toFixed(1);
    buildSurface();
  }

  if (q1Slider) q1Slider.addEventListener('input', updateParams);
  if (q2Slider) q2Slider.addEventListener('input', updateParams);
  if (sepSlider) sepSlider.addEventListener('input', updateParams);

  // Lighting
  var ambientLight = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambientLight);
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // Grid helper
  var gridHelper = new THREE.GridHelper(12, 20, 0x263053, 0x1a2035);
  gridHelper.position.y = -3;
  scene.add(gridHelper);

  var surfaceMesh = null;

  function computePotential(x, z) {
    var x1 = -sep / 2, x2 = sep / 2;
    var r1 = Math.sqrt((x - x1) * (x - x1) + z * z);
    var r2 = Math.sqrt((x - x2) * (x - x2) + z * z);
    if (r1 < 0.2) r1 = 0.2;
    if (r2 < 0.2) r2 = 0.2;
    return q1 / r1 + q2 / r2;
  }

  function buildSurface() {
    if (surfaceMesh) {
      scene.remove(surfaceMesh);
      surfaceMesh.geometry.dispose();
      surfaceMesh.material.dispose();
    }

    var geometry = new THREE.PlaneBufferGeometry(range * 2, range * 2, gridSize, gridSize);
    var positions = geometry.attributes.position.array;
    var colors = new Float32Array(positions.length);

    var maxV = 0;
    var vals = [];
    for (var i = 0; i < positions.length; i += 3) {
      var x = positions[i];
      var z = positions[i + 1];
      var v = computePotential(x, z);
      v = Math.max(-8, Math.min(8, v)); // clamp
      vals.push(v);
      if (Math.abs(v) > maxV) maxV = Math.abs(v);
    }

    if (maxV === 0) maxV = 1;

    for (var i = 0; i < positions.length; i += 3) {
      var idx = i / 3;
      var v = vals[idx];
      positions[i + 2] = v * 0.4; // height
      // Color: positive = red-gold, negative = blue
      var t = (v / maxV + 1) / 2;
      colors[i] = t; // R
      colors[i + 1] = 0.3 + 0.4 * (1 - Math.abs(v / maxV)); // G
      colors[i + 2] = 1 - t; // B
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Rotate to XZ plane
    geometry.rotateX(-Math.PI / 2);

    var material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      shininess: 40,
      transparent: true,
      opacity: 0.9
    });

    surfaceMesh = new THREE.Mesh(geometry, material);
    scene.add(surfaceMesh);

    // Charge markers
    scene.children.forEach(function (child) {
      if (child.userData && child.userData.isCharge) scene.remove(child);
    });

    var sphereGeo = new THREE.SphereBufferGeometry(0.15, 16, 16);
    var mat1 = new THREE.MeshPhongMaterial({ color: q1 >= 0 ? 0xef5350 : 0x4fc3f7, emissive: q1 >= 0 ? 0x441111 : 0x112244 });
    var mat2 = new THREE.MeshPhongMaterial({ color: q2 >= 0 ? 0xef5350 : 0x4fc3f7, emissive: q2 >= 0 ? 0x441111 : 0x112244 });

    var s1 = new THREE.Mesh(sphereGeo, mat1);
    s1.position.set(-sep / 2, computePotential(-sep / 2, 0) * 0.4, 0);
    s1.userData.isCharge = true;
    scene.add(s1);

    var s2 = new THREE.Mesh(sphereGeo.clone(), mat2);
    s2.position.set(sep / 2, computePotential(sep / 2, 0) * 0.4, 0);
    s2.userData.isCharge = true;
    scene.add(s2);
  }

  buildSurface();

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Reset
  var simContainer = document.getElementById('potential-sim');
  if (simContainer) {
    var resetBtn = simContainer.querySelector('.btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (q1Slider) q1Slider.value = 5;
        if (q2Slider) q2Slider.value = -5;
        if (sepSlider) sepSlider.value = 3;
        camera.position.set(0, 8, 12);
        camera.lookAt(0, 0, 0);
        updateParams();
      });
    }
  }

  window.addEventListener('resize', function () {
    width = container.clientWidth;
    height = container.clientHeight || 400;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
})();
