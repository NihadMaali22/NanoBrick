const API_BASE = "";

const state = {
  wasteType: "banana",
  condition: "moderate",
  fiberRatio: 40,
  bindingEnergy: 50,
  iterations: 100,
  materials: {
    banana: 40,
    date: 25,
    starch: 20,
    ash: 10,
    nano: 5,
  },
};

document.addEventListener("DOMContentLoaded", () => {
  initWasteSelector();
  initConditionSelector();
  initIterationSelector();
  initSliders();
  initMaterialSliders();
  checkAPIStatus();
  init3DVisualization();
});

let scene, camera, renderer, brick, particles, quantumRings;
let mouseX = 0,
  mouseY = 0;
let particleCount = 0;

function init3DVisualization() {
  const container = document.getElementById("hero-3d-container");
  if (!container) return;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.002);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000,
  );
  camera.position.z = 5;
  camera.position.y = 1;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a0a0f, 1);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x00d4aa, 2, 50);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x667eea, 2, 50);
  pointLight2.position.set(-5, -5, 5);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0xffd700, 1.5, 50);
  pointLight3.position.set(0, 5, -5);
  scene.add(pointLight3);

  createNanoBrick();
  createParticles();
  createQuantumRings();
  createDNAHelix();
  createMolecularBonds();

  document.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onWindowResize);

  animate();
}

function createNanoBrick() {
  const brickGroup = new THREE.Group();

  const brickGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.7, 4, 4, 4);
  const brickMaterial = new THREE.MeshPhongMaterial({
    color: 0xcd853f,
    emissive: 0x442200,
    emissiveIntensity: 0.2,
    shininess: 80,
    specular: 0xffd700,
  });
  brick = new THREE.Mesh(brickGeometry, brickMaterial);
  brickGroup.add(brick);

  const fiberCount = 20;
  for (let i = 0; i < fiberCount; i++) {
    const fiberGeometry = new THREE.BoxGeometry(0.02, 0.82, 0.02);
    const fiberMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4aa,
      transparent: true,
      opacity: 0.6,
    });
    const fiber = new THREE.Mesh(fiberGeometry, fiberMaterial);
    fiber.position.x = (i / fiberCount - 0.5) * 1.4;
    fiber.position.z = 0.36;
    brickGroup.add(fiber);
  }

  const edgeGeometry = new THREE.EdgesGeometry(brickGeometry);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x00d4aa,
    transparent: true,
    opacity: 0.8,
  });
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  brickGroup.add(edges);

  const labelGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const labelMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.8,
  });
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.y = 0.7;
  brickGroup.add(label);

  brickGroup.position.x = -2;
  brickGroup.position.y = 0.5;
  scene.add(brickGroup);

  brick = brickGroup;
}

function createParticles() {
  const particlesGeometry = new THREE.BufferGeometry();
  const count = 500;
  particleCount = count;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const colorPalette = [
    new THREE.Color(0x00d4aa),
    new THREE.Color(0x667eea),
    new THREE.Color(0xffd700),
    new THREE.Color(0xff6b6b),
    new THREE.Color(0x90ee90),
  ];

  for (let i = 0; i < count; i++) {
    const radius = 8 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi) - 5;

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 3 + 1;
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  updateParticleCount();
}

function createQuantumRings() {
  quantumRings = new THREE.Group();

  const ringColors = [0x667eea, 0x00d4aa, 0xffd700];
  const ringRadii = [1.2, 1.6, 2.0];

  ringRadii.forEach((radius, i) => {
    const geometry = new THREE.TorusGeometry(radius, 0.02, 16, 100);
    const material = new THREE.MeshBasicMaterial({
      color: ringColors[i],
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 3 + i * 0.3;
    ring.rotation.y = i * 0.5;
    quantumRings.add(ring);
  });

  for (let i = 0; i < 6; i++) {
    const electronGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const electronMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4aa,
      transparent: true,
      opacity: 0.9,
    });
    const electron = new THREE.Mesh(electronGeometry, electronMaterial);
    electron.userData = {
      angle: (i / 6) * Math.PI * 2,
      radius: 1.2 + (i % 3) * 0.4,
      speed: 0.02 + Math.random() * 0.02,
    };
    quantumRings.add(electron);
  }

  quantumRings.position.x = 2.5;
  quantumRings.position.y = 0.5;
  scene.add(quantumRings);
}

function createDNAHelix() {
  const dnaGroup = new THREE.Group();
  const helixRadius = 0.5;
  const helixHeight = 4;
  const turns = 3;
  const pointsPerTurn = 20;

  const strand1Points = [];
  const strand2Points = [];

  for (let i = 0; i <= turns * pointsPerTurn; i++) {
    const t = i / pointsPerTurn;
    const angle = t * Math.PI * 2;
    const y = (t / turns) * helixHeight - helixHeight / 2;

    strand1Points.push(
      new THREE.Vector3(
        Math.cos(angle) * helixRadius,
        y,
        Math.sin(angle) * helixRadius,
      ),
    );

    strand2Points.push(
      new THREE.Vector3(
        Math.cos(angle + Math.PI) * helixRadius,
        y,
        Math.sin(angle + Math.PI) * helixRadius,
      ),
    );

    if (i % 3 === 0) {
      const barGeometry = new THREE.CylinderGeometry(
        0.02,
        0.02,
        helixRadius * 2,
        8,
      );
      const barMaterial = new THREE.MeshBasicMaterial({
        color: i % 6 === 0 ? 0xff6b6b : 0x90ee90,
        transparent: true,
        opacity: 0.7,
      });
      const bar = new THREE.Mesh(barGeometry, barMaterial);
      bar.position.y = y;
      bar.rotation.z = Math.PI / 2;
      bar.rotation.y = angle;
      dnaGroup.add(bar);
    }
  }

  const curve1 = new THREE.CatmullRomCurve3(strand1Points);
  const curve2 = new THREE.CatmullRomCurve3(strand2Points);

  const tubeGeometry1 = new THREE.TubeGeometry(curve1, 100, 0.03, 8, false);
  const tubeGeometry2 = new THREE.TubeGeometry(curve2, 100, 0.03, 8, false);

  const tubeMaterial1 = new THREE.MeshBasicMaterial({
    color: 0x667eea,
    transparent: true,
    opacity: 0.8,
  });
  const tubeMaterial2 = new THREE.MeshBasicMaterial({
    color: 0x00d4aa,
    transparent: true,
    opacity: 0.8,
  });

  dnaGroup.add(new THREE.Mesh(tubeGeometry1, tubeMaterial1));
  dnaGroup.add(new THREE.Mesh(tubeGeometry2, tubeMaterial2));

  dnaGroup.position.x = 0;
  dnaGroup.position.z = -3;
  dnaGroup.rotation.x = Math.PI / 6;
  scene.add(dnaGroup);

  window.dnaHelix = dnaGroup;
}

function createMolecularBonds() {
  const moleculeGroup = new THREE.Group();

  const centralGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  const centralMaterial = new THREE.MeshPhongMaterial({
    color: 0xffd700,
    emissive: 0xffd700,
    emissiveIntensity: 0.3,
    shininess: 100,
  });
  const centralAtom = new THREE.Mesh(centralGeometry, centralMaterial);
  moleculeGroup.add(centralAtom);

  const surroundingPositions = [
    { pos: [0.6, 0.6, 0], color: 0x00d4aa },
    { pos: [-0.6, 0.6, 0], color: 0x667eea },
    { pos: [0, -0.6, 0.6], color: 0xff6b6b },
    { pos: [0, -0.6, -0.6], color: 0x90ee90 },
  ];

  surroundingPositions.forEach(({ pos, color }) => {
    const atomGeometry = new THREE.SphereGeometry(0.12, 32, 32);
    const atomMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.2,
      shininess: 80,
    });
    const atom = new THREE.Mesh(atomGeometry, atomMaterial);
    atom.position.set(...pos);
    moleculeGroup.add(atom);

    const bondPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...pos)];
    const bondGeometry = new THREE.BufferGeometry().setFromPoints(bondPoints);
    const bondMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    const bond = new THREE.Line(bondGeometry, bondMaterial);
    moleculeGroup.add(bond);
  });

  moleculeGroup.position.set(-3.5, -1, 1);
  scene.add(moleculeGroup);
  window.molecule = moleculeGroup;
}

function updateParticleCount() {
  const countElement = document.getElementById("particle-count");
  if (countElement) {
    let current = 0;
    const target = particleCount;
    const increment = Math.ceil(target / 50);
    const counter = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(counter);
      }
      countElement.textContent = current;
    }, 30);
  }
}

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() * 0.001;

  if (brick) {
    brick.rotation.y += 0.005;
    brick.rotation.x = Math.sin(time * 0.5) * 0.1;
    brick.position.y = 0.5 + Math.sin(time) * 0.1;
  }

  if (particles) {
    particles.rotation.y += 0.001;
    particles.rotation.x += 0.0005;

    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      positions[i + 1] = y + Math.sin(time + x * 0.5) * 0.002;
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }

  if (quantumRings) {
    quantumRings.rotation.y += 0.01;
    quantumRings.rotation.z = Math.sin(time * 0.5) * 0.2;

    quantumRings.children.forEach((child, i) => {
      if (child.userData && child.userData.angle !== undefined) {
        child.userData.angle += child.userData.speed;
        child.position.x =
          Math.cos(child.userData.angle) * child.userData.radius;
        child.position.z =
          Math.sin(child.userData.angle) * child.userData.radius;
        child.position.y = Math.sin(child.userData.angle * 2) * 0.3;
      }
    });
  }

  if (window.dnaHelix) {
    window.dnaHelix.rotation.y += 0.005;
  }

  if (window.molecule) {
    window.molecule.rotation.y += 0.008;
    window.molecule.rotation.x = Math.sin(time * 0.7) * 0.2;
  }

  camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.02;
  camera.position.y += (mouseY * 0.5 + 1 - camera.position.y) * 0.02;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

async function checkAPIStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/status`);
    const data = await response.json();
    if (data.status === "online") {
      document.querySelector(".status-dot").style.background = "#00d4aa";
      const statusText = data.llm_available
        ? "النظام متصل (AI مفعّل)"
        : "النظام متصل (وضع احتياطي)";
      document.querySelector(".nav-status span").textContent = statusText;
    }
  } catch (error) {
    document.querySelector(".status-dot").style.background = "#ff6b6b";
    document.querySelector(".nav-status span").textContent = "غير متصل";
  }
}

function initWasteSelector() {
  const buttons = document.querySelectorAll(".waste-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.wasteType = btn.dataset.type;
    });
  });
}

function initConditionSelector() {
  const buttons = document.querySelectorAll(".condition-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.condition = btn.dataset.condition;
    });
  });
}

function initIterationSelector() {
  const buttons = document.querySelectorAll(".iter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.iterations = parseInt(btn.dataset.iter);
    });
  });
}

function initSliders() {
  const fiberSlider = document.getElementById("fiber-ratio");
  const bindingSlider = document.getElementById("binding-energy");
  const fiberValue = document.getElementById("fiber-value");
  const bindingValue = document.getElementById("binding-value");

  if (fiberSlider) {
    fiberSlider.addEventListener("input", (e) => {
      state.fiberRatio = parseInt(e.target.value);
      fiberValue.textContent = e.target.value;
    });
  }

  if (bindingSlider) {
    bindingSlider.addEventListener("input", (e) => {
      state.bindingEnergy = parseInt(e.target.value);
      bindingValue.textContent = e.target.value;
    });
  }
}

function initMaterialSliders() {
  const sliders = {
    "mat-banana": { key: "banana", display: "banana-val" },
    "mat-date": { key: "date", display: "date-val" },
    "mat-starch": { key: "starch", display: "starch-val" },
    "mat-ash": { key: "ash", display: "ash-val" },
    "mat-nano": { key: "nano", display: "nano-val" },
  };

  Object.entries(sliders).forEach(([id, config]) => {
    const slider = document.getElementById(id);
    const display = document.getElementById(config.display);
    if (slider && display) {
      slider.addEventListener("input", (e) => {
        state.materials[config.key] = parseInt(e.target.value);
        display.textContent = e.target.value;
        updateTotalIndicator();
      });
    }
  });

  updateTotalIndicator();
}

function updateTotalIndicator() {
  const total = Object.values(state.materials).reduce(
    (sum, val) => sum + val,
    0,
  );
  const totalElement = document.getElementById("total-percent");
  if (totalElement) {
    totalElement.textContent = `${total}%`;
    totalElement.classList.remove("warning", "ok");
    if (total === 100) {
      totalElement.classList.add("ok");
    } else {
      totalElement.classList.add("warning");
    }
  }
}

async function runClassification() {
  const btn = document.querySelector(".classify-btn");
  const resultDiv = document.getElementById("ai-result");
  btn.classList.add("loading");
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wasteType: state.wasteType,
        condition: state.condition,
      }),
    });

    const data = await response.json();
    displayClassificationResult(resultDiv, data);
  } catch (error) {
    resultDiv.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #ff6b6b;">
        ❌ خطأ في الاتصال<br>
        <small>تأكد من تشغيل الخادم على localhost:5000</small>
      </div>
    `;
  } finally {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

function displayClassificationResult(container, data) {
  const wasteIcons = { banana: "🍌", date: "🌴", mixed: "🔄" };
  const icon = wasteIcons[state.wasteType] || "📦";

  const aiPowered = data.ai_powered;
  const modelBadge = aiPowered
    ? `<span style="background: linear-gradient(135deg, #667eea, #00d4aa); color: #fff; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; margin-right: 8px;">🤖 ${data.model || 'LLM'}</span>`
    : `<span style="background: rgba(255,255,255,0.1); color: #888; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; margin-right: 8px;">📋 Fallback</span>`;

  const propsHtml = Object.entries(data.classification.properties || {})
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([key, val]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const display = typeof val === 'number' ? val.toFixed(1) + '%' : val;
      return `
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
          <div style="color: #888; font-size: 0.9rem;">${label}</div>
          <div style="color: #00d4aa; font-size: 1.1rem;">${display}</div>
        </div>`;
    }).join('');

  const aiAnalysis = data.ai_analysis
    ? `<div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(0, 212, 170, 0.08)); border-radius: 10px; padding: 1rem; margin-top: 1rem; border: 1px solid rgba(102, 126, 234, 0.15);">
        <div style="color: #667eea; font-size: 0.85rem; margin-bottom: 0.5rem;">🧠 تحليل الذكاء الاصطناعي</div>
        <div style="color: #ccc; font-size: 0.95rem; line-height: 1.6;">${data.ai_analysis}</div>
      </div>`
    : '';

  const explanation = data.damage_assessment && data.damage_assessment.explanation
    ? `<div style="color: #a0a0b0; font-size: 0.85rem; margin-top: 0.5rem;">${data.damage_assessment.explanation}</div>`
    : '';

  container.innerHTML = `
    <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(0, 212, 170, 0.1)); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(102, 126, 234, 0.2);">
      <div style="font-size: 1.3rem; margin-bottom: 1rem; color: #00d4aa; display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
        ${icon} ${data.classification.type}
        <span style="margin-right: auto;"></span>
        ${modelBadge}
        <span style="color: #ffd700;">✓ دقة ${data.confidence}%</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1rem;">
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
          <div style="color: #888; font-size: 0.9rem;">الفئة</div>
          <div style="color: #fff; font-size: 1.1rem;">${data.classification.category}</div>
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
          <div style="color: #888; font-size: 0.9rem;">قابلية الاستخدام</div>
          <div style="color: #00d4aa; font-size: 1.1rem;">${data.ripeness.usability}%</div>
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
          <div style="color: #888; font-size: 0.9rem;">مستوى التلف</div>
          <div style="color: #ff6b6b; font-size: 1.1rem;">${data.damage_assessment.level}</div>
          ${explanation}
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
          <div style="color: #888; font-size: 0.9rem;">العملية الموصى بها</div>
          <div style="color: #667eea; font-size: 1.1rem;">${(data.damage_assessment.recommended_process || '').replace(/_/g, ' ')}</div>
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
          <div style="color: #888; font-size: 0.9rem;">وقت المعالجة</div>
          <div style="color: #667eea; font-size: 1.1rem;">${data.processing_time_ms}ms</div>
        </div>
        ${propsHtml}
      </div>
      ${aiAnalysis}
    </div>
  `;
}

async function runQuantumOptimization() {
  const btn = document.querySelector(".quantum-btn");
  const resultDiv = document.getElementById("quantum-result");
  btn.classList.add("loading");
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fiberRatio: state.fiberRatio,
        bindingEnergy: state.bindingEnergy,
        iterations: state.iterations,
      }),
    });

    const data = await response.json();
    displayQuantumResult(resultDiv, data);
  } catch (error) {
    resultDiv.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #ff6b6b;">
        ❌ خطأ في الاتصال<br>
        <small>تأكد من تشغيل الخادم على localhost:5000</small>
      </div>
    `;
  } finally {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

function displayQuantumResult(container, data) {
  const opt = data.optimization;
  const config = data.optimal_configuration;

  let chartBars = '';
  if (data.energy_history && data.energy_history.length > 0) {
    const energies = data.energy_history.map(p => p.energy);
    const minEnergy = Math.min(...energies);
    const maxEnergy = Math.max(...energies);
    const energyRange = maxEnergy - minEnergy || 1;

    chartBars = data.energy_history
      .map((point, i) => {
        const normalized = (maxEnergy - point.energy) / energyRange;
        const height = Math.max(10, 10 + normalized * 85);
        return `<div style="width: 4px; height: ${height}%; background: linear-gradient(to top, #667eea, #00d4aa); border-radius: 2px;" title="Iteration ${point.iteration}: ${point.energy.toFixed(4)}"></div>`;
      })
      .join("");
  } else {
    chartBars = '<div style="color: #888; text-align: center; width: 100%;">لا توجد بيانات</div>';
  }

  container.innerHTML = `
    <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(0, 212, 170, 0.1)); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(102, 126, 234, 0.2);">
      <div style="font-size: 1.3rem; margin-bottom: 1rem; color: #00d4aa;">
        ⚛️ نتائج التحسين الكمي
        <span style="float: left; color: #ffd700;">✓ تقليل ${opt.energy_reduction}%</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
          <div style="color: #888; font-size: 0.9rem;">الطاقة المثلى (Ha)</div>
          <div style="color: #00d4aa; font-size: 1.1rem;">${opt.optimal_energy}</div>
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
          <div style="color: #888; font-size: 0.9rem;">Qubits</div>
          <div style="color: #667eea; font-size: 1.1rem;">${data.quantum_metrics.qubits_used}</div>
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
          <div style="color: #888; font-size: 0.9rem;">البلورية</div>
          <div style="color: #ffd700; font-size: 1.1rem;">${config.crystallinity_index}%</div>
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
          <div style="color: #888; font-size: 0.9rem;">وقت المعالجة</div>
          <div style="color: #90ee90; font-size: 1.1rem;">${data.processing_time_ms}ms</div>
        </div>
      </div>
      <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
        <div style="color: #888; font-size: 0.9rem; margin-bottom: 0.5rem;">منحنى التقارب <span style="font-size: 0.75rem; color: #667eea;">(الطاقة ← الأمثل)</span></div>
        <div style="height: 120px; display: flex; align-items: flex-end; gap: 2px; padding: 0.5rem; background: rgba(0,0,0,0.3); border-radius: 6px; overflow-x: auto;">
          ${chartBars}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.75rem; color: #667eea;">
          <span>البداية: ${opt.initial_energy}</span>
          <span>النهاية: ${opt.optimal_energy}</span>
        </div>
      </div>
    </div>
  `;
}

async function calculateMaterials() {
  const btn = document.querySelector(".calculate-btn");
  const resultDiv = document.getElementById("materials-result");
  btn.classList.add("loading");
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        banana: state.materials.banana,
        date: state.materials.date,
        starch: state.materials.starch,
        ash: state.materials.ash,
        nano: state.materials.nano,
      }),
    });

    const data = await response.json();
    displayMaterialsResult(resultDiv, data);
  } catch (error) {
    resultDiv.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #ff6b6b;">
        ❌ خطأ في الاتصال - تأكد من تشغيل الخادم
      </div>
    `;
  } finally {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

function displayMaterialsResult(container, data) {
  const props = data.properties;
  const quality = data.quality;
  const sustainability = data.sustainability;

  const aiPowered = data.ai_powered;
  const modelBadge = aiPowered
    ? `<div style="text-align: center; margin-bottom: 1rem;"><span style="background: linear-gradient(135deg, #667eea, #00d4aa); color: #fff; padding: 4px 14px; border-radius: 14px; font-size: 0.8rem;">🤖 Powered by ${data.model || 'LLM'}</span></div>`
    : '';

  const aiAnalysis = data.ai_analysis
    ? `<div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(0, 212, 170, 0.08)); border-radius: 10px; padding: 1rem; margin-top: 1rem; border: 1px solid rgba(102, 126, 234, 0.15);">
        <div style="color: #667eea; font-size: 0.85rem; margin-bottom: 0.5rem;">🧠 تحليل الذكاء الاصطناعي</div>
        <div style="color: #ccc; font-size: 0.95rem; line-height: 1.6;">${data.ai_analysis}</div>
      </div>`
    : '';

  container.innerHTML = `
    ${modelBadge}
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(0, 212, 170, 0.1)); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(102, 126, 234, 0.2);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">💪</div>
        <div style="color: #00d4aa; font-size: 1.5rem; font-weight: bold;">${props.compressive_strength.value}<span style="font-size: 0.9rem;">MPa</span></div>
        <div style="color: #888; margin-top: 0.5rem;">قوة الضغط</div>
        <div style="color: #ffd700; font-size: 0.9rem;">${props.compressive_strength.rating}</div>
      </div>
      <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(0, 212, 170, 0.1)); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(102, 126, 234, 0.2);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌡️</div>
        <div style="color: #667eea; font-size: 1.5rem; font-weight: bold;">${props.thermal_resistance.value}<span style="font-size: 0.9rem;">R</span></div>
        <div style="color: #888; margin-top: 0.5rem;">المقاومة الحرارية</div>
        <div style="color: #ffd700; font-size: 0.9rem;">${props.thermal_resistance.rating}</div>
      </div>
      <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(0, 212, 170, 0.1)); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(102, 126, 234, 0.2);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚖️</div>
        <div style="color: #90ee90; font-size: 1.5rem; font-weight: bold;">${props.density.value}<span style="font-size: 0.9rem;">kg/m³</span></div>
        <div style="color: #888; margin-top: 0.5rem;">الكثافة</div>
        <div style="color: #ffd700; font-size: 0.9rem;">${props.density.category}</div>
      </div>
      <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(0, 212, 170, 0.1)); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(102, 126, 234, 0.2);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔥</div>
        <div style="color: #ff6b6b; font-size: 1.5rem; font-weight: bold;">${props.fire_resistance.value}<span style="font-size: 0.9rem;">hr</span></div>
        <div style="color: #888; margin-top: 0.5rem;">مقاومة الحريق</div>
        <div style="color: #ffd700; font-size: 0.9rem;">${props.fire_resistance.class}</div>
      </div>
      <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(0, 212, 170, 0.1)); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(102, 126, 234, 0.2);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">💧</div>
        <div style="color: #00d4aa; font-size: 1.5rem; font-weight: bold;">${props.water_absorption.value}<span style="font-size: 0.9rem;">%</span></div>
        <div style="color: #888; margin-top: 0.5rem;">امتصاص الماء</div>
        <div style="color: #ffd700; font-size: 0.9rem;">${props.water_absorption.rating}</div>
      </div>
      <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(0, 212, 170, 0.1)); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(102, 126, 234, 0.2);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌱</div>
        <div style="color: #90ee90; font-size: 1.5rem; font-weight: bold;">${sustainability.eco_score}<span style="font-size: 0.9rem;">%</span></div>
        <div style="color: #888; margin-top: 0.5rem;">النقاط البيئية</div>
        <div style="color: #ffd700; font-size: 0.9rem;">تقليل CO₂: ${sustainability.carbon_reduction}%</div>
      </div>
    </div>
    <div style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 212, 170, 0.1)); border-radius: 12px; padding: 2rem; border: 2px solid rgba(255, 215, 0, 0.3); text-align: center;">
      <div style="color: #ffd700; font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">${quality.grade}</div>
      <div style="color: #888; font-size: 1.1rem;">التصنيف النهائي</div>
      <div style="color: #00d4aa; font-size: 0.9rem; margin-top: 0.5rem;">النقاط: ${quality.score}/100</div>
    </div>
    ${aiAnalysis}
  `;
}

console.log(
  `
%c🧱 NanoBrick Lab
%c- Interactive Testing Dashboard

%c📡 API Endpoints:
   • /api/classify - AI Classification
   • /api/optimize - Quantum Optimization
   • /api/calculate - Material Calculator

%c🔧 State object available: window.state
`,
  "color: #00d4aa; font-size: 20px; font-weight: bold;",
  "color: #667eea; font-size: 14px;",
  "color: #ffd700; font-size: 12px;",
  "color: #90ee90; font-size: 11px;",
);

window.state = state;
