/**
 * ==========================================================================
 * MÉTODO KAIRÓS® — bible-3d.js
 * Composição 3D autoral de tema bíblico — Bíblia aberta com páginas
 * luminosas, cruz elegante ao fundo, feixe de luz celestial, partículas
 * douradas, pergaminho parcialmente desenrolado e ramo de oliveira.
 * Construído com Three.js clássico (sem módulos ES6), fundo transparente,
 * paleta branco/dourado/marfim/bronze.
 * ==========================================================================
 */

/* Carregado como <script> comum — usa a variável global THREE criada por
   js/vendor/three.min.js, que precisa vir ANTES deste arquivo no HTML. */
(function () {
  "use strict";

  if (typeof THREE === "undefined") {
    console.error(
      "[bible-3d] THREE não foi encontrado. Verifique se js/vendor/three.min.js foi carregado ANTES de js/bible-3d.js no seu HTML."
    );
    return;
  }

  const container = document.getElementById("angel3d");
  if (!container) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* --------------------------------------------------------------------
   * PALETA — dourado quente, âmbar, marfim escuro, bronze profundo
   * (recalibrada para bater com a referência: cruz radiante e quente,
   * livro em silhueta escura contra a luz)
   * ------------------------------------------------------------------ */
  const GOLD_BRIGHT = 0xfff3d6;   // núcleo quase branco-dourado da luz
  const GOLD_MID = 0xf6b552;      // dourado quente principal
  const GOLD_DEEP = 0xd97a2e;     // âmbar/laranja profundo
  const BRONZE = 0x5a3a1e;        // bronze escuro (livro em silhueta)
  const IVORY = 0x8a6a42;         // páginas — tom médio, não estoura pra branco
  const IVORY_SHADOW = 0x3c2a16;  // sombra das páginas / pergaminho
  const WHITE_WARM = 0xfff6e5;

  /* --------------------------------------------------------------------
   * RENDERER — fundo transparente, sombras suaves habilitadas
   * ------------------------------------------------------------------ */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0.3, 0.9, 6.8);
  camera.lookAt(0, 0.1, 0);

  /* --------------------------------------------------------------------
   * TEXTURAS PROCEDURAIS (geradas em canvas — sem depender de imagens
   * externas, então nada de arquivos extra pra hospedar/errar caminho)
   * ------------------------------------------------------------------ */
  function makeRadialTexture(colorStops) {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    colorStops.forEach(([stop, color]) => grad.addColorStop(stop, color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }

  const glowTexture = makeRadialTexture([
    [0, "rgba(255, 248, 224, 1)"],
    [0.35, "rgba(246, 227, 184, 0.6)"],
    [1, "rgba(246, 227, 184, 0)"],
  ]);

  /* Textura vertical suave para o feixe de luz (cone aditivo) */
  function makeBeamTexture() {
    const w = 64, h = 256;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(255, 250, 235, 0.85)");
    grad.addColorStop(0.55, "rgba(246, 227, 184, 0.22)");
    grad.addColorStop(1, "rgba(246, 227, 184, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    return new THREE.CanvasTexture(canvas);
  }

  /* Textura sutil de "linhas de texto" para dar leve realismo às páginas
     sem precisar renderizar tipografia de verdade */
  function makePageTexture() {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f7f1e3";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(180, 150, 100, 0.16)";
    ctx.lineWidth = 1.5;
    for (let y = 40; y < size - 40; y += 14) {
      ctx.beginPath();
      const wobble = Math.sin(y * 0.05) * 4;
      ctx.moveTo(50, y + wobble);
      ctx.lineTo(size - 50 - Math.random() * 60, y + wobble);
      ctx.stroke();
    }
    // margem dourada sutil
    ctx.strokeStyle = "rgba(212, 175, 106, 0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, size - 40, size - 40);
    return new THREE.CanvasTexture(canvas);
  }

  const pageTexture = makePageTexture();
  pageTexture.wrapS = pageTexture.wrapT = THREE.ClampToEdgeWrapping;

  /* --------------------------------------------------------------------
   * LUZES — mais escuras e quentes, deixando a cruz ser o único ponto
   * realmente brilhante (como na referência: tudo em volta é sombra
   * quente, só a cruz e o feixe estouram pra claro)
   * ------------------------------------------------------------------ */
  const ambient = new THREE.AmbientLight(0x2a1c10, 0.9);
  scene.add(ambient);

  // Luz-chave: vem de trás/cima da cruz, projeta sombra suave no livro
  const keyLight = new THREE.SpotLight(GOLD_MID, 18, 14, Math.PI / 5, 0.6, 1.6);
  keyLight.position.set(0.4, 3.6, 1.6);
  keyLight.target.position.set(0, -0.4, 0.6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.radius = 8;
  keyLight.shadow.bias = -0.0015;
  scene.add(keyLight, keyLight.target);

  // Luz de preenchimento âmbar, bem discreta — só pra não perder detalhe total nas sombras
  const fillLight = new THREE.PointLight(GOLD_DEEP, 3.5, 10, 2);
  fillLight.position.set(-1.8, -0.2, 2.4);
  scene.add(fillLight);

  // Luz de contorno atrás do livro, sugere o brilho vindo da cruz
  const rimLight = new THREE.PointLight(GOLD_BRIGHT, 3, 8, 2);
  rimLight.position.set(0.2, 0.3, -0.6);
  scene.add(rimLight);

  /* --------------------------------------------------------------------
   * GRUPO PRINCIPAL
   * ------------------------------------------------------------------ */
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  /* ---- Halo de presença divina — glow amplo atrás de tudo ---- */
  const presenceGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: GOLD_BRIGHT,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  presenceGlow.scale.set(4.2, 4.2, 1);
  presenceGlow.position.set(0, 0.6, -2.4);
  mainGroup.add(presenceGlow);

  /* --------------------------------------------------------------------
   * CRUZ ELEGANTE — minimalista, ao fundo, discreta
   * ------------------------------------------------------------------ */
  const crossGroup = new THREE.Group();
  const crossMat = new THREE.MeshPhysicalMaterial({
    color: BRONZE,
    metalness: 0.9,
    roughness: 0.32,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
    emissive: new THREE.Color(GOLD_DEEP),
    emissiveIntensity: 0.08,
  });
  const crossVertical = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 2.5, 16),
    crossMat
  );
  const crossHorizontal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 1.15, 16),
    crossMat
  );
  crossHorizontal.rotation.z = Math.PI / 2;
  crossHorizontal.position.y = 0.55;
  crossGroup.add(crossVertical, crossHorizontal);
  crossGroup.position.set(0, 0.9, -2.1);
  crossGroup.castShadow = false;
  mainGroup.add(crossGroup);

  /* --------------------------------------------------------------------
   * BÍBLIA ABERTA — pivô correto na lombada, ângulo de abertura real,
   * deitada como na referência (vista de cima/frente, em silhueta contra
   * a luz da cruz)
   * ------------------------------------------------------------------ */
  const bookGroup = new THREE.Group();

  function buildPage(mirror) {
    const width = 1.35;
    const height = 1.85;
    const geo = new THREE.PlaneGeometry(width, height, 24, 24);
    // desloca a geometria pra que a borda esquerda (x=0) seja a lombada —
    // é esse o pivô que faltava antes, e por isso as páginas viravam
    // uma parede só em vez de abrir em "V"
    geo.translate(width / 2, 0, 0);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const t = x / width; // 0 (lombada) → 1 (borda externa)
      const sag = Math.sin(t * Math.PI * 0.5) * 0.05; // leve caimento do papel
      const pageWave = Math.sin(y * 2.2 + x * 3) * 0.004;
      pos.setZ(i, -sag + pageWave);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhysicalMaterial({
      map: pageTexture,
      color: IVORY,
      roughness: 0.65,
      metalness: 0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.7,
      emissive: new THREE.Color(GOLD_DEEP),
      emissiveIntensity: 0.06,
    });

    const page = new THREE.Mesh(geo, mat);
    page.receiveShadow = true;
    page.castShadow = true;
    // ângulo real de abertura de um livro — cada página gira ~30° pra fora
    page.rotation.y = mirror ? -0.52 : 0.52;
    if (mirror) page.scale.x = -1;
    return page;
  }

  const pageLeft = buildPage(false);
  const pageRight = buildPage(true);
  // ambas nascem da mesma lombada (x=0 local), sem deslocamento extra em x
  pageLeft.position.set(0, 0, 0);
  pageRight.position.set(0, 0, 0);
  bookGroup.add(pageLeft, pageRight);

  // Lombada / capa dourada (CapsuleGeometry não existe nesta versão do
  // Three.js — usamos um cilindro com tampas arredondadas simuladas)
  const spineGeo = typeof THREE.CapsuleGeometry === "function"
    ? new THREE.CapsuleGeometry(0.035, height_spine(), 4, 12)
    : new THREE.CylinderGeometry(0.035, 0.035, height_spine(), 16);
  function height_spine() { return 1.85; }
  const spine = new THREE.Mesh(
    spineGeo,
    new THREE.MeshPhysicalMaterial({
      color: GOLD_MID,
      metalness: 0.85,
      roughness: 0.25,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
      emissive: new THREE.Color(GOLD_DEEP),
      emissiveIntensity: 0.2,
    })
  );
  spine.rotation.z = Math.PI / 2;
  spine.position.set(0, 0, -0.02);
  spine.castShadow = true;
  bookGroup.add(spine);

  // Capa traseira (base sob as páginas, sugere espessura do livro)
  const coverBack = new THREE.Mesh(
    new THREE.BoxGeometry(2.85, 0.045, 1.9),
    new THREE.MeshPhysicalMaterial({
      color: BRONZE,
      metalness: 0.6,
      roughness: 0.5,
      clearcoat: 0.3,
    })
  );
  coverBack.position.set(0, -0.06, 0);
  coverBack.receiveShadow = true;
  coverBack.castShadow = true;
  bookGroup.add(coverBack);

  // o livro "deita" — inclinado como se estivesse apoiado numa superfície,
  // visto de um ângulo elevado, igual à referência
  bookGroup.rotation.x = -1.15;
  bookGroup.position.set(0, -0.85, 0.9);
  mainGroup.add(bookGroup);

  /* Luz suave saindo de dentro do livro (páginas "emitindo luz dourada") */
  const bookGlowLight = new THREE.PointLight(GOLD_BRIGHT, 6, 5, 2);
  bookGlowLight.position.set(0, 0.15, 0.5);
  mainGroup.add(bookGlowLight);

  /* --------------------------------------------------------------------
   * FEIXE DE LUZ CELESTIAL — cone aditivo descendo sobre a Bíblia
   * ------------------------------------------------------------------ */
  const beamTexture = makeBeamTexture();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 1.1, 5, 32, 1, true),
    new THREE.MeshBasicMaterial({
      map: beamTexture,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  beam.position.set(0.3, 2.6, 0.2);
  beam.rotation.x = 0.05;
  mainGroup.add(beam);

  /* --------------------------------------------------------------------
   * PERGAMINHO PARCIALMENTE DESENROLADO — ao lado da Bíblia
   * ------------------------------------------------------------------ */
  const scrollGroup = new THREE.Group();
  const parchmentMat = new THREE.MeshPhysicalMaterial({
    color: IVORY_SHADOW,
    roughness: 0.7,
    metalness: 0,
    clearcoat: 0.1,
  });
  const trimMat = new THREE.MeshPhysicalMaterial({
    color: GOLD_MID,
    metalness: 0.8,
    roughness: 0.3,
    clearcoat: 0.6,
  });

  // Rolo (parte enrolada)
  const scrollRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.9, 24),
    parchmentMat
  );
  scrollRoll.rotation.z = Math.PI / 2;
  scrollRoll.castShadow = true;
  scrollGroup.add(scrollRoll);

  // Aros dourados nas pontas do rolo
  [-0.46, 0.46].forEach((xOff) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.014, 10, 24), trimMat);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = xOff;
    scrollGroup.add(ring);
  });

  // Parte desenrolada — plano levemente curvado
  const unrolledGeo = new THREE.PlaneGeometry(0.85, 0.62, 20, 20);
  const uPos = unrolledGeo.attributes.position;
  for (let i = 0; i < uPos.count; i++) {
    const x = uPos.getX(i);
    uPos.setZ(i, Math.sin((x + 0.42) * 2.6) * 0.09);
  }
  unrolledGeo.computeVertexNormals();
  const unrolled = new THREE.Mesh(unrolledGeo, parchmentMat);
  unrolled.rotation.y = -0.15;
  unrolled.rotation.z = -0.03;
  unrolled.position.set(0.72, -0.02, 0.05);
  unrolled.receiveShadow = true;
  unrolled.castShadow = true;
  scrollGroup.add(unrolled);

  scrollGroup.position.set(-1.85, -0.62, 0.9);
  scrollGroup.rotation.y = 0.35;
  scrollGroup.scale.setScalar(0.95);
  mainGroup.add(scrollGroup);

  /* --------------------------------------------------------------------
   * RAMO DE OLIVEIRA — tons dourados/bronze para manter a paleta
   * ------------------------------------------------------------------ */
  function buildOliveBranch() {
    const branch = new THREE.Group();

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.9, 0, 0),
      new THREE.Vector3(-0.4, 0.09, 0.08),
      new THREE.Vector3(0.15, 0.02, -0.04),
      new THREE.Vector3(0.75, 0.12, 0.05),
      new THREE.Vector3(1.25, 0.05, 0),
    ]);

    const stemMat = new THREE.MeshPhysicalMaterial({
      color: BRONZE,
      roughness: 0.55,
      metalness: 0.4,
      clearcoat: 0.3,
    });
    const stem = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 40, 0.018, 8, false),
      stemMat
    );
    stem.castShadow = true;
    branch.add(stem);

    const leafMat = new THREE.MeshPhysicalMaterial({
      color: GOLD_MID,
      roughness: 0.35,
      metalness: 0.55,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(GOLD_DEEP),
      emissiveIntensity: 0.06,
    });

    function leafShape() {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.05, 0.09, 0, 0.19);
      shape.quadraticCurveTo(-0.05, 0.09, 0, 0);
      return shape;
    }

    const leafCount = 16;
    for (let i = 0; i < leafCount; i++) {
      const t = i / (leafCount - 1);
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      const leafGeo = new THREE.ShapeGeometry(leafShape(), 8);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.castShadow = true;
      leaf.position.copy(point);
      leaf.lookAt(point.clone().add(tangent));
      leaf.rotateZ(i % 2 === 0 ? 0.9 : -0.9);
      leaf.rotateX(0.3);
      const s = 0.75 + Math.random() * 0.3;
      leaf.scale.setScalar(s);
      branch.add(leaf);
    }

    return branch;
  }

  const oliveBranch = buildOliveBranch();
  oliveBranch.position.set(-0.35, -0.68, 1.35);
  oliveBranch.rotation.set(0.15, 0.25, 0.08);
  oliveBranch.scale.setScalar(1.05);
  mainGroup.add(oliveBranch);

  /* --------------------------------------------------------------------
   * PLANO DE SOMBRA DISCRETO — ancora a composição sem base visível
   * ------------------------------------------------------------------ */
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.ShadowMaterial({ opacity: 0.22 })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -0.98;
  shadowCatcher.receiveShadow = true;
  mainGroup.add(shadowCatcher);

  /* --------------------------------------------------------------------
   * PARTÍCULAS DOURADAS — sobem lentamente, névoa volumétrica leve
   * ------------------------------------------------------------------ */
  const particleCount = 90;
  const particleData = [];
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const radius = 0.4 + Math.random() * 1.9;
    const theta = Math.random() * Math.PI * 2;
    const y = -0.9 + Math.random() * 3.2;
    const x = Math.cos(theta) * radius * 0.6;
    const z = Math.sin(theta) * radius * 0.6 + 0.3;
    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;
    particleData.push({
      speed: 0.05 + Math.random() * 0.09,
      driftPhase: Math.random() * Math.PI * 2,
      driftAmp: 0.05 + Math.random() * 0.08,
      baseX: x,
      baseZ: z,
    });
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.055,
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: GOLD_BRIGHT,
    opacity: 0.85,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  mainGroup.add(particles);

  /* Névoa volumétrica muito leve (fog exponencial sutil) */
  scene.fog = new THREE.FogExp2(0x0a1424, 0.045);

  /* --------------------------------------------------------------------
   * RESPONSIVIDADE
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
   * PARALLAX SUAVE DE MOUSE
   * ------------------------------------------------------------------ */
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  if (!prefersReducedMotion) {
    container.addEventListener("pointermove", (e) => {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      // limite de rotação extremamente sutil (menos de 5°)
      targetRotY = nx * THREE.MathUtils.degToRad(4);
      targetRotX = ny * THREE.MathUtils.degToRad(-2.5);
    });
    container.addEventListener("pointerleave", () => {
      targetRotX = 0;
      targetRotY = 0;
    });
  }

  /* --------------------------------------------------------------------
   * PAUSA FORA DA TELA
   * ------------------------------------------------------------------ */
  let isVisible = true;
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => (isVisible = e.isIntersecting)),
    { threshold: 0.05 }
  );
  io.observe(container);

  /* --------------------------------------------------------------------
   * LOOP DE ANIMAÇÃO — movimento contínuo, quase imperceptível
   * ------------------------------------------------------------------ */
  const clock = new THREE.Clock();
  const topBound = 2.3;
  const bottomBound = -0.9;

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!prefersReducedMotion) {
      // rotação extremamente lenta, oscilando dentro de ~4°
      mainGroup.rotation.y = Math.sin(t * 0.12) * THREE.MathUtils.degToRad(4);

      currentRotX += (targetRotX - currentRotX) * 0.04;
      currentRotY += (targetRotY - currentRotY) * 0.04;
      mainGroup.rotation.x = currentRotX;

      // páginas "respirando" — movimento quase imperceptível
      const pageBreath = Math.sin(t * 0.5) * 0.01;
      pageLeft.rotation.y = 0.06 + pageBreath;
      pageRight.rotation.y = -0.06 - pageBreath;

      // luz respirando lentamente
      keyLight.intensity = 55 + Math.sin(t * 0.35) * 6;
      bookGlowLight.intensity = 6 + Math.sin(t * 0.6 + 1) * 1.6;
      presenceGlow.material.opacity = 0.42 + Math.sin(t * 0.28) * 0.08;
      beam.material.opacity = 0.32 + Math.sin(t * 0.4 + 2) * 0.08;

      // partículas subindo lentamente com leve deriva
      const posAttr = particleGeo.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        const d = particleData[i];
        let y = posAttr.getY(i) + d.speed * dt;
        if (y > topBound) y = bottomBound;
        const drift = Math.sin(t * 0.6 + d.driftPhase) * d.driftAmp;
        posAttr.setY(i, y);
        posAttr.setX(i, d.baseX + drift);
        posAttr.setZ(i, d.baseZ + drift * 0.6);
      }
      posAttr.needsUpdate = true;

      // ramo de oliveira — leve oscilação, como se houvesse uma brisa mínima
      oliveBranch.rotation.z = 0.08 + Math.sin(t * 0.3) * 0.012;
    }

    renderer.render(scene, camera);
  }

  animate();
})();