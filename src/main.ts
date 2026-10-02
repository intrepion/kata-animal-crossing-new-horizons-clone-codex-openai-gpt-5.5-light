import "./styles.css";
import * as THREE from "three";
import { creatures, ItemId, PlaceableId, POCKET_LIMIT, recipes, resources, tools } from "./data";
import {
  addItem,
  craftItem,
  createIslandState,
  currentTask,
  donateCreature,
  hydrateIslandState,
  IslandState,
  itemCount,
  placeItem,
  pocketCount,
  repayLoan,
  sellItem,
  serializeIslandState,
  talkToVillager,
} from "./state";
import {
  Collider,
  findInteractionTarget,
  Interactable,
  cameraRelativeDelta,
  moveWithCollision,
  Vec2,
} from "./world";

const SAVE_KEY = "harbor-sprout-island";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root");
}

app.innerHTML = `
  <main class="game-shell">
    <canvas id="island-canvas" aria-label="Harbor Sprout 3D island"></canvas>
    <section class="hud" aria-live="polite">
      <div>
        <span class="label">Tool</span>
        <strong id="hud-tool">Hands</strong>
      </div>
      <div>
        <span class="label">Pocket</span>
        <strong id="hud-pocket">0/${POCKET_LIMIT}</strong>
      </div>
      <div>
        <span class="label">Bells</span>
        <strong id="hud-bells">0</strong>
      </div>
      <div class="task">
        <span class="label">NookPhone</span>
        <strong id="hud-task">Arrive on the island</strong>
      </div>
    </section>
    <div id="world-prompt" class="world-prompt" hidden></div>
    <section class="notice" id="notice">
      <strong>Harbor Sprout</strong>
      <span>WASD/Arrows move · Drag to orbit · 1-5 tools · E interact · P place</span>
    </section>
    <section class="pocket-panel" id="pocket-panel" aria-label="Pocket contents"></section>
    <div class="controls">
      <button id="mute-toggle" type="button">Audio: on</button>
      <button id="motion-toggle" type="button">Reduced motion: off</button>
      <button id="new-island" type="button">New Island</button>
    </div>
  </main>
`;

const canvas = requireElement<HTMLCanvasElement>("#island-canvas");
const promptEl = requireElement<HTMLDivElement>("#world-prompt");
const noticeEl = requireElement<HTMLDivElement>("#notice");
const toolEl = requireElement<HTMLElement>("#hud-tool");
const pocketEl = requireElement<HTMLElement>("#hud-pocket");
const bellsEl = requireElement<HTMLElement>("#hud-bells");
const taskEl = requireElement<HTMLElement>("#hud-task");
const pocketPanel = requireElement<HTMLElement>("#pocket-panel");
const muteButton = requireElement<HTMLButtonElement>("#mute-toggle");
const motionButton = requireElement<HTMLButtonElement>("#motion-toggle");
const newIslandButton = requireElement<HTMLButtonElement>("#new-island");

let state: IslandState = loadState();
let avatarPosition: Vec2 = { x: 0, z: 2.5 };
let cameraYaw = -0.45;
let reducedMotion = false;
let muted = false;
let activeTarget: Interactable | undefined;
let noticeTimer = 0;
let audioContext: AudioContext | undefined;
let ambientGain: GainNode | undefined;
let forceCatchSuccess = false;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x9bd8f0);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9bd8f0, 18, 48);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
const avatar = new THREE.Group();
const keys = new Set<string>();
const clock = new THREE.Clock();
const colliders: Collider[] = [];
const interactables: Interactable[] = [];
const toolKeys = ["hands", "rod", "net", "axe", "shovel"] as const;

buildScene();
for (const placed of state.placedItems) {
  addPlacedDecoration(placed.id, placed.x, placed.z);
}
updateHud();
resize();
showNotice("Morning ferry landed. Meet neighbors, gather materials, and make the island yours.");

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }
  keys.add(event.key.toLowerCase());
  const numeric = Number(event.key);
  if (numeric >= 1 && numeric <= toolKeys.length) {
    state.equippedTool = toolKeys[numeric - 1];
    updateHud();
    showNotice(`Equipped ${tools[state.equippedTool].label}.`);
  }
  if (event.key.toLowerCase() === "e") {
    interact();
  }
  if (event.key.toLowerCase() === "p") {
    placeDecoration();
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

let dragging = false;
let lastMouseX = 0;
canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastMouseX = event.clientX;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  cameraYaw -= (event.clientX - lastMouseX) * 0.006;
  lastMouseX = event.clientX;
});
canvas.addEventListener("pointerup", () => {
  dragging = false;
});

motionButton.addEventListener("click", () => {
  reducedMotion = !reducedMotion;
  motionButton.textContent = `Reduced motion: ${reducedMotion ? "on" : "off"}`;
});

muteButton.addEventListener("click", () => {
  muted = !muted;
  muteButton.textContent = `Audio: ${muted ? "off" : "on"}`;
  if (ambientGain) {
    ambientGain.gain.value = muted ? 0 : 0.018;
  }
});

newIslandButton.addEventListener("click", () => {
  localStorage.removeItem(SAVE_KEY);
  state = createIslandState();
  avatarPosition = { x: 0, z: 2.5 };
  updateHud();
  showNotice("A fresh island morning begins.");
});

requestAnimationFrame(tick);

window.harborSproutTest = {
  goTo(id: string): void {
    const target = interactables.find((item) => item.id === id || item.label === id);
    if (!target) {
      throw new Error(`Unknown target ${id}`);
    }
    avatarPosition = { x: target.x, z: target.z + Math.min(0.6, target.radius) };
    avatar.position.set(avatarPosition.x, 0, avatarPosition.z);
    updatePrompt();
  },
  interact,
  placeDecoration,
  setTool(tool): void {
    state.equippedTool = tool;
    updateHud();
    updatePrompt();
  },
  snapshot: () => serializeIslandState(state),
  forceCatchSuccess(value: boolean): void {
    forceCatchSuccess = value;
  },
};

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing ${selector}`);
  }
  return element;
}

function buildScene(): void {
  scene.add(new THREE.HemisphereLight(0xe8fff2, 0x4b8f75, 2.7));
  const sun = new THREE.DirectionalLight(0xfff2ca, 2.8);
  sun.position.set(-8, 12, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(13, 15, 1.1, 64),
    new THREE.MeshStandardMaterial({ color: 0x83ca73, roughness: 0.85 }),
  );
  island.receiveShadow = true;
  island.position.y = -0.6;
  scene.add(island);

  const beach = new THREE.Mesh(
    new THREE.RingGeometry(10.6, 14.8, 64),
    new THREE.MeshStandardMaterial({ color: 0xe7d08a, roughness: 0.9 }),
  );
  beach.rotation.x = -Math.PI / 2;
  beach.position.y = -0.02;
  scene.add(beach);

  addWater("Pond", -5.8, -2.6, 2.2, 1.35);
  addWater("River", 5.8, 0.3, 1.4, 4.8);
  addLandmark("Plaza", 0, 0, 2.4, 0xf4c86a);
  addBuilding("Player Tent", 0, 6.2, 0x77a8f6, "Rest at home", "home");
  addBuilding("Museum Tent", -6.7, 3.9, 0xb994ef, "Donate a new catch", "museum");
  addBuilding("Shop Stall", 6.4, 3.7, 0xffb15c, "Sell pocket goods", "shop");
  addBuilding("Crafting Stump", -2.7, -5.5, 0xb8793d, "Craft island goods", "crafting");

  addVillager("Mira", -3.2, 1.6, 0xff8b8b);
  addVillager("Sol", 3.4, 1.1, 0xffdd75);
  addVillager("Pip", 1.7, -4.6, 0x8ee1ff);

  addTree(-7.3, -5.4);
  addTree(-8.6, -1.2);
  addTree(7.8, -3.8);
  addTree(4.2, -6.8);
  addRock(5.2, -2.4);
  addRock(6.9, -1.5);
  addPickup("Shells", "shells", -6.2, 7.5, 0xfff0d9);
  addPickup("Flowers", "flowers", 3.8, -5.2, 0xff85c8);
  addCreature("Sunwing", "sunwing", -1.8, -3.8);

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xffc27d, roughness: 0.7 }),
  );
  body.castShadow = true;
  body.position.y = 0.55;
  avatar.add(body);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 20, 12),
    new THREE.MeshStandardMaterial({ color: 0x3a8f68, roughness: 0.8 }),
  );
  cap.scale.y = 0.45;
  cap.position.set(0, 1.05, 0.04);
  avatar.add(cap);
  scene.add(avatar);
}

function tick(): void {
  const dt = Math.min(clock.getDelta(), 0.05);
  updateMovement(dt);
  updateCamera();
  updatePrompt();
  noticeTimer -= dt;
  if (noticeTimer <= 0) {
    noticeEl.classList.remove("is-loud");
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function updateMovement(dt: number): void {
  const input = { x: 0, z: 0 };
  if (keys.has("w") || keys.has("arrowup")) input.z += 1;
  if (keys.has("s") || keys.has("arrowdown")) input.z -= 1;
  if (keys.has("a") || keys.has("arrowleft")) input.x -= 1;
  if (keys.has("d") || keys.has("arrowright")) input.x += 1;
  const length = Math.hypot(input.x, input.z);
  if (length > 0) {
    input.x /= length;
    input.z /= length;
    const speed = 4.6 * dt;
    const delta = cameraRelativeDelta(input, cameraYaw, speed);
    avatarPosition = moveWithCollision(avatarPosition, delta, colliders);
    avatar.rotation.y = Math.atan2(delta.x, delta.z);
  }
  const distanceFromCenter = Math.hypot(avatarPosition.x, avatarPosition.z);
  if (distanceFromCenter > 11.4) {
    avatarPosition.x *= 11.4 / distanceFromCenter;
    avatarPosition.z *= 11.4 / distanceFromCenter;
  }
  avatar.position.set(avatarPosition.x, 0, avatarPosition.z);
  if (!reducedMotion) {
    avatar.position.y = Math.sin(performance.now() * 0.006) * 0.025;
  }
}

function updateCamera(): void {
  const cameraOffset = new THREE.Vector3(Math.sin(cameraYaw) * 8, 6.2, Math.cos(cameraYaw) * 8);
  const target = new THREE.Vector3(avatarPosition.x, 0.8, avatarPosition.z);
  camera.position.lerp(target.clone().add(cameraOffset), reducedMotion ? 1 : 0.12);
  camera.lookAt(target);
}

function updatePrompt(): void {
  activeTarget = findInteractionTarget(avatarPosition, state.equippedTool, interactables);
  if (!activeTarget) {
    promptEl.hidden = true;
    return;
  }
  promptEl.hidden = false;
  promptEl.textContent = `E · ${activeTarget.action} ${activeTarget.label}`;
}

function interact(): void {
  if (!activeTarget) {
    showNotice("Nothing nearby is ready for that tool.");
    playCue("warn");
    return;
  }
  if (activeTarget.kind === "villager") {
    talkToVillager(state, activeTarget.id);
    showNotice(`${activeTarget.label}: The island already feels brighter with you here.`);
    playCue("talk");
  } else if (activeTarget.kind === "resource") {
    gather(activeTarget);
  } else if (activeTarget.kind === "water") {
    catchCreature(state.equippedTool === "rod" ? "reefMinnow" : undefined, "rod");
  } else if (activeTarget.kind === "bug") {
    catchCreature(state.equippedTool === "net" ? "sunwing" : undefined, "net");
  } else if (activeTarget.kind === "museum") {
    donateFirstCreature();
  } else if (activeTarget.kind === "shop") {
    sellPocketGoods();
  } else if (activeTarget.kind === "crafting") {
    craftNextUsefulItem();
  } else if (activeTarget.kind === "home") {
    const paid = repayLoan(state, state.bells);
    showNotice(paid > 0 ? `Paid ${paid} Bells toward the starter loan.` : "Earn a few Bells before making another loan payment.");
    playCue(paid > 0 ? "sell" : "warn");
  } else {
    showNotice(`${activeTarget.action} at ${activeTarget.label}.`);
  }
  if (state.completed) {
    showNotice("Evening settles over Harbor Sprout. The starter loan is paid, the museum has a new treasure, and the island feels like yours.");
    playCue("complete");
  }
  saveState();
  updateHud();
}

function updateHud(): void {
  toolEl.textContent = tools[state.equippedTool].label;
  pocketEl.textContent = `${pocketCount(state)}/${POCKET_LIMIT}`;
  bellsEl.textContent = `${state.bells}`;
  taskEl.textContent = currentTask(state);
  pocketPanel.innerHTML = state.pocket
    .map((entry) => `<span>${labelForItem(entry.id)} × ${entry.count}</span>`)
    .join("");
}

function showNotice(message: string): void {
  noticeEl.innerHTML = `<strong>Harbor Sprout</strong><span>${message}</span>`;
  noticeEl.classList.add("is-loud");
  noticeTimer = 4;
}

function resize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function gather(target: Interactable): void {
  const item = target.id as ItemId;
  if (addItem(state, item)) {
    showNotice(`Gathered ${labelForItem(item)}.`);
    playCue("gather");
  } else {
    showNotice("Your Pocket is full. Sell, donate, or craft before gathering more.");
    playCue("warn");
  }
}

function catchCreature(creatureId: keyof typeof creatures | undefined, neededTool: string): void {
  if (!creatureId) {
    showNotice(`Equip the ${neededTool} first.`);
    playCue("warn");
    return;
  }
  const softFail = !forceCatchSuccess && Math.random() < 0.18;
  if (softFail) {
    showNotice("Almost. The timing was a little early.");
    playCue("warn");
    return;
  }
  if (addItem(state, creatureId)) {
    const creature = creatures[creatureId];
    const freshness = state.donatedCreatures.has(creatureId) ? "" : " New catch.";
    showNotice(`Caught ${creature.label}.${freshness}`);
    playCue("catch");
  } else {
    showNotice("Your Pocket is full. Make room before catching more.");
    playCue("warn");
  }
}

function donateFirstCreature(): void {
  const creature = state.pocket.find((entry) => entry.id in creatures && !state.donatedCreatures.has(entry.id));
  if (!creature) {
    showNotice("The museum is waiting for a new fish or bug.");
    playCue("warn");
    return;
  }
  donateCreature(state, creature.id);
  showNotice(`Donated ${labelForItem(creature.id)} to the museum tent.`);
  playCue("donate");
}

function sellPocketGoods(): void {
  let total = 0;
  for (const entry of [...state.pocket]) {
    if (entry.id in resources || entry.id in creatures) {
      total += sellItem(state, entry.id, entry.count);
    }
  }
  showNotice(total > 0 ? `Sold island goods for ${total} Bells.` : "The stall buys resources, fish, and bugs.");
  playCue(total > 0 ? "sell" : "warn");
}

function craftNextUsefulItem(): void {
  const craftOrder: Array<keyof typeof recipes> = ["rod", "net", "stool", "flowerBox", "axe", "shovel"];
  const recipeId = craftOrder.find((id) => itemCount(state, id) === 0 && craftItem(state, id));
  if (recipeId) {
    showNotice(`Crafted ${recipes[recipeId].label}.`);
    playCue("craft");
    return;
  }
  const repeatPlaceable = (["stool", "flowerBox"] as PlaceableId[]).find((id) => craftItem(state, id));
  showNotice(repeatPlaceable ? `Crafted ${recipes[repeatPlaceable].label}.` : "Gather more materials before crafting.");
  playCue(repeatPlaceable ? "craft" : "warn");
}

function placeDecoration(): void {
  const placeable = state.pocket.find((entry) => entry.id === "stool" || entry.id === "flowerBox");
  if (!placeable) {
    showNotice("Craft a stool or flower box before placing decorations.");
    playCue("warn");
    return;
  }
  const x = avatarPosition.x + Math.sin(avatar.rotation.y) * 1.2;
  const z = avatarPosition.z + Math.cos(avatar.rotation.y) * 1.2;
  if (!placeItem(state, placeable.id as PlaceableId, x, z)) {
    showNotice("That decoration could not be placed here.");
    playCue("warn");
    return;
  }
  addPlacedDecoration(placeable.id as PlaceableId, x, z);
  showNotice(`Placed ${labelForItem(placeable.id)}.`);
  playCue("craft");
  saveState();
  updateHud();
}

function labelForItem(id: ItemId): string {
  if (id in resources) return resources[id as keyof typeof resources].label;
  if (id in creatures) return creatures[id as keyof typeof creatures].label;
  if (id in tools) return tools[id as keyof typeof tools].label;
  return recipes[id as keyof typeof recipes].label;
}

function saveState(): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(serializeIslandState(state)));
}

function loadState(): IslandState {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) {
    return createIslandState();
  }
  try {
    return hydrateIslandState(JSON.parse(saved));
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return createIslandState();
  }
}

function playCue(kind: "gather" | "catch" | "craft" | "donate" | "sell" | "talk" | "warn" | "complete"): void {
  if (muted) return;
  audioContext ??= new AudioContext();
  startAmbientLoop();
  const frequencies: Record<typeof kind, number> = {
    gather: 420,
    catch: 640,
    craft: 520,
    donate: 720,
    sell: 580,
    talk: 360,
    warn: 180,
    complete: 880,
  };
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequencies[kind];
  oscillator.type = kind === "warn" ? "square" : "sine";
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
}

function startAmbientLoop(): void {
  if (!audioContext || ambientGain) return;
  ambientGain = audioContext.createGain();
  ambientGain.gain.value = 0.018;
  const low = audioContext.createOscillator();
  const high = audioContext.createOscillator();
  low.frequency.value = 174;
  high.frequency.value = 261.63;
  low.type = "sine";
  high.type = "triangle";
  low.connect(ambientGain);
  high.connect(ambientGain);
  ambientGain.connect(audioContext.destination);
  low.start();
  high.start();
}

function addLandmark(label: string, x: number, z: number, radius: number, color: number): void {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.08, 32),
    new THREE.MeshStandardMaterial({ color, roughness: 0.82 }),
  );
  mesh.position.set(x, 0.02, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
  addLabel(label, x, z, radius + 0.3);
}

function addBuilding(label: string, x: number, z: number, color: number, action: string, kind: Interactable["kind"]): void {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.35, 1.5),
    new THREE.MeshStandardMaterial({ color, roughness: 0.75 }),
  );
  base.position.y = 0.68;
  base.castShadow = true;
  group.add(base);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.35, 0.9, 4),
    new THREE.MeshStandardMaterial({ color: 0xf7e39a, roughness: 0.8 }),
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 1.7;
  roof.castShadow = true;
  group.add(roof);
  group.position.set(x, 0, z);
  scene.add(group);
  colliders.push({ x, z, radius: 1.35 });
  interactables.push({ id: label, label, kind, action, x, z, radius: 1.65 });
  addLabel(label, x, z, 1.9);
}

function addVillager(label: string, x: number, z: number, color: number): void {
  const villager = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 20, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.72 }),
  );
  villager.scale.y = 1.18;
  villager.position.set(x, 0.58, z);
  villager.castShadow = true;
  scene.add(villager);
  colliders.push({ x, z, radius: 0.7 });
  interactables.push({ id: label, label, kind: "villager", action: "Talk to", x, z, radius: 0.85 });
}

function addTree(x: number, z: number): void {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 1.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x9b6739, roughness: 0.9 }),
  );
  trunk.position.set(x, 0.58, z);
  trunk.castShadow = true;
  scene.add(trunk);
  const leaves = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.95, 1),
    new THREE.MeshStandardMaterial({ color: 0x4fa95d, roughness: 0.85 }),
  );
  leaves.position.set(x, 1.5, z);
  leaves.castShadow = true;
  scene.add(leaves);
  colliders.push({ x, z, radius: 0.82 });
  interactables.push({ id: "branches", label: "Grove Tree", kind: "resource", action: "Shake", x, z, radius: 1 });
}

function addRock(x: number, z: number): void {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.62, 0),
    new THREE.MeshStandardMaterial({ color: 0x8f9998, roughness: 0.95 }),
  );
  rock.scale.set(1.2, 0.72, 0.9);
  rock.position.set(x, 0.38, z);
  rock.castShadow = true;
  scene.add(rock);
  colliders.push({ x, z, radius: 0.75 });
  interactables.push({ id: "stone", label: "Rock Garden", kind: "resource", action: "Mine", requiredTool: "shovel", x, z, radius: 1 });
}

function addWater(label: string, x: number, z: number, rx: number, rz: number): void {
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    new THREE.MeshStandardMaterial({ color: 0x57b7d6, roughness: 0.35, metalness: 0.05 }),
  );
  water.scale.set(rx, rz, 1);
  water.rotation.x = -Math.PI / 2;
  water.position.set(x, 0.03, z);
  scene.add(water);
  interactables.push({ id: label, label, kind: "water", action: "Fish at", requiredTool: "rod", x, z, radius: Math.max(rx, rz) });
}

function addPickup(label: string, id: keyof typeof resources, x: number, z: number, color: number): void {
  const pickup = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.28, 0),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
  );
  pickup.position.set(x, 0.24, z);
  pickup.castShadow = true;
  scene.add(pickup);
  interactables.push({ id, label, kind: "resource", action: "Gather", x, z, radius: 0.8 });
}

function addCreature(label: string, id: keyof typeof creatures, x: number, z: number): void {
  const bug = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xffd544, roughness: 0.65 }),
  );
  bug.scale.set(1.2, 0.45, 0.8);
  bug.position.set(x, 0.45, z);
  scene.add(bug);
  interactables.push({ id, label, kind: "bug", action: "Catch", requiredTool: "net", x, z, radius: 0.7 });
}

function addPlacedDecoration(id: PlaceableId, x: number, z: number): void {
  const mesh = new THREE.Mesh(
    id === "stool" ? new THREE.CylinderGeometry(0.36, 0.42, 0.42, 12) : new THREE.BoxGeometry(0.78, 0.36, 0.32),
    new THREE.MeshStandardMaterial({ color: id === "stool" ? 0xd8a45f : 0xf58ab4, roughness: 0.82 }),
  );
  mesh.position.set(x, 0.22, z);
  mesh.castShadow = true;
  scene.add(mesh);
  colliders.push({ x, z, radius: 0.42 });
}

function addLabel(label: string, x: number, z: number, offset: number): void {
  const marker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
  );
  marker.position.set(x, 0.35, z + offset);
  marker.userData.label = label;
  scene.add(marker);
}
