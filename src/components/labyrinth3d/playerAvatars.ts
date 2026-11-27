import * as THREE from 'three';
import { CancerSeverityMetrics } from '../../engine/labyrinthAesthetics';
import { GameMode } from '../../engine/types';
import { createLabelSprite } from './sceneAssets';

export interface CancerAvatarParts {
  kind: 'cancer';
  clusterGroup: THREE.Group;
  primaryMembrane: THREE.Mesh;
  primaryNucleus: THREE.Mesh;
  satellites: {
    group: THREE.Group;
    basePos: THREE.Vector3;
    phase: number;
    orbitSpeed: number;
  }[];
  shadowDisc: THREE.Mesh;
}

export interface DoctorAvatarParts {
  kind: 'oncologist';
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  shadowDisc: THREE.Mesh;
}

export interface PlayerAvatarRig {
  root: THREE.Group;
  mode: GameMode;
  parts: CancerAvatarParts | DoctorAvatarParts;
}

/**
 * Composite 12-part procedural Tumor Cell Cluster avatar for Cancer Mode.
 * Grounded with a soft contact shadow disc at y = 0; hovers and tumbles organically while moving.
 */
export function createCancerCellAvatarGroup(): PlayerAvatarRig {
  const root = new THREE.Group();

  // 1: Soft contact shadow disc on floor
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x06080f,
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.68, 18), shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.018;
  root.add(shadowDisc);

  const clusterGroup = new THREE.Group();
  clusterGroup.position.y = 0.78;
  root.add(clusterGroup);

  // 2: Primary mother cell semi-translucent outer lipid membrane
  const primaryMembraneMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xbe123c,
    emissiveIntensity: 0.42,
    roughness: 0.22,
    metalness: 0.08,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
  const primaryMembrane = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 14),
    primaryMembraneMat
  );
  primaryMembrane.renderOrder = 3;
  clusterGroup.add(primaryMembrane);

  // 3: Dense dark-crimson cell nucleus + glowing nucleolus inside primary cell
  const primaryNucleusMat = new THREE.MeshStandardMaterial({
    color: 0x881337,
    emissive: 0x9f1239,
    emissiveIntensity: 0.55,
    roughness: 0.48,
    metalness: 0.1,
  });
  const primaryNucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 14, 10),
    primaryNucleusMat
  );
  clusterGroup.add(primaryNucleus);

  const nucleolusMat = new THREE.MeshStandardMaterial({
    color: 0xfecdd3,
    emissive: 0xfb7185,
    emissiveIntensity: 1.05,
    roughness: 0.2,
    metalness: 0.15,
  });
  const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), nucleolusMat);
  nucleolus.position.set(0.04, 0.04, -0.05);
  primaryNucleus.add(nucleolus);

  // 4-8: Five budding daughter / clonal satellite cells clinging around the mother cell
  const satelliteSpecs: {
    pos: [number, number, number];
    radius: number;
    color: number;
    emissive: number;
    phase: number;
    orbitSpeed: number;
  }[] = [
    { pos: [0.36, 0.12, -0.14], radius: 0.24, color: 0xe11d48, emissive: 0x9f1239, phase: 0.4, orbitSpeed: 0.7 },
    { pos: [-0.34, 0.16, -0.12], radius: 0.22, color: 0xfb7185, emissive: 0xbe123c, phase: 1.7, orbitSpeed: 0.85 },
    { pos: [0.16, -0.24, 0.26], radius: 0.21, color: 0xf59e0b, emissive: 0xb45309, phase: 2.9, orbitSpeed: 0.62 },
    { pos: [-0.24, -0.19, 0.25], radius: 0.23, color: 0xec4899, emissive: 0x9d174d, phase: 4.1, orbitSpeed: 0.78 },
    { pos: [0.02, 0.34, 0.16], radius: 0.19, color: 0xfda4af, emissive: 0xe11d48, phase: 5.2, orbitSpeed: 0.92 },
  ];

  const satGeo = new THREE.SphereGeometry(1, 14, 10);
  const satCoreGeo = new THREE.SphereGeometry(0.48, 10, 8);
  const satellites: CancerAvatarParts['satellites'] = [];

  for (const spec of satelliteSpecs) {
    const g = new THREE.Group();
    g.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);

    const outerMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      emissive: spec.emissive,
      emissiveIntensity: 0.38,
      roughness: 0.26,
      metalness: 0.08,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    });
    const outer = new THREE.Mesh(satGeo, outerMat);
    outer.scale.setScalar(spec.radius);
    outer.renderOrder = 2;
    g.add(outer);

    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x4c0519,
      emissive: spec.emissive,
      emissiveIntensity: 0.48,
      roughness: 0.5,
      metalness: 0.1,
    });
    const inner = new THREE.Mesh(satCoreGeo, innerMat);
    inner.scale.setScalar(spec.radius);
    g.add(inner);

    clusterGroup.add(g);
    satellites.push({
      group: g,
      basePos: new THREE.Vector3(spec.pos[0], spec.pos[1], spec.pos[2]),
      phase: spec.phase,
      orbitSpeed: spec.orbitSpeed,
    });
  }

  // 9-12+: Radial membrane receptor protrusions / pseudopodia giving crisp cellular read
  const spikeGeo = new THREE.ConeGeometry(0.038, 0.17, 6);
  const tipGeo = new THREE.SphereGeometry(0.036, 8, 6);
  const spikeMat = new THREE.MeshStandardMaterial({
    color: 0xfda4af,
    emissive: 0xf43f5e,
    emissiveIntensity: 0.5,
    roughness: 0.32,
    metalness: 0.18,
  });
  const spikeDirs: [number, number, number][] = [
    [0.92, 0.32, 0.15],
    [-0.92, 0.28, 0.18],
    [0.12, 0.94, -0.25],
    [0.18, -0.88, -0.35],
    [0.65, 0.45, -0.62],
    [-0.62, 0.42, -0.66],
    [0.58, -0.25, 0.78],
    [-0.55, -0.22, 0.8],
  ];
  const upVec = new THREE.Vector3(0, 1, 0);
  const dirVec = new THREE.Vector3();

  for (const [dx, dy, dz] of spikeDirs) {
    dirVec.set(dx, dy, dz).normalize();
    const spike = new THREE.Mesh(spikeGeo, spikeMat);
    spike.position.copy(dirVec).multiplyScalar(0.45);
    spike.quaternion.setFromUnitVectors(upVec, dirVec);
    clusterGroup.add(spike);

    const tip = new THREE.Mesh(tipGeo, nucleolusMat);
    tip.position.copy(dirVec).multiplyScalar(0.54);
    clusterGroup.add(tip);
  }

  return {
    root,
    mode: 'cancer',
    parts: {
      kind: 'cancer',
      clusterGroup,
      primaryMembrane,
      primaryNucleus,
      satellites,
      shadowDisc,
    },
  };
}

/**
 * Composite 12+ part procedural Stylized Medical Doctor avatar for Oncologist Mode.
 * Grounded at y = 0 with articulated walking limbs, crisp white lab coat, teal scrubs,
 * draped stethoscope with brushed metallic chestpiece, clinical badge, and medical tablet.
 */
export function createDoctorAvatarGroup(): PlayerAvatarRig {
  const root = new THREE.Group();

  // Materials with realistic roughness/metalness contrast
  const coatMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.56,
    metalness: 0.04,
  });
  const coatTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.62,
    metalness: 0.06,
  });
  const scrubsMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.74,
    metalness: 0.05,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.8,
    metalness: 0.04,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.64,
    metalness: 0.14,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xebb998,
    roughness: 0.66,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.78,
    metalness: 0.05,
  });
  const stethTubeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.42,
    metalness: 0.2,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.2,
    metalness: 0.88,
  });
  const crossMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.15,
  });

  // 1: Grounded contact shadow disc
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 18),
    new THREE.MeshBasicMaterial({
      color: 0x06080f,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.016;
  root.add(shadowDisc);

  // 2 & 3: Articulated Left & Right Legs (pivoted at hip y = 0.62)
  const buildLeg = (xOffset: number): THREE.Group => {
    const hip = new THREE.Group();
    hip.position.set(xOffset, 0.62, 0);

    const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.072, 0.52, 10), pantsMat);
    legMesh.position.y = -0.26;
    hip.add(legMesh);

    const shoeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.1, 0.24), shoeMat);
    shoeMesh.position.set(0, -0.57, -0.04);
    hip.add(shoeMesh);

    return hip;
  };

  const leftLegPivot = buildLeg(-0.125);
  const rightLegPivot = buildLeg(0.125);
  root.add(leftLegPivot, rightLegPivot);

  // 4: Upper Body / Torso Group (bounces smoothly with stride)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 0.62;
  root.add(torsoGroup);

  // Inner teal scrubs shirt torso
  const scrubsTorso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.205, 0.185, 0.54, 12),
    scrubsMat
  );
  scrubsTorso.position.y = 0.29;
  torsoGroup.add(scrubsTorso);

  // 5: White Doctor's Lab Coat (open-front tailored body + lower coat-tails + back vent belt)
  const coatBack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.235, 0.28, 0.72, 14, 1, false, Math.PI * 0.2, Math.PI * 1.6),
    coatMat
  );
  coatBack.rotation.y = Math.PI; // Opening faces forward (-Z)
  coatBack.position.y = 0.22;
  torsoGroup.add(coatBack);

  // Solid coat upper shoulders & lapel collar
  const coatShoulders = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.3), coatMat);
  coatShoulders.position.set(0, 0.52, 0.01);
  torsoGroup.add(coatShoulders);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.036, 8, 14), coatTrimMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.58, 0.01);
  torsoGroup.add(collar);

  // Subtle rear coat belt strap so the white coat reads crisp from behind in 3rd-person
  const backBelt = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.04), coatTrimMat);
  backBelt.position.set(0, 0.22, 0.24);
  torsoGroup.add(backBelt);

  // 6: Subtle Clinical Medical Cross emblem on upper back of lab coat (instant doctor read from behind!)
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.018), crossMat);
  crossV.position.set(0, 0.42, 0.245);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.018), crossMat);
  crossH.position.set(0, 0.42, 0.245);
  torsoGroup.add(crossV, crossH);

  // 7: Draped Stethoscope around neck & shoulders (TubeGeometry + metallic chestpiece)
  const stethCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.14, 0.36, -0.18),
    new THREE.Vector3(-0.16, 0.56, -0.04),
    new THREE.Vector3(-0.08, 0.61, 0.13),
    new THREE.Vector3(0.08, 0.61, 0.13),
    new THREE.Vector3(0.16, 0.56, -0.04),
    new THREE.Vector3(0.14, 0.34, -0.18),
  ]);
  const stethTube = new THREE.Mesh(
    new THREE.TubeGeometry(stethCurve, 20, 0.02, 7, false),
    stethTubeMat
  );
  torsoGroup.add(stethTube);

  const chestpiece = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.024, 12), metalMat);
  chestpiece.rotation.x = Math.PI / 2;
  chestpiece.position.set(0.14, 0.33, -0.2);
  torsoGroup.add(chestpiece);

  // 8 & 9: Articulated Left & Right Arms in White Coat Sleeves (pivoted at shoulders)
  const buildArm = (xOffset: number, withTablet: boolean): THREE.Group => {
    const shoulder = new THREE.Group();
    shoulder.position.set(xOffset, 0.52, 0);

    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.064, 0.43, 10), coatMat);
    sleeve.position.y = -0.21;
    shoulder.add(sleeve);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.045, 10), coatTrimMat);
    cuff.position.y = -0.41;
    shoulder.add(cuff);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), skinMat);
    hand.position.y = -0.46;
    shoulder.add(hand);

    if (withTablet) {
      const tabletBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.21, 0.16),
        stethTubeMat
      );
      tabletBody.position.set(-0.04, -0.48, -0.09);
      tabletBody.rotation.x = -0.35;
      const tabletScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.13, 0.17),
        crossMat
      );
      tabletScreen.rotation.y = -Math.PI / 2;
      tabletScreen.position.set(-0.058, -0.48, -0.09);
      tabletScreen.rotation.x = -0.35;
      shoulder.add(tabletBody, tabletScreen);
    }

    return shoulder;
  };

  const leftArmPivot = buildArm(-0.3, false);
  const rightArmPivot = buildArm(0.3, true);
  torsoGroup.add(leftArmPivot, rightArmPivot);

  // 10-12: Head Group (neck + head + sculpted hair cap + sleek clinical glasses)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.62, 0);
  torsoGroup.add(headGroup);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.078, 0.1, 10), skinMat);
  neck.position.y = 0.03;
  headGroup.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.172, 14, 12), skinMat);
  head.position.y = 0.19;
  headGroup.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.184, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hairCap.position.set(0, 0.205, 0.015);
  hairCap.rotation.x = 0.22;
  headGroup.add(hairCap);

  // Clinical visor/glasses trim wrapping front temples
  const glassesBar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.046, 0.05), metalMat);
  glassesBar.position.set(0, 0.2, -0.155);
  headGroup.add(glassesBar);

  return {
    root,
    mode: 'oncologist',
    parts: {
      kind: 'oncologist',
      torsoGroup,
      headGroup,
      leftLegPivot,
      rightLegPivot,
      leftArmPivot,
      rightArmPivot,
      shadowDisc,
    },
  };
}

/**
 * Factory creating the role-specific composite 3D player avatar.
 */
export function createPlayerAvatarGroup(mode: GameMode): PlayerAvatarRig {
  return mode === 'cancer' ? createCancerCellAvatarGroup() : createDoctorAvatarGroup();
}

/**
 * Zero-allocation per-frame animation for the player avatar (cell mitosis/tumbling vs doctor walk cycle).
 */
export function animatePlayerAvatar(
  rig: PlayerAvatarRig,
  elapsed: number,
  bobPhase: number,
  walkIntensity: number,
  turnRate: number,
  severity: CancerSeverityMetrics
): void {
  const w = Math.max(0, Math.min(1, walkIntensity));

  if (rig.parts.kind === 'cancer') {
    const { clusterGroup, primaryMembrane, primaryNucleus, satellites, shadowDisc } = rig.parts;
    const pulseRate = 2.0 + severity.normalized * 2.2;
    const pulse = 1 + Math.sin(elapsed * pulseRate) * (0.045 + severity.normalized * 0.045);

    // Living hover + energetic stride bounce
    const hoverY = 0.78 + Math.sin(elapsed * 2.1) * 0.055 + Math.abs(Math.sin(bobPhase)) * 0.11 * w;
    clusterGroup.position.y = hoverY;

    // Gentle forward pitch & tumble when moving through tissue
    clusterGroup.rotation.x = -0.18 * w - Math.sin(bobPhase * 2) * 0.07 * w;
    clusterGroup.rotation.y = elapsed * (0.35 + w * 0.65);
    clusterGroup.rotation.z = -turnRate * 0.18;

    const burdenScale = 0.94 + severity.normalized * 0.22;
    primaryMembrane.scale.set(
      burdenScale * pulse,
      burdenScale * (2 - pulse),
      burdenScale * pulse
    );
    primaryNucleus.rotation.y = -elapsed * 0.8;

    for (let i = 0; i < satellites.length; i++) {
      const sat = satellites[i];
      const wobble = Math.sin(elapsed * (1.8 + sat.orbitSpeed) + sat.phase);
      const lift = Math.cos(elapsed * 2.2 + sat.phase);
      sat.group.position.set(
        sat.basePos.x * (1 + wobble * 0.08 + w * 0.05),
        sat.basePos.y + lift * 0.045,
        sat.basePos.z * (1 - wobble * 0.06)
      );
    }

    const shadowScale = Math.max(0.72, 1.08 - (hoverY - 0.72) * 0.35);
    shadowDisc.scale.set(shadowScale, shadowScale, 1);
    return;
  }

  // Oncologist Doctor walking & idle cycle
  const {
    torsoGroup,
    headGroup,
    leftLegPivot,
    rightLegPivot,
    leftArmPivot,
    rightArmPivot,
    shadowDisc,
  } = rig.parts;

  const stride = Math.sin(bobPhase) * 0.56 * w;
  leftLegPivot.rotation.x = stride;
  rightLegPivot.rotation.x = -stride;

  // Arms counter-swing naturally against legs (right arm holds tablet slightly forward)
  leftArmPivot.rotation.x = -stride * 0.72;
  rightArmPivot.rotation.x = stride * 0.42 + 0.18;

  // Torso stride lift + gentle breathing + subtle turn lean
  const breath = Math.sin(elapsed * 1.7) * 0.012;
  const stepLift = Math.abs(Math.sin(bobPhase)) * 0.06 * w;
  torsoGroup.position.y = 0.62 + stepLift + breath;
  torsoGroup.rotation.y = Math.sin(bobPhase) * 0.07 * w;
  torsoGroup.rotation.z = -turnRate * 0.08;
  torsoGroup.rotation.x = -0.045 * w;

  // Head subtly stabilizes & looks into turns
  headGroup.rotation.y = turnRate * 0.22;
  headGroup.rotation.x = Math.sin(bobPhase * 2) * 0.025 * w;

  const shadowScale = 1 - stepLift * 0.9;
  shadowDisc.scale.set(shadowScale, shadowScale, 1);
}

export interface SummarySignalRig {
  group: THREE.Group;
  crown: THREE.Mesh;
  ring: THREE.Mesh;
  beam: THREE.Mesh;
  hitbox: THREE.Mesh;
}

/**
 * Interactive 6-part post-game Summary Signal Pedestal placed inside the final chamber
 * once the run finishes, allowing the player to explore the labyrinth freely and click
 * the beacon whenever ready to open the closing summary.
 */
export function createSummarySignalGroup(
  x: number,
  z: number,
  mode: GameMode,
  highDetail = false,
  maxAnisotropy = 1
): SummarySignalRig {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const accentHex = mode === 'cancer' ? 0xf59e0b : 0x10b981;
  const accentCss = mode === 'cancer' ? '#f59e0b' : '#10b981';

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.35,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 1.15,
    roughness: 0.2,
    metalness: 0.45,
  });

  // 1: Grounded octagonal plinth
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 0.36, 8), baseMat);
  plinth.position.y = 0.18;
  group.add(plinth);

  // 2: Luminous floor halo ring
  const floorHalo = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.38, 20),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
  );
  floorHalo.rotation.x = -Math.PI / 2;
  floorHalo.position.y = 0.02;
  group.add(floorHalo);

  // 3: Vertical translucent light signal beam
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.42, 4.4, 10),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    })
  );
  beam.position.y = 2.4;
  group.add(beam);

  // 4: Floating rotating summary emblem crystal
  const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), glowMat);
  crown.position.y = 1.65;
  group.add(crown);

  // 5: Orbital halo ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 8, 20), glowMat);
  ring.position.y = 1.65;
  ring.rotation.x = Math.PI / 3;
  group.add(ring);

  // 6: Floating crisp sign sprite
  const sign = createLabelSprite(
    'RESUMEN DE CIERRE',
    'Clic para ver informe',
    accentCss,
    false,
    highDetail,
    maxAnisotropy
  );
  sign.scale.set(2.9, 0.84, 1);
  sign.position.set(0, 2.75, 0);
  group.add(sign);

  // Dedicated raycast hitbox
  const hitbox = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 3.0, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitbox.position.y = 1.5;
  hitbox.userData = { kind: 'summary' };
  group.add(hitbox);

  return { group, crown, ring, beam, hitbox };
}
