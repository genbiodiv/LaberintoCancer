import * as THREE from 'three';
import {
  CancerSeverityMetrics,
  computeCancerSeverityMetrics,
  LabyrinthVisualTheme,
} from '../../engine/labyrinthAesthetics';
import {
  LabyrinthChamber,
  LabyrinthDiagnosticStation,
  LabyrinthPortal,
} from '../../engine/labyrinthLayout';
import { GameMode } from '../../engine/types';

export interface ProceduralTexturePack {
  wallAlbedo: THREE.CanvasTexture;
  wallBump: THREE.CanvasTexture;
  floorAlbedo: THREE.CanvasTexture;
  pillarAlbedo: THREE.CanvasTexture;
  portalMembrane: THREE.CanvasTexture;
  dispose: () => void;
}

function configureTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
  highDetail = false,
  maxAnisotropy = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  if (highDetail) {
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = Math.min(Math.max(1, maxAnisotropy), 8);
  } else {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.anisotropy = 1;
  }
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}

/**
 * Deterministic procedural PBR textures driven by LabyrinthVisualTheme.
 * Scales seamlessly from 64px retro pixel-art (Baja) to 256px crisp architectural detail (Media/Alta/Ultra).
 */
export function createProceduralTexturePack(
  theme: LabyrinthVisualTheme,
  highDetail = false,
  maxAnisotropy = 1,
  severity?: CancerSeverityMetrics
): ProceduralTexturePack {
  const s = highDetail ? 4 : 1; // 1 => 64px retro, 4 => 256px sharp
  const sevVein = severity ? severity.veinIntensity : theme.cracksIntensity;
  const sevBurden = severity ? severity.burden : Math.round(theme.cracksIntensity * 100);

  // 1. Bio-masonry wall albedo (64x64 or 256x256)
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 64 * s;
  wallCanvas.height = 64 * s;
  const wCtx = wallCanvas.getContext('2d')!;
  wCtx.scale(s, s);

  const baseWall = theme.wallBase;
  const brickLight = theme.wallLight;
  const brickDark = theme.wallDark;
  const mortar = theme.wallMortar;
  const veinAccent = theme.wallVein;

  wCtx.fillStyle = mortar;
  wCtx.fillRect(0, 0, 64, 64);

  // 4 staggered brick courses
  const rows = 4;
  const rowH = 16;
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : 16;
    for (let c = -1; c < 3; c++) {
      const bx = c * 32 + offset;
      const by = r * rowH;
      wCtx.fillStyle = (r + c) % 2 === 0 ? baseWall : brickLight;
      wCtx.fillRect(bx + 1, by + 1, 30, rowH - 2);
      // Bevel top highlight + bottom shadow
      wCtx.fillStyle = 'rgba(255,255,255,0.14)';
      wCtx.fillRect(bx + 1, by + 1, 30, highDetail ? 1.5 : 2);
      wCtx.fillStyle = brickDark;
      wCtx.fillRect(bx + 1, by + rowH - (highDetail ? 2.5 : 3), 30, highDetail ? 1.5 : 2);
      if (highDetail) {
        // Subtle chamfered vertical edge on high-detail masonry
        wCtx.fillStyle = 'rgba(255,255,255,0.06)';
        wCtx.fillRect(bx + 1, by + 1, 1.2, rowH - 2);
        wCtx.fillStyle = 'rgba(0,0,0,0.12)';
        wCtx.fillRect(bx + 29.8, by + 1, 1.2, rowH - 2);
      }
    }
  }

  // Recessed molecular conduit stripe along middle course
  wCtx.fillStyle = veinAccent;
  wCtx.fillRect(0, 31, 64, 2);
  wCtx.fillStyle = theme.wallVeinGlow;
  for (let x = 4; x < 64; x += 16) {
    wCtx.fillRect(x, 31, 6, 2);
  }

  // Progressive branching vascular veins / cellular fractures scaling with live cancer severity
  if (sevVein >= 0.22) {
    wCtx.save();
    const veinBranches = sevVein >= 0.72 ? 5 : sevVein >= 0.45 ? 3 : 2;
    for (let b = 0; b < veinBranches; b++) {
      wCtx.beginPath();
      let vx = (8 + b * 13) % 64;
      let vy = b % 2 === 0 ? 0 : 64;
      const dirY = b % 2 === 0 ? 1 : -1;
      wCtx.moveTo(vx, vy);
      for (let step = 0; step < 7; step++) {
        vx = (vx + ((step + b) % 2 === 0 ? 4.5 : -3.5) + 64) % 64;
        vy += dirY * 9.2;
        wCtx.lineTo(vx, vy);
      }
      wCtx.strokeStyle = sevBurden >= 50 ? '#dc2626' : veinAccent;
      wCtx.lineWidth = sevVein >= 0.72 ? 2.1 : sevVein >= 0.45 ? 1.5 : 1.0;
      wCtx.globalAlpha = Math.min(0.95, 0.35 + sevVein * 0.65);
      wCtx.stroke();

      if (sevVein >= 0.52) {
        wCtx.strokeStyle = sevBurden >= 75 ? '#fca5a5' : theme.wallVeinGlow;
        wCtx.lineWidth = highDetail ? 0.65 : 0.9;
        wCtx.globalAlpha = Math.min(0.9, 0.3 + sevVein * 0.55);
        wCtx.stroke();
      }
    }

    // Cellular inflammation blotches at high/critical severity
    if (sevBurden >= 50) {
      const blotchCount = sevBurden >= 75 ? 10 : 5;
      for (let i = 0; i < blotchCount; i++) {
        const bx = (i * 17 + 11) % 64;
        const by = (i * 23 + 9) % 64;
        const r = sevBurden >= 75 ? 3.8 : 2.5;
        wCtx.fillStyle = sevBurden >= 75 ? 'rgba(185, 28, 28, 0.36)' : 'rgba(225, 29, 72, 0.22)';
        wCtx.beginPath();
        wCtx.arc(bx, by, r, 0, Math.PI * 2);
        wCtx.fill();
      }
    }
    wCtx.restore();
  }

  // Deterministic grain speckles (finer in high-detail mode)
  const grainCount = highDetail ? 140 : 42;
  const grainSize = highDetail ? 0.75 : 2;
  for (let i = 0; i < grainCount; i++) {
    const gx = (i * 19 + 7) % 64;
    const gy = (i * 31 + 11) % 64;
    wCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)';
    wCtx.fillRect(gx, gy, grainSize, grainSize);
  }

  // 2. Wall bump map (64x64 or 256x256 grayscale)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 64 * s;
  bumpCanvas.height = 64 * s;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.scale(s, s);
  bCtx.fillStyle = '#303030';
  bCtx.fillRect(0, 0, 64, 64);
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : 16;
    for (let c = -1; c < 3; c++) {
      const bx = c * 32 + offset;
      const by = r * rowH;
      bCtx.fillStyle = '#d4d4d4';
      bCtx.fillRect(bx + 2, by + 2, 28, rowH - 4);
    }
  }
  if (sevVein >= 0.35) {
    bCtx.strokeStyle = '#181818';
    bCtx.lineWidth = sevVein >= 0.72 ? 2.2 : 1.3;
    for (let b = 0; b < 3; b++) {
      bCtx.beginPath();
      let vx = (8 + b * 19) % 64;
      let vy = 0;
      bCtx.moveTo(vx, vy);
      for (let step = 0; step < 6; step++) {
        vx = (vx + ((step + b) % 2 === 0 ? 5 : -4) + 64) % 64;
        vy += 11;
        bCtx.lineTo(vx, vy);
      }
      bCtx.stroke();
    }
  }

  // 3. Tiled stone laboratory floor (64x64 or 256x256)
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 64 * s;
  floorCanvas.height = 64 * s;
  const fCtx = floorCanvas.getContext('2d')!;
  fCtx.scale(s, s);
  const tileA = theme.floorTileA;
  const tileB = theme.floorTileB;
  const seam = theme.floorSeam;

  fCtx.fillStyle = seam;
  fCtx.fillRect(0, 0, 64, 64);
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      fCtx.fillStyle = (tx + ty) % 2 === 0 ? tileA : tileB;
      fCtx.fillRect(tx * 32 + 1, ty * 32 + 1, 30, 30);
      fCtx.fillStyle = 'rgba(255,255,255,0.09)';
      fCtx.fillRect(tx * 32 + 3, ty * 32 + 3, highDetail ? 1.4 : 2, highDetail ? 1.4 : 2);
      fCtx.fillRect(tx * 32 + 27, ty * 32 + 27, highDetail ? 1.4 : 2, highDetail ? 1.4 : 2);
      if (highDetail) {
        fCtx.strokeStyle = 'rgba(255,255,255,0.05)';
        fCtx.lineWidth = 0.6;
        fCtx.strokeRect(tx * 32 + 1.5, ty * 32 + 1.5, 29, 29);
      }
    }
  }
  if (theme.phase >= 2 || sevVein >= 0.42) {
    fCtx.save();
    fCtx.fillStyle = sevBurden >= 60 ? '#ef4444' : theme.wallVeinGlow;
    fCtx.globalAlpha = Math.min(0.9, 0.35 + sevVein * 0.55);
    const seamW = sevBurden >= 75 ? 2 : 1;
    fCtx.fillRect(0, 0, 64, seamW);
    fCtx.fillRect(0, 0, seamW, 64);
    if (sevBurden >= 60) {
      fCtx.fillRect(0, 31, 64, 1);
      fCtx.fillRect(31, 0, 1, 64);
    }
    fCtx.restore();
  }

  // 4. Fluted corner pillar texture (32x32 or 128x128)
  const pillarCanvas = document.createElement('canvas');
  pillarCanvas.width = 32 * s;
  pillarCanvas.height = 32 * s;
  const pCtx = pillarCanvas.getContext('2d')!;
  pCtx.scale(s, s);
  pCtx.fillStyle = theme.pillarBase;
  pCtx.fillRect(0, 0, 32, 32);
  for (let x = 2; x < 32; x += 6) {
    pCtx.fillStyle = 'rgba(255,255,255,0.12)';
    pCtx.fillRect(x, 0, 2, 32);
    pCtx.fillStyle = 'rgba(0,0,0,0.2)';
    pCtx.fillRect(x + 2, 0, 2, 32);
  }
  pCtx.fillStyle = theme.pillarBand;
  pCtx.fillRect(0, 6, 32, 2);
  pCtx.fillRect(0, 24, 32, 2);

  // 5. Energy portal membrane grid (32x32 or 128x128)
  const portalCanvas = document.createElement('canvas');
  portalCanvas.width = 32 * s;
  portalCanvas.height = 32 * s;
  const mCtx = portalCanvas.getContext('2d')!;
  mCtx.scale(s, s);
  mCtx.fillStyle = '#ffffff';
  mCtx.fillRect(0, 0, 32, 32);
  mCtx.fillStyle = '#c4d4ff';
  const lineW = highDetail ? 0.65 : 1;
  for (let y = 0; y < 32; y += 4) {
    mCtx.fillRect(0, y, 32, lineW);
  }
  for (let x = 0; x < 32; x += 8) {
    mCtx.fillRect(x, 0, lineW, 32);
  }

  const wallAlbedo = configureTexture(wallCanvas, true, 1, 1, highDetail, maxAnisotropy);
  const wallBump = configureTexture(bumpCanvas, false, 1, 1, highDetail, maxAnisotropy);
  const floorAlbedo = configureTexture(floorCanvas, true, 24, 24, highDetail, maxAnisotropy);
  const pillarAlbedo = configureTexture(pillarCanvas, true, 1, 2, highDetail, maxAnisotropy);
  const portalMembrane = configureTexture(portalCanvas, true, 1, 2, highDetail, maxAnisotropy);

  return {
    wallAlbedo,
    wallBump,
    floorAlbedo,
    pillarAlbedo,
    portalMembrane,
    dispose: () => {
      wallAlbedo.dispose();
      wallBump.dispose();
      floorAlbedo.dispose();
      pillarAlbedo.dispose();
      portalMembrane.dispose();
    },
  };
}

/**
 * Creates a floating canvas sprite sign for portals or stations.
 * Renders at 2x resolution with smooth filtering in high-detail modes.
 */
export function createLabelSprite(
  title: string,
  subtitle: string,
  accentCss: string,
  muted = false,
  highDetail = false,
  maxAnisotropy = 1
): THREE.Sprite {
  const scale = highDetail ? 2 : 1;
  const width = 340;
  const height = 96;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Solid dark backing (no alpha blur) with bold accent border
  ctx.fillStyle = muted ? '#1e2430' : '#0b1220';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = muted ? '#475569' : accentCss;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  // Top color accent bar
  ctx.fillStyle = muted ? '#475569' : accentCss;
  ctx.fillRect(3, 3, width - 6, 12);

  // Title text (concise door labels fit cleanly with maxWidth safeguard)
  ctx.fillStyle = muted ? '#94a3b8' : '#ffffff';
  ctx.font = 'bold 24px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const displayTitle = title.length > 20 ? `${title.slice(0, 19)}…` : title;
  ctx.fillText(displayTitle, width / 2, 43, width - 24);

  // Subtitle text
  ctx.fillStyle = muted ? '#64748b' : '#cbd5e1';
  ctx.font = 'bold 15px "IBM Plex Mono", monospace';
  const displaySub = subtitle.length > 26 ? `${subtitle.slice(0, 25)}…` : subtitle;
  ctx.fillText(displaySub, width / 2, 72, width - 24);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (highDetail) {
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.min(Math.max(1, maxAnisotropy), 8);
  } else {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
  }
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: false,
    depthTest: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.95, 0.88, 1);
  return sprite;
}

export interface PortalRig {
  group: THREE.Group;
  keystone: THREE.Mesh;
  membrane: THREE.Mesh | null;
  hitbox: THREE.Mesh;
  portal: LabyrinthPortal;
}

/**
 * 8-part composite procedural archway (bottom-center pivot grounded at y = 0).
 */
export function createForkPortalGroup(
  portal: LabyrinthPortal,
  portalMembraneTex: THREE.CanvasTexture,
  highDetail = false,
  maxAnisotropy = 1
): PortalRig {
  const group = new THREE.Group();
  group.position.set(portal.x, 0, portal.z);
  group.rotation.y = portal.yaw;

  const isActive = portal.status === 'active';
  const isChosen = portal.status === 'chosen';
  const isSealed = portal.status === 'sealed';

  const frameColor = isSealed ? 0x334155 : isChosen ? 0x475569 : 0x526075;
  const trimColor = isSealed ? 0x475569 : portal.accentHex;

  const stoneMat = new THREE.MeshStandardMaterial({
    color: frameColor,
    roughness: 0.82,
    metalness: 0.12,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    emissive: isActive ? portal.accentHex : isChosen ? 0x1e293b : 0x000000,
    emissiveIntensity: isActive ? 0.55 : isChosen ? 0.25 : 0,
    roughness: 0.45,
    metalness: 0.3,
  });

  // 1 & 2: Left & right plinths grounded at y = 0
  const plinthGeo = new THREE.BoxGeometry(0.68, 0.36, 0.78);
  const leftPlinth = new THREE.Mesh(plinthGeo, stoneMat);
  leftPlinth.position.set(-1.38, 0.18, 0);
  const rightPlinth = new THREE.Mesh(plinthGeo, stoneMat);
  rightPlinth.position.set(1.38, 0.18, 0);
  group.add(leftPlinth, rightPlinth);

  // 3 & 4: Left & right vertical pillars
  const pillarGeo = new THREE.BoxGeometry(0.46, 2.75, 0.54);
  const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
  leftPillar.position.set(-1.38, 0.36 + 1.375, 0);
  const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
  rightPillar.position.set(1.38, 0.36 + 1.375, 0);
  group.add(leftPillar, rightPillar);

  // Inner glowing accent strips along pillars
  const stripGeo = new THREE.BoxGeometry(0.1, 2.55, 0.58);
  const leftStrip = new THREE.Mesh(stripGeo, trimMat);
  leftStrip.position.set(-1.12, 0.36 + 1.35, 0);
  const rightStrip = new THREE.Mesh(stripGeo, trimMat);
  rightStrip.position.set(1.12, 0.36 + 1.35, 0);
  group.add(leftStrip, rightStrip);

  // 5 & 6: Archway lintel + beveled cornice cap
  const lintelGeo = new THREE.BoxGeometry(3.48, 0.44, 0.72);
  const lintel = new THREE.Mesh(lintelGeo, stoneMat);
  lintel.position.set(0, 3.32, 0);
  const corniceGeo = new THREE.BoxGeometry(3.72, 0.16, 0.86);
  const cornice = new THREE.Mesh(corniceGeo, trimMat);
  cornice.position.set(0, 3.6, 0);
  group.add(lintel, cornice);

  // 7: Rotating octahedral keystone beacon
  const keystoneGeo = new THREE.OctahedronGeometry(0.28, 0);
  const keystoneMat = new THREE.MeshStandardMaterial({
    color: isSealed ? 0x64748b : portal.accentHex,
    emissive: isActive ? portal.accentHex : isChosen ? portal.accentHex : 0x000000,
    emissiveIntensity: isActive ? 1.05 : isChosen ? 0.35 : 0,
    roughness: 0.25,
    metalness: 0.4,
  });
  const keystone = new THREE.Mesh(keystoneGeo, keystoneMat);
  keystone.position.set(0, 3.98, 0);
  group.add(keystone);

  // 8: Threshold floor strip (offset at y = 0.015 to avoid z-fighting)
  const floorStripGeo = new THREE.PlaneGeometry(2.3, 1.1);
  const floorStripMat = new THREE.MeshBasicMaterial({
    color: isSealed ? 0x334155 : portal.accentHex,
    transparent: true,
    opacity: isActive ? 0.38 : isChosen ? 0.22 : 0.14,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const floorStrip = new THREE.Mesh(floorStripGeo, floorStripMat);
  floorStrip.rotation.x = -Math.PI / 2;
  floorStrip.position.set(0, 0.018, 0.35);
  group.add(floorStrip);

  // Portal energy curtain (active) or sealed iron gate bars (sealed)
  let membrane: THREE.Mesh | null = null;
  if (isActive) {
    const memGeo = new THREE.PlaneGeometry(2.14, 3.05);
    const memMat = new THREE.MeshBasicMaterial({
      color: portal.accentHex,
      map: portalMembraneTex,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    membrane = new THREE.Mesh(memGeo, memMat);
    membrane.position.set(0, 1.54, 0);
    group.add(membrane);
  } else if (isSealed) {
    const barMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.5,
    });
    const barGeo = new THREE.BoxGeometry(0.11, 3.05, 0.12);
    for (const bx of [-0.72, -0.24, 0.24, 0.72]) {
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(bx, 1.54, 0);
      group.add(bar);
    }
    const crossGeo = new THREE.BoxGeometry(2.2, 0.14, 0.16);
    const cross = new THREE.Mesh(crossGeo, barMat);
    cross.position.set(0, 1.54, 0);
    group.add(cross);
  }

  // Nameplate sprite above lintel
  const statusSub = isSealed
    ? 'Sendero sellado'
    : isChosen
      ? 'Sendero elegido ✓'
      : portal.sublabel;
  const sign = createLabelSprite(
    portal.label,
    statusSub,
    portal.accentCss,
    isSealed,
    highDetail,
    maxAnisotropy
  );
  sign.position.set(0, 4.58, 0.68);
  group.add(sign);

  // Dedicated raycast hitbox (only active portals are clickable)
  const hitboxGeo = new THREE.BoxGeometry(2.8, 3.6, 1.0);
  const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
  hitbox.position.set(0, 1.8, 0);
  hitbox.userData = {
    kind: 'portal',
    portalId: portal.id,
    actionId: portal.actionId,
    active: isActive,
  };
  group.add(hitbox);

  return { group, keystone, membrane, hitbox, portal };
}

export interface TotemRig {
  group: THREE.Group;
  core: THREE.Mesh;
  ringA: THREE.Mesh;
  ringB: THREE.Mesh;
}

/**
 * Overhead suspended molecular chandelier + walkable floor compass disc at chamber center
 * so sightlines to all 3 forking archways stay 100% unobstructed.
 */
export function createChamberTotemGroup(
  centerX: number,
  centerZ: number,
  mode: GameMode,
  isCurrent: boolean
): TotemRig {
  const group = new THREE.Group();
  group.position.set(centerX, 0, centerZ);

  const primaryHex = mode === 'cancer' ? 0xe11d48 : 0x0284c7;
  const secondaryHex = mode === 'cancer' ? 0xf59e0b : 0x10b981;

  // Walkable floor compass ring (y = 0.015)
  const discGeo = new THREE.RingGeometry(1.05, 1.45, 12);
  const discMat = new THREE.MeshBasicMaterial({
    color: isCurrent ? primaryHex : 0x475569,
    transparent: true,
    opacity: isCurrent ? 0.45 : 0.2,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const floorRing = new THREE.Mesh(discGeo, discMat);
  floorRing.rotation.x = -Math.PI / 2;
  floorRing.position.y = 0.016;
  group.add(floorRing);

  // Inner contact shadow disc
  const shadowGeo = new THREE.CircleGeometry(1.02, 12);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x090d16,
    transparent: true,
    opacity: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.014;
  group.add(shadowDisc);

  // Hovering molecular core (at y = 5.15 — safely above the center portal sign sightline)
  const coreGeo = new THREE.OctahedronGeometry(0.32, 0);
  const coreMat = new THREE.MeshStandardMaterial({
    color: isCurrent ? primaryHex : 0x64748b,
    emissive: isCurrent ? primaryHex : 0x1e293b,
    emissiveIntensity: isCurrent ? 0.9 : 0.2,
    roughness: 0.3,
    metalness: 0.35,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 5.15;
  group.add(core);

  // Twin tilted orbital rings (helical molecular emblem)
  const torusGeo = new THREE.TorusGeometry(0.58, 0.045, 6, 16);
  const ringAMat = new THREE.MeshStandardMaterial({
    color: isCurrent ? secondaryHex : 0x475569,
    emissive: isCurrent ? secondaryHex : 0x000000,
    emissiveIntensity: isCurrent ? 0.55 : 0,
    roughness: 0.4,
    metalness: 0.45,
  });
  const ringA = new THREE.Mesh(torusGeo, ringAMat);
  ringA.position.y = 5.15;
  ringA.rotation.x = Math.PI / 3;
  group.add(ringA);

  const ringB = new THREE.Mesh(torusGeo, coreMat);
  ringB.position.y = 5.15;
  ringB.rotation.x = -Math.PI / 3;
  ringB.rotation.y = Math.PI / 2;
  group.add(ringB);

  return { group, core, ringA, ringB };
}

export interface DiagnosticRig {
  group: THREE.Group;
  beacon: THREE.Mesh;
  hitbox: THREE.Mesh;
  station: LabyrinthDiagnosticStation;
}

/**
 * 5-part diagnostic terminal along chamber walls for Oncologist Mode.
 */
export function createDiagnosticConsoleGroup(
  station: LabyrinthDiagnosticStation,
  chamberCenterX: number,
  highDetail = false,
  maxAnisotropy = 1
): DiagnosticRig {
  const group = new THREE.Group();
  group.position.set(station.x, 0, station.z);
  // Face inward toward chamber center
  const faceSign = station.x < chamberCenterX ? 1 : -1;
  group.rotation.y = faceSign > 0 ? Math.PI / 2 : -Math.PI / 2;

  const accentHex = station.completed ? 0x10b981 : 0x38bdf8;
  const accentCss = station.completed ? '#10b981' : '#38bdf8';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.72,
    metalness: 0.25,
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: station.completed ? 0.7 : 0.95,
    roughness: 0.25,
  });

  // 1: Base pedestal grounded at y = 0
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.92, 0.65), bodyMat);
  base.position.y = 0.46;
  group.add(base);

  // 2: Sloped monitor hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.56, 0.52), bodyMat);
  hood.position.set(0, 1.15, -0.05);
  hood.rotation.x = -0.25;
  group.add(hood);

  // 3: Emissive terminal screen
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.42), screenMat);
  screen.position.set(0, 1.16, 0.22);
  screen.rotation.x = -0.25;
  group.add(screen);

  // 4: Floating status crystal beacon
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), screenMat);
  beacon.position.set(0, 1.72, 0);
  group.add(beacon);

  // 5: Label sign
  const sign = createLabelSprite(
    station.label,
    station.completed ? 'Completado ✓' : 'Clic · Ejecutar',
    accentCss,
    false,
    highDetail,
    maxAnisotropy
  );
  sign.scale.set(2.15, 0.64, 1);
  sign.position.set(0, 2.25, 0);
  group.add(sign);

  // Click hitbox
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.1, 1.1),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitbox.position.y = 1.05;
  hitbox.userData = {
    kind: 'diagnostic',
    toolId: station.toolId,
    completed: station.completed,
  };
  group.add(hitbox);

  return { group, beacon, hitbox, station };
}

export interface DestinationBeaconRig {
  group: THREE.Group;
  core: THREE.Mesh;
  ringOuter: THREE.Mesh;
  ringInner: THREE.Mesh;
}

/**
 * Towering Destination Beacon rising beyond the northern wall.
 * Scales and brightens dramatically as the player nears their role's ultimate destination.
 */
export function createDestinationBeaconGroup(
  x: number,
  z: number,
  theme: LabyrinthVisualTheme
): DestinationBeaconRig {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const s = theme.beaconVisibleScale;

  const stoneMat = new THREE.MeshStandardMaterial({
    color: theme.capColor,
    roughness: 0.6,
    metalness: 0.25,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: theme.beaconHex,
    emissive: theme.beaconHex,
    emissiveIntensity: Math.max(0.5, theme.beaconIntensity),
    roughness: 0.2,
    metalness: 0.35,
  });

  // 1: Stepped pedestal grounded at y = 0
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.6 * s, 1.2, 3.6 * s), stoneMat);
  base.position.y = 0.6;
  group.add(base);

  // 2: Skyward light spire
  const spireHeight = 11.5 + theme.phase * 4.5;
  const spire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * s, 0.6 * s, spireHeight, 8),
    new THREE.MeshBasicMaterial({
      color: theme.beaconHex,
      transparent: true,
      opacity: 0.3 + theme.phase * 0.14,
    })
  );
  spire.position.y = 1.2 + spireHeight / 2;
  group.add(spire);

  // 3: Floating octahedron crown soaring above the northern horizon
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.15 * s, 0), glowMat);
  core.position.y = 8.8 + theme.phase * 0.9;
  group.add(core);

  // 4 & 5: Twin orbital destination rings
  const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(2.15 * s, 0.11 * s, 6, 20), glowMat);
  ringOuter.position.y = core.position.y;
  ringOuter.rotation.x = Math.PI / 3;
  group.add(ringOuter);

  const ringInner = new THREE.Mesh(new THREE.TorusGeometry(1.5 * s, 0.09 * s, 6, 16), stoneMat);
  ringInner.position.y = core.position.y;
  ringInner.rotation.x = -Math.PI / 3;
  group.add(ringInner);

  return { group, core, ringOuter, ringInner };
}

export interface BioGrowthInstance {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  rotY: number;
  phase: number;
}

export interface BioGrowthRig {
  mesh: THREE.InstancedMesh;
  material: THREE.MeshStandardMaterial;
  baseEmissiveIntensity: number;
  instances: BioGrowthInstance[];
}

/**
 * Instanced organic cellular/tumorous nodules anchored in chamber corners & wall bases
 * (kept safely outside walkable paths and portal sightlines) that grow in count, scale,
 * and pulsing crimson glow as cancer severity climbs.
 */
export function createSeverityBioGrowths(
  chambers: LabyrinthChamber[],
  severity: CancerSeverityMetrics
): BioGrowthRig | null {
  if (severity.bioGrowthCount <= 0 || chambers.length === 0) {
    return null;
  }

  // Deterministic side-wall & south-corner slots per chamber (100% clear of north portals & walkable paths)
  const cornerSlots: readonly { dx: number; dz: number; elev: number }[] = [
    { dx: -6.5, dz: -2.8, elev: 0.36 },
    { dx: 6.5, dz: -2.8, elev: 0.38 },
    { dx: -6.55, dz: -0.9, elev: 0.42 },
    { dx: 6.55, dz: -0.9, elev: 0.4 },
    { dx: -6.5, dz: 1.4, elev: 0.36 },
    { dx: 6.5, dz: 1.4, elev: 0.38 },
    { dx: -6.55, dz: -2.3, elev: 1.35 },
    { dx: 6.55, dz: -2.3, elev: 1.4 },
    { dx: -6.6, dz: 0.2, elev: 1.85 },
    { dx: 6.6, dz: 0.2, elev: 1.75 },
    { dx: -6.5, dz: 3.4, elev: 0.45 },
    { dx: 6.5, dz: 3.4, elev: 0.42 },
    { dx: -6.6, dz: -1.4, elev: 2.55 },
    { dx: 6.6, dz: -1.4, elev: 2.48 },
    { dx: -5.4, dz: 5.4, elev: 0.35 },
    { dx: 5.4, dz: 5.4, elev: 0.35 },
  ];

  // Prioritize the current chamber and the 2 most recent chambers so the active view feels alive
  const recentChambers = chambers.slice(-3).reverse();
  const instances: BioGrowthInstance[] = [];
  const totalWanted = severity.bioGrowthCount;
  const sevScale = 0.72 + severity.normalized * 0.95;

  for (let i = 0; i < totalWanted; i++) {
    const ch = recentChambers[i % recentChambers.length];
    const slotIdx = Math.floor(i / recentChambers.length) % cornerSlots.length;
    const slot = cornerSlots[slotIdx];
    const jitter = ((i * 37) % 11) / 11 - 0.5;
    const scaleJitter = 0.75 + (((i * 19) % 7) / 7) * 0.65;
    const sBase = sevScale * scaleJitter;

    instances.push({
      x: ch.centerX + slot.dx + jitter * 0.35,
      y: slot.elev * (0.85 + severity.normalized * 0.35),
      z: ch.centerZ + slot.dz - jitter * 0.3,
      sx: sBase * 1.15,
      sy: sBase * (0.82 + ((i % 3) * 0.16)),
      sz: sBase * 1.05,
      rotY: (i * 1.37) % (Math.PI * 2),
      phase: i * 0.85,
    });
  }

  const geo = new THREE.DodecahedronGeometry(0.46, 0);
  const baseColor =
    severity.level === 'critica'
      ? 0x991b1b
      : severity.level === 'alta'
        ? 0xbe123c
        : 0x9f1239;
  const emissiveColor =
    severity.level === 'critica'
      ? 0xef4444
      : severity.level === 'alta'
        ? 0xf43f5e
        : 0xd97706;
  const baseEmissiveIntensity = 0.25 + severity.normalized * 0.9;

  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: emissiveColor,
    emissiveIntensity: baseEmissiveIntensity,
    roughness: 0.42,
    metalness: 0.14,
  });

  const mesh = new THREE.InstancedMesh(geo, material, instances.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const scl = new THREE.Vector3();

  for (let i = 0; i < instances.length; i++) {
    const inst = instances[i];
    pos.set(inst.x, inst.y, inst.z);
    euler.set(inst.phase * 0.3, inst.rotY, inst.phase * 0.2);
    quat.setFromEuler(euler);
    scl.set(inst.sx, inst.sy, inst.sz);
    m.compose(pos, quat, scl);
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();

  return { mesh, material, baseEmissiveIntensity, instances };
}

/**
 * Adaptive procedural Web Audio synthesizer for footsteps, portal cues,
 * ambient cellular tension drone, and biological heartbeat scaling with cancer severity.
 */
export class LabyrinthAudio {
  private ctx: AudioContext | null = null;
  private droneOscA: OscillatorNode | null = null;
  private droneOscB: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private droneGain: GainNode | null = null;
  private heartbeatTimerId: number | null = null;
  private severityBurden = 16;
  private currentMode: GameMode = 'cancer';
  private ambientStarted = false;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtor) return null;
        this.ctx = new AudioCtor();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(nextMuted: boolean): void {
    this.muted = nextMuted;
    if (nextMuted) {
      this.stopHeartbeatLoop();
      if (this.ctx && this.droneGain) {
        this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.06);
      }
    } else if (this.ambientStarted) {
      this.ensureAmbientStarted();
      this.applySeverityToDrone();
      this.scheduleNextHeartbeat();
    }
  }

  public setSeverity(tumorBurden: number, mode: GameMode): void {
    this.severityBurden = Math.max(0, Math.min(100, Math.round(tumorBurden)));
    this.currentMode = mode;
    this.applySeverityToDrone();
    if (this.ambientStarted && !this.muted && this.heartbeatTimerId === null) {
      this.scheduleNextHeartbeat();
    }
  }

  public ensureAmbientStarted(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.droneOscA || !this.droneOscB || !this.droneFilter || !this.droneGain) {
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      oscA.type = 'sine';
      oscB.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, ctx.currentTime);
      filter.Q.setValueAtTime(1.4, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      oscA.start();
      oscB.start();

      this.droneOscA = oscA;
      this.droneOscB = oscB;
      this.droneFilter = filter;
      this.droneGain = gain;
    }

    this.ambientStarted = true;
    this.applySeverityToDrone();
    if (this.heartbeatTimerId === null) {
      this.scheduleNextHeartbeat();
    }
  }

  private applySeverityToDrone(): void {
    if (!this.ctx || !this.droneOscA || !this.droneOscB || !this.droneFilter || !this.droneGain) {
      return;
    }
    const now = this.ctx.currentTime;
    if (this.muted) {
      this.droneGain.gain.setTargetAtTime(0.0001, now, 0.08);
      return;
    }

    const sev = computeCancerSeverityMetrics(this.severityBurden);
    // Low severity: serene harmonic fifth; High/Critical: tense dark interval & beating dissonance
    let freqA = 98;
    let freqB = 146.83;
    let cutoff = 240;
    let targetGain = 0.013;

    if (sev.level === 'critica') {
      freqA = 73.42; // D2
      freqB = 77.78; // D#2 (urgent beating minor second)
      cutoff = 560;
      targetGain = 0.036;
    } else if (sev.level === 'alta') {
      freqA = 82.41; // E2
      freqB = 116.54; // Bb2 (tense tritone)
      cutoff = 430;
      targetGain = 0.028;
    } else if (sev.level === 'moderada') {
      freqA = 92.5;
      freqB = 130.81;
      cutoff = 320;
      targetGain = 0.02;
    } else if (this.currentMode === 'oncologist') {
      freqA = 110.0;
      freqB = 164.81;
      cutoff = 250;
      targetGain = 0.012;
    }

    this.droneOscA.frequency.setTargetAtTime(freqA, now, 0.35);
    this.droneOscB.frequency.setTargetAtTime(freqB, now, 0.35);
    this.droneFilter.frequency.setTargetAtTime(cutoff, now, 0.35);
    this.droneGain.gain.setTargetAtTime(targetGain, now, 0.35);
  }

  private stopHeartbeatLoop(): void {
    if (this.heartbeatTimerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.heartbeatTimerId);
      this.heartbeatTimerId = null;
    }
  }

  private scheduleNextHeartbeat(): void {
    this.stopHeartbeatLoop();
    if (this.muted || !this.ambientStarted || typeof window === 'undefined') return;
    const sev = computeCancerSeverityMetrics(this.severityBurden);
    const intervalMs = Math.max(460, Math.round(60000 / sev.heartbeatBpm));
    this.heartbeatTimerId = window.setTimeout(() => {
      this.heartbeatTimerId = null;
      this.playHeartbeatPulse();
      this.scheduleNextHeartbeat();
    }, intervalMs);
  }

  private playHeartbeatPulse(): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    if (this.severityBurden < 18) return;

    const sev = computeCancerSeverityMetrics(this.severityBurden);
    const now = this.ctx.currentTime;
    const volume = 0.016 + sev.normalized * 0.072;

    // Lub + Dub double-throb
    const beats: readonly [number, number, number, number][] = [
      [0, 68, 40, volume],
      [0.145, 56, 35, volume * 0.72],
    ];

    for (const [offset, fStart, fEnd, peak] of beats) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fStart, now + offset);
      osc.frequency.exponentialRampToValueAtTime(fEnd, now + offset + 0.11);
      gain.gain.setValueAtTime(0.0008, now + offset);
      gain.gain.linearRampToValueAtTime(peak, now + offset + 0.022);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + offset + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    }
  }

  public playStep(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = 115 - (this.severityBurden / 100) * 26;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.065);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playPortalFocus(severityNorm?: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const n = severityNorm ?? this.severityBurden / 100;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = n >= 0.65 ? 'triangle' : 'sine';
    const startFreq = 350 - n * 95;
    const endFreq = 510 - n * 140;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.14);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playDiagnostic(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [520, 680].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.035, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.1);
    });
  }

  public playBranchCross(burdenAfter?: number, burdenDelta?: number, mode?: GameMode): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const activeBurden = burdenAfter ?? this.severityBurden;
    const activeMode = mode ?? this.currentMode;
    const isEscalating =
      (typeof burdenDelta === 'number' && burdenDelta > 0) ||
      (activeMode === 'cancer' && activeBurden >= 45);

    const chord = isEscalating
      ? activeBurden >= 70
        ? [146.83, 155.56, 207.65] // Urgent low D-Eb-Ab surge
        : [196.0, 233.08, 293.66] // Tense G minor progression
      : [293.66, 369.99, 440.0]; // Clear restorative D major triad

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isEscalating && activeBurden >= 70 ? 'sawtooth' : 'triangle';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isEscalating ? 620 : 1800, now + i * 0.06);

      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(isEscalating ? 0.05 : 0.06, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.32);
    });
  }

  public playDoorLocked(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [155, 118].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.045, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.12);
    });
  }

  public dispose(): void {
    this.stopHeartbeatLoop();
    try {
      this.droneOscA?.stop();
      this.droneOscB?.stop();
      this.droneOscA?.disconnect();
      this.droneOscB?.disconnect();
      this.droneFilter?.disconnect();
      this.droneGain?.disconnect();
    } catch {
      // Ignore already-stopped audio nodes
    }
    this.droneOscA = null;
    this.droneOscB = null;
    this.droneFilter = null;
    this.droneGain = null;
    this.ambientStarted = false;
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
