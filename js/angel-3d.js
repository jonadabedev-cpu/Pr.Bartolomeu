/**
 * ==========================================================================
 * MÉTODO KAIRÓS® — angel-3d.js
 * Elemento 3D autoral (halo + asas + núcleo de luz) construído com Three.js,
 * renderizado com fundo transparente para se fundir naturalmente com o
 * azul-marinho da página — sem depender de serviços externos, contas ou
 * marcas d'água.
 * ==========================================================================
 */

/* Este arquivo é carregado como <script> comum (NÃO type="module"),
   logo usa a variável global THREE, criada por js/vendor/three.min.js,
   que precisa estar incluído ANTES deste arquivo no HTML. */
(function () {
  "use strict";

  if (typeof THREE === "undefined") {
    console.error(
      "[angel-3d] THREE não foi encontrado. Verifique se js/vendor/three.min.js foi carregado ANTES de js/angel-3d.js no seu HTML."
    );
    return;
  }

  const container = document.getElementById("angel3d");
  if (!container) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* --------------------------------------------------------------------
   * CORES DA MARCA (mesmas variáveis do CSS, espelhadas aqui em hex)
   * ------------------------------------------------------------------ */
  const GOLD_BRIGHT = 0xf3e3c2;
  const GOLD_MID = 0xc99d5b;
  const GOLD_DEEP = 0x9c7638;
  const CREAM = 0xf6f2ea;

  /* --------------------------------------------------------------------
   * RENDERER — fundo transparente (alpha: true) para herdar a cor da página
   * ------------------------------------------------------------------ */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // totalmente transparente
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.15, 6.4);

  /* --------------------------------------------------------------------
   * LUZES — quentes e douradas, tipo "iluminação cinematográfica"
   * ------------------------------------------------------------------ */
  const ambient = new THREE.AmbientLight(0x2a2f3d, 1.1);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(GOLD_BRIGHT, 46, 20, 2);
  keyLight.position.set(3, 3.5, 4);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(GOLD_MID, 30, 20, 2);
  rimLight.position.set(-3.5, -1.5, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(CREAM, 8, 15, 2);
  fillLight.position.set(0, 2.5, 3);
  scene.add(fillLight);

  /* --------------------------------------------------------------------
   * GRUPO PRINCIPAL — tudo gira e flutua junto
   * ------------------------------------------------------------------ */
  const angelGroup = new THREE.Group();
  scene.add(angelGroup);

  /* ---- Material dourado metálico padrão ---- */
  function goldMaterial(opts = {}) {
    return new THREE.MeshPhysicalMaterial({
      color: GOLD_MID,
      metalness: 0.85,
      roughness: 0.28,
      emissive: new THREE.Color(GOLD_DEEP),
      emissiveIntensity: 0.18,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      ...opts,
    });
  }

  /* --------------------------------------------------------------------
   * NÚCLEO — esfera nacarada central (referência à "pérola"/luz interior)
   * ------------------------------------------------------------------ */
  const coreGeo = new THREE.SphereGeometry(0.62, 64, 64);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: CREAM,
    roughness: 0.15,
    metalness: 0.05,
    transmission: 0.55,
    thickness: 1.2,
    ior: 1.3,
    clearcoat: 1,
    emissive: new THREE.Color(GOLD_BRIGHT),
    emissiveIntensity: 0.12,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  angelGroup.add(core);

  /* --------------------------------------------------------------------
   * HALO — dois anéis concêntricos levemente inclinados
   * ------------------------------------------------------------------ */
  const haloOuter = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.035, 24, 120),
    goldMaterial({ emissiveIntensity: 0.35 })
  );
  haloOuter.rotation.x = Math.PI / 2.15;
  haloOuter.position.y = 1.05;
  angelGroup.add(haloOuter);

  const haloInner = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.022, 20, 100),
    goldMaterial({ emissiveIntensity: 0.3 })
  );
  haloInner.rotation.x = Math.PI / 2.3;
  haloInner.rotation.z = 0.3;
  haloInner.position.y = 1.05;
  angelGroup.add(haloInner);

  /* --------------------------------------------------------------------
   * ASAS — silhueta de pena extrudada, repetida em leque, espelhada
   * ------------------------------------------------------------------ */
  function featherShape(length, width) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(width * 0.6, length * 0.35, width * 0.15, length);
    shape.quadraticCurveTo(-width * 0.05, length * 0.5, 0, 0);
    return shape;
  }

  function buildWing(mirror) {
    const wing = new THREE.Group();
    const featherCount = 7;

    for (let i = 0; i < featherCount; i++) {
      const t = i / (featherCount - 1);
      const length = 1.9 - t * 1.05;
      const width = 0.34 - t * 0.16;
      const shape = featherShape(length, width);
      const extrude = new THREE.ExtrudeGeometry(shape, {
        depth: 0.015,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.008,
        bevelSegments: 2,
        curveSegments: 12,
      });
      extrude.center();

      const mat = goldMaterial({
        emissiveIntensity: 0.15 + t * 0.25,
        roughness: 0.22 + t * 0.2,
      });
      const feather = new THREE.Mesh(extrude, mat);

      const angle = -0.18 + i * 0.185;
      feather.position.set(
        Math.sin(angle) * (0.35 + t * 0.25),
        Math.cos(angle) * 0.32 + t * 0.06,
        -i * 0.045
      );
      feather.rotation.z = angle - Math.PI / 2 + 0.15;
      feather.rotation.y = 0.12;

      wing.add(feather);
    }

    wing.position.set(mirror ? 0.55 : -0.55, 0.35, -0.1);
    wing.rotation.z = mirror ? -0.22 : 0.22;
    if (mirror) wing.scale.x = -1;

    return wing;
  }

  const wingRight = buildWing(true);
  const wingLeft = buildWing(false);
  angelGroup.add(wingRight, wingLeft);

  /* --------------------------------------------------------------------
   * PARTÍCULAS — poeira dourada flutuante ao redor do emblema
   * ------------------------------------------------------------------ */
  const particleCount = 70;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const radius = 1.8 + Math.random() * 1.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.cos(phi) * 0.6;
    particlePositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );

  /* Textura procedural de brilho suave (sem depender de imagem externa) */
  function makeGlowTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    grad.addColorStop(0, "rgba(255, 244, 214, 1)");
    grad.addColorStop(0.4, "rgba(230, 190, 120, 0.55)");
    grad.addColorStop(1, "rgba(230, 190, 120, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  const particleMat = new THREE.PointsMaterial({
    size: 0.09,
    map: makeGlowTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: GOLD_BRIGHT,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* --------------------------------------------------------------------
   * RESPONSIVIDADE — ajusta câmera/renderer ao tamanho do contêiner
   * ------------------------------------------------------------------ */
  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  /* --------------------------------------------------------------------
   * INTERAÇÃO — leve parallax de mouse (mouse tracking premium)
   * ------------------------------------------------------------------ */
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  if (!prefersReducedMotion) {
    container.addEventListener("pointermove", (e) => {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = nx * 0.5;
      targetRotX = ny * -0.3;
    });
    container.addEventListener("pointerleave", () => {
      targetRotX = 0;
      targetRotY = 0;
    });
  }

  /* --------------------------------------------------------------------
   * PAUSA QUANDO FORA DA TELA — economiza recursos
   * ------------------------------------------------------------------ */
  let isVisible = true;
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => (isVisible = e.isIntersecting)),
    { threshold: 0.05 }
  );
  io.observe(container);

  /* --------------------------------------------------------------------
   * LOOP DE ANIMAÇÃO
   * ------------------------------------------------------------------ */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    const t = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      angelGroup.rotation.y = t * 0.18;
      angelGroup.position.y = Math.sin(t * 0.7) * 0.09;

      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;
      angelGroup.rotation.x = currentRotX;
      angelGroup.rotation.z = currentRotY * 0.4;

      particles.rotation.y = -t * 0.06;

      haloOuter.rotation.z = t * 0.12;
      haloInner.rotation.z = -t * 0.16;

      keyLight.intensity = 40 + Math.sin(t * 1.4) * 6;
    }

    renderer.render(scene, camera);
  }

  animate();
})();