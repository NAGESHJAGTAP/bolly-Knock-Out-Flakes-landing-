/* =========================================================
   BOLLY — INTERACTIVE 3D SHAMPOO BOTTLE (Three.js)
   Procedurally modelled bottle + canvas-generated label,
   draggable with mouse (desktop) and touch (mobile).
   Requires: three.min.js loaded before this file.
   Mount point: <div id="bolly-bottle-canvas"></div>
   ========================================================= */

(function () {
  "use strict";

  function initBollyBottle(containerId) {
    const container = document.getElementById(containerId);
    if (!container || typeof THREE === "undefined") return;

    const PURPLE = 0x6c4fe0;
    const PURPLE_DARK = 0x5133b8;

    // ---------- scene / camera / renderer ----------
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      32,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.15, 6.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // ---------- lights ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 5, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xd8c9ff, 0.6);
    fill.position.set(-4, 1, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(-2, -3, -4);
    scene.add(rim);

    // ---------- bottle group ----------
    const bottle = new THREE.Group();
    scene.add(bottle);

    // Body — slightly barrel-shaped cylinder via Lathe for a soft profile
    const profilePts = [
      new THREE.Vector2(0.0, -1.15),
      new THREE.Vector2(0.98, -1.15),
      new THREE.Vector2(1.05, -1.0),
      new THREE.Vector2(1.08, -0.5),
      new THREE.Vector2(1.08, 0.55),
      new THREE.Vector2(1.0, 0.85),
      new THREE.Vector2(0.66, 0.98),
      new THREE.Vector2(0.66, 1.12),
      new THREE.Vector2(0.0, 1.12),
    ];
    const bodyGeo = new THREE.LatheGeometry(profilePts, 64);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: PURPLE,
      roughness: 0.28,
      metalness: 0.05,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      sheen: 0.15,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    bottle.add(body);

    // Neck collar (darker ring)
    const collarGeo = new THREE.CylinderGeometry(0.68, 0.66, 0.08, 48);
    const collarMat = new THREE.MeshPhysicalMaterial({ color: PURPLE_DARK, roughness: 0.3 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.y = 1.16;
    bottle.add(collar);

    // Pump housing (white)
    const whiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xf7f6fa,
      roughness: 0.35,
      clearcoat: 0.4,
    });

    const pumpBase = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.55, 48), whiteMat);
    pumpBase.position.y = 1.5;
    bottle.add(pumpBase);

    const pumpNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.6, 32), whiteMat);
    pumpNeck.position.y = 2.05;
    bottle.add(pumpNeck);

    const pumpHeadGeo = new THREE.CapsuleGeometry(0.34, 0.55, 4, 16);
    const pumpHead = new THREE.Mesh(pumpHeadGeo, whiteMat);
    pumpHead.rotation.z = Math.PI / 2;
    pumpHead.position.set(0.18, 2.4, 0);
    bottle.add(pumpHead);

    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.32, 16), whiteMat);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(0.55, 2.4, 0);
    bottle.add(nozzle);

    // ---------- label (real product photo wrapped on a curved decal) ----------
    // Uses the actual uploaded bottle photo (cropped to the body/label area,
    // pump excluded since the pump is already a real 3D mesh above).
    const LABEL_IMAGE_URL =
      (window.BOLLY_LABEL_IMAGE_URL) || "assets/img/bottle-label-crop.png";

    const labelGeo = new THREE.CylinderGeometry(1.085, 1.085, 1.9, 64, 1, true, -0.95, 1.9);
    const labelMat = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.FrontSide,
      toneMapped: false,
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.y = -0.05;
    bottle.add(label);

    new THREE.TextureLoader().load(LABEL_IMAGE_URL, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
      tex.flipY = true;
      labelMat.map = tex;
      labelMat.needsUpdate = true;
    });

    bottle.scale.set(0.92, 0.92, 0.92);
    bottle.position.y = -0.1;

    // ---------- drag-to-rotate (mouse + touch) ----------
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let velocityY = 0;
    let autoRotate = true;

    function onPointerDown(x, y) {
      isDragging = true;
      autoRotate = false;
      prevX = x;
      prevY = y;
      velocityY = 0;
    }
    function onPointerMove(x, y) {
      if (!isDragging) return;
      const dx = x - prevX;
      const dy = y - prevY;
      bottle.rotation.y += dx * 0.01;
      bottle.rotation.x += dy * 0.006;
      bottle.rotation.x = Math.max(-0.4, Math.min(0.4, bottle.rotation.x));
      velocityY = dx * 0.01;
      prevX = x;
      prevY = y;
    }
    function onPointerUp() {
      isDragging = false;
    }

    const dom = renderer.domElement;

    // Mouse
    dom.addEventListener("mousedown", (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener("mousemove", (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener("mouseup", onPointerUp);

    // Touch
    dom.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        onPointerDown(t.clientX, t.clientY);
      },
      { passive: true }
    );
    dom.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        onPointerMove(t.clientX, t.clientY);
        e.preventDefault();
      },
      { passive: false }
    );
    window.addEventListener("touchend", onPointerUp);

    // resume gentle auto-rotate after inactivity
    let idleTimer = null;
    function resetIdleTimer() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        autoRotate = true;
      }, 2200);
    }
    dom.addEventListener("mousedown", resetIdleTimer);
    dom.addEventListener("touchstart", resetIdleTimer);
    window.addEventListener("mouseup", resetIdleTimer);
    window.addEventListener("touchend", resetIdleTimer);

    // ---------- resize ----------
    function handleResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    // ---------- render loop ----------
    function animate() {
      requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        bottle.rotation.y += 0.0035;
      } else if (!isDragging) {
        // inertia decay
        bottle.rotation.y += velocityY;
        velocityY *= 0.92;
      }

      renderer.render(scene, camera);
    }
    animate();
  }

  // expose globally so the page can call it after DOM ready
  window.initBollyBottle = initBollyBottle;

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("bolly-bottle-canvas")) {
      initBollyBottle("bolly-bottle-canvas");
    }
  });
})();
