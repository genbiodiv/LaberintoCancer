import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  DoorOpen,
  Eye,
  Flag,
  Gamepad2,
  HelpCircle,
  Lightbulb,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  Monitor,
  Plus,
  RotateCcw,
  SkipForward,
  SlidersHorizontal,
  Smartphone,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { DIAGNOSTIC_TOOLS, getTherapyById } from '../engine/knowledgeBase';
import { computeDestinationProgress } from '../engine/destinationMetrics';
import {
  CancerSeverityMetrics,
  clampLabyrinthZoom,
  computeAerialZoomDistanceScale,
  computeCancerSeverityMetrics,
  computeLabyrinthCameraFov,
  computeLabyrinthRenderBuffer,
  getLabyrinthResolutionPreset,
  getLabyrinthTheme,
  LABYRINTH_ZOOM_DEFAULT,
  LABYRINTH_ZOOM_MAX,
  LABYRINTH_ZOOM_MIN,
  LabyrinthResolutionLevel,
  LabyrinthVisualTheme,
  stepLabyrinthResolution,
  stepLabyrinthZoom,
} from '../engine/labyrinthAesthetics';
import {
  buildLabyrinthLayout,
  findNearbyActivePortal,
  LabyrinthLayout,
  LabyrinthPortal,
  resolvePlayerMovement,
} from '../engine/labyrinthLayout';
import {
  formatBiologyText,
  getCancerStrategyDisplayInfo,
  getDetailModeLabel,
  getDiagnosticDisplayInfo,
  getOncologistFindingsSummary,
  getOncologistPredictionLabel,
  getTherapyDisplayInfo,
} from '../engine/molecularAbstraction';
import {
  computeThirdPersonCameraPose,
  computeWalkingCameraMotion,
  cycleLabyrinthCameraMode,
  getCameraModeLabel,
} from '../engine/labyrinthCamera';
import {
  combineControlInputs,
  computeKeyboardControlInput,
  computeMotionControlInput,
  createMotionCalibration,
  DEFAULT_MOTION_SENSOR_SETTINGS,
  LabyrinthCameraMode,
  MotionCalibration,
  MotionSensorSettings,
  normalizeDirectionKey,
  sanitizeMotionSensorSettings,
} from '../engine/motionControls';
import {
  getActiveRoundOffer,
  getOncologistRoundPhase,
  shuffleRandom,
} from '../engine/progressionEngine';
import { evaluatePredictionGate } from '../engine/simulator';
import {
  DiagnosticToolId,
  MolecularDetailMode,
  SimulationState,
  TherapyId,
} from '../engine/types';
import {
  loadMotionSensorSettings,
  saveMotionSensorSettings,
  ThemeMode,
} from '../utils/storage';
import { LabyrinthInfoPanel } from './LabyrinthInfoPanel';
import { MotionSensorModal } from './MotionSensorModal';
import { ThemeToggle } from './ThemeToggle';
import {
  BioGrowthRig,
  createChamberTotemGroup,
  createDestinationBeaconGroup,
  createDiagnosticConsoleGroup,
  createForkPortalGroup,
  createProceduralTexturePack,
  createSeverityBioGrowths,
  DestinationBeaconRig,
  DiagnosticRig,
  LabyrinthAudio,
  PortalRig,
  ProceduralTexturePack,
  TotemRig,
} from './labyrinth3d/sceneAssets';
import {
  animatePlayerAvatar,
  createPlayerAvatarGroup,
  createSummarySignalGroup,
  PlayerAvatarRig,
  SummarySignalRig,
} from './labyrinth3d/playerAvatars';

interface Labyrinth3DViewProps {
  state: SimulationState;
  molecularDetail: MolecularDetailMode;
  isExpanded: boolean;
  themeMode?: ThemeMode;
  onThemeChange?: (next: ThemeMode) => void;
  onMolecularDetailChange?: (next: MolecularDetailMode) => void;
  onToggleExpand?: () => void;
  onBackHome?: () => void;
  onSwitchToText?: () => void;
  onOpenSummary?: () => void;
  onResolveCancerTurn: (strategyId: string, predictionId: string) => void;
  onResolveOncologistTurn: (therapyId: TherapyId, predictionId: string) => void;
  onResolveOncologistDiagnostic: (toolId: DiagnosticToolId) => void;
  onResolveOncologistObservation: () => void;
  onRunDiagnostic?: (toolId: DiagnosticToolId) => string | null;
}

type CameraMode = LabyrinthCameraMode;

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  colorHex: number;
}

interface SporeSlot {
  ox: number;
  oz: number;
  y: number;
  speed: number;
  driftPhase: number;
  baseScale: number;
}

function detectSoftwareWebGL(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const rendererStr = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '').toLowerCase();
    return /swiftshader|llvmpipe|softpipe|mesa offscreen|lavapipe/.test(rendererStr);
  } catch {
    return false;
  }
}

function disposeObjectTree(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (mat) {
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const m of mats) {
        const map = (m as THREE.MeshStandardMaterial).map;
        if (map && map.userData?.ownedBySprite) {
          map.dispose();
        }
        m.dispose();
      }
    }
  });
}

export const Labyrinth3DView: React.FC<Labyrinth3DViewProps> = ({
  state,
  molecularDetail,
  isExpanded,
  themeMode = 'light',
  onThemeChange,
  onMolecularDetailChange,
  onToggleExpand,
  onBackHome,
  onSwitchToText,
  onOpenSummary,
  onResolveCancerTurn,
  onResolveOncologistTurn,
  onResolveOncologistDiagnostic,
  onResolveOncologistObservation,
  onRunDiagnostic,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<LabyrinthAudio | null>(null);
  const didInitialBuildRef = useRef<boolean>(false);
  const virtualKeysRef = useRef<Set<string>>(new Set());

  const [cameraMode, setCameraMode] = useState<CameraMode>('third_person');
  const [zoomLevel, setZoomLevel] = useState<number>(LABYRINTH_ZOOM_DEFAULT);
  const [resolutionLevel, setResolutionLevel] = useState<LabyrinthResolutionLevel>('high');
  const [renderBufferDims, setRenderBufferDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [muted, setMuted] = useState<boolean>(false);
  const [selectedPortal, setSelectedPortal] = useState<LabyrinthPortal | null>(null);
  const [doorOpenNonce, setDoorOpenNonce] = useState<number>(0);
  const [selectedPredictionId, setSelectedPredictionId] = useState<string>('');
  const [doorLockState, setDoorLockState] = useState<{
    portalId: string;
    feedback: string;
    rejectedIds: string[];
  } | null>(null);
  const [diagToast, setDiagToast] = useState<string | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [webglUnavailable, setWebglUnavailable] = useState<boolean>(false);
  const [webglRetryNonce, setWebglRetryNonce] = useState<number>(0);
  const [motionSensorActive, setMotionSensorActive] = useState<boolean>(false);
  const [motionSettings, setMotionSettings] = useState<MotionSensorSettings>(() =>
    loadMotionSensorSettings()
  );
  const [sensorModalOpen, setSensorModalOpen] = useState<boolean>(false);
  const [showTouchPad, setShowTouchPad] = useState<boolean>(false);
  const [isTouchDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(pointer: coarse)').matches ||
      window.innerWidth < 768 ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && window.innerWidth < 900)
    );
  });
  const [showControlsHint, setShowControlsHint] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem('cancer-labyrinth-3d-controls-seen-v1') !== '1';
    } catch {
      return true;
    }
  });

  const dismissControlsHint = useCallback(() => {
    setShowControlsHint(false);
    try {
      window.sessionStorage.setItem('cancer-labyrinth-3d-controls-seen-v1', '1');
    } catch {
      // Ignore storage access errors in restricted iframes
    }
  }, []);

  // Mobile DeviceOrientation motion sensor refs (zero React re-renders inside sensor events)
  const motionActiveRef = useRef<boolean>(false);
  motionActiveRef.current = motionSensorActive;
  const motionSettingsRef = useRef<MotionSensorSettings>(motionSettings);
  motionSettingsRef.current = motionSettings;
  const sensorModalOpenRef = useRef<boolean>(false);
  sensorModalOpenRef.current = sensorModalOpen;
  const motionCalibrationRef = useRef<MotionCalibration | null>(null);
  const motionOrientationRef = useRef<{ beta: number | null; gamma: number | null }>({
    beta: null,
    gamma: null,
  });
  const motionReceivedReadingRef = useRef<boolean>(false);
  const motionFallbackTimerRef = useRef<number | null>(null);

  const handleChangeMotionSettings = useCallback((patch: Partial<MotionSensorSettings>) => {
    setMotionSettings((prev) => {
      const clean = sanitizeMotionSensorSettings({ ...prev, ...patch });
      saveMotionSensorSettings(clean);
      return clean;
    });
  }, []);

  const handleResetMotionSettings = useCallback(() => {
    const defaults = { ...DEFAULT_MOTION_SENSOR_SETTINGS };
    setMotionSettings(defaults);
    saveMotionSensorSettings(defaults);
  }, []);

  const getLiveMotionReading = useCallback(
    () => ({
      orientation: motionOrientationRef.current,
      calibration: motionCalibrationRef.current,
    }),
    []
  );

  // Minimap player telemetry (throttled ~12Hz so React stays ultra-light)
  const [playerPose, setPlayerPose] = useState<{ x: number; z: number; yaw: number }>({
    x: 0,
    z: 8,
    yaw: 0,
  });

  const destination = useMemo(() => computeDestinationProgress(state), [state]);
  const severity = useMemo(
    () => computeCancerSeverityMetrics(state.clinical.tumorBurden),
    [state.clinical.tumorBurden]
  );
  const theme = useMemo(
    () => getLabyrinthTheme(state.mode, destination.progress, state.clinical.tumorBurden),
    [state.mode, destination.progress, state.clinical.tumorBurden]
  );
  const layout: LabyrinthLayout = useMemo(
    () => buildLabyrinthLayout(state, molecularDetail),
    [state, molecularDetail]
  );
  const currentRoundDef = useMemo(() => getActiveRoundOffer(state), [state]);
  const oncologistPhase =
    state.mode === 'oncologist'
      ? currentRoundDef.oncologistPhase ?? getOncologistRoundPhase(state.currentRound)
      : null;

  // Mutable refs for the WebGL loop so React state changes never recreate the renderer
  const layoutRef = useRef<LabyrinthLayout>(layout);
  layoutRef.current = layout;

  const modeRef = useRef(state.mode);
  modeRef.current = state.mode;

  const severityRef = useRef<CancerSeverityMetrics>(severity);
  severityRef.current = severity;

  const themeRef = useRef<LabyrinthVisualTheme>(theme);
  themeRef.current = theme;

  const cameraModeRef = useRef<CameraMode>(cameraMode);
  cameraModeRef.current = cameraMode;

  const zoomLevelRef = useRef<number>(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  const resolutionPreset = useMemo(
    () => getLabyrinthResolutionPreset(resolutionLevel),
    [resolutionLevel]
  );

  const resolutionLevelRef = useRef<LabyrinthResolutionLevel>(resolutionLevel);
  resolutionLevelRef.current = resolutionLevel;

  const smoothTexturesRef = useRef<boolean>(resolutionPreset.smoothTextures);
  smoothTexturesRef.current = resolutionPreset.smoothTextures;

  const selectedPortalRef = useRef<LabyrinthPortal | null>(selectedPortal);
  selectedPortalRef.current = selectedPortal;

  const onRunDiagnosticRef = useRef(onRunDiagnostic);
  onRunDiagnosticRef.current = onRunDiagnostic;

  const onOpenSummaryRef = useRef(onOpenSummary);
  onOpenSummaryRef.current = onOpenSummary;

  // Player kinematic ref (world position + orientation + smooth walking motion)
  const playerRef = useRef({
    x: layout.spawn.x,
    z: layout.spawn.z,
    yaw: layout.spawn.yaw,
    bobPhase: 0,
    walkIntensity: 0,
    turnRate: 0,
    stepAccum: 0,
    lastNearPortalId: null as string | null,
    roundKey: `${state.runId}-${state.mode}-${state.currentRound}`,
  });

  // Scene graph refs owned by the WebGL lifecycle
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    worldGroup: THREE.Group;
    playerAvatar: PlayerAvatarRig | null;
    hemi: THREE.HemisphereLight;
    keyLight: THREE.DirectionalLight;
    headlamp: THREE.PointLight;
    textures: ProceduralTexturePack | null;
    portalRigs: PortalRig[];
    totemRigs: TotemRig[];
    diagnosticRigs: DiagnosticRig[];
    beaconRig: DestinationBeaconRig | null;
    summarySignalRig: SummarySignalRig | null;
    bioGrowthRig: BioGrowthRig | null;
    interactables: THREE.Object3D[];
    particlesMesh: THREE.InstancedMesh;
    particles: ParticleSlot[];
    sporesMesh: THREE.InstancedMesh;
    spores: SporeSlot[];
    isSoftwareGl: boolean;
    resizeRenderer: () => void;
    spawnBurst: (x: number, y: number, z: number, colorHex: number) => void;
  } | null>(null);

  // Reset player into the active chamber whenever run/mode/round advances
  useEffect(() => {
    const nextKey = `${state.runId}-${state.mode}-${state.currentRound}`;
    if (playerRef.current.roundKey !== nextKey) {
      playerRef.current.x = layout.spawn.x;
      playerRef.current.z = layout.spawn.z;
      playerRef.current.yaw = layout.spawn.yaw;
      playerRef.current.lastNearPortalId = null;
      playerRef.current.roundKey = nextKey;
      setPlayerPose({ x: layout.spawn.x, z: layout.spawn.z, yaw: layout.spawn.yaw });
      setSelectedPortal(null);
      setSelectedPredictionId('');
      setDoorLockState(null);
    }
  }, [state.runId, state.mode, state.currentRound, layout.spawn]);

  // Keep audio mute & live cancer severity soundscape synced
  useEffect(() => {
    audioRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    audioRef.current?.setSeverity(state.clinical.tumorBurden, state.mode);
  }, [state.clinical.tumorBurden, state.mode]);

  // Clear diagnostic / sensor toast after a short interval
  useEffect(() => {
    if (!diagToast) return;
    const t = window.setTimeout(() => setDiagToast(null), 4600);
    return () => window.clearTimeout(t);
  }, [diagToast]);

  // Attach/detach mobile DeviceOrientation motion sensor listener cleanly
  useEffect(() => {
    if (!motionSensorActive) {
      motionCalibrationRef.current = null;
      motionOrientationRef.current = { beta: null, gamma: null };
      motionReceivedReadingRef.current = false;
      if (motionFallbackTimerRef.current !== null) {
        window.clearTimeout(motionFallbackTimerRef.current);
        motionFallbackTimerRef.current = null;
      }
      return;
    }

    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (typeof e.beta !== 'number' || typeof e.gamma !== 'number') return;
      motionOrientationRef.current = { beta: e.beta, gamma: e.gamma };
      if (!motionReceivedReadingRef.current) {
        motionReceivedReadingRef.current = true;
        motionCalibrationRef.current = createMotionCalibration(e.beta, e.gamma);
        if (motionFallbackTimerRef.current !== null) {
          window.clearTimeout(motionFallbackTimerRef.current);
          motionFallbackTimerRef.current = null;
        }
      }
    };

    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
    motionFallbackTimerRef.current = window.setTimeout(() => {
      if (!motionReceivedReadingRef.current) {
        setDiagToast(
          'Sensor activo esperando giroscopio. En computador usa las flechas ↑ ↓ ← → o arrastra.'
        );
      }
    }, 1800);

    return () => {
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      if (motionFallbackTimerRef.current !== null) {
        window.clearTimeout(motionFallbackTimerRef.current);
        motionFallbackTimerRef.current = null;
      }
    };
  }, [motionSensorActive]);

  const handleToggleMotionSensor = useCallback(async () => {
    if (motionSensorActive) {
      setMotionSensorActive(false);
      setDiagToast('Sensor de movimiento desactivado');
      return;
    }

    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setShowTouchPad(true);
      setDiagToast(
        'Giroscopio no disponible en este navegador. Controles direccionales activados en pantalla.'
      );
      return;
    }

    // Request iOS Safari permission FIRST inside the click gesture before touching AudioContext
    const devOrient = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof devOrient?.requestPermission === 'function') {
      try {
        const result = await devOrient.requestPermission();
        if (result !== 'granted') {
          setShowTouchPad(true);
          setDiagToast(
            'Permiso de giroscopio bloqueado. Controles direccionales activados en pantalla.'
          );
          return;
        }
      } catch {
        setShowTouchPad(true);
        setDiagToast(
          'No se pudo activar el giroscopio aquí. Controles direccionales activados en pantalla.'
        );
        return;
      }
    }

    audioRef.current?.ensureAmbientStarted();
    motionCalibrationRef.current = null;
    motionReceivedReadingRef.current = false;
    setMotionSensorActive(true);
    setDiagToast('Sensor de movimiento activo · Inclina el móvil para caminar y girar');
  }, [motionSensorActive]);

  const handleRecalibrateMotionSensor = useCallback(() => {
    if (!motionSensorActive) return;
    const { beta, gamma } = motionOrientationRef.current;
    motionCalibrationRef.current = createMotionCalibration(beta, gamma);
    setDiagToast('Posición neutra del sensor recalibrada');
  }, [motionSensorActive]);

  const bindVirtualKey = useCallback((token: string) => {
    const press = (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      audioRef.current?.ensureAmbientStarted();
      virtualKeysRef.current.add(token);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore pointer capture errors on synthetic events
      }
    };
    const release = (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      virtualKeysRef.current.delete(token);
    };
    return {
      onPointerDown: press,
      onPointerUp: release,
      onPointerCancel: release,
      onLostPointerCapture: () => {
        virtualKeysRef.current.delete(token);
      },
    };
  }, []);

  // Rebuild world geometry inside the persistent Three.js scene when layout/mode/theme/severity changes
  const rebuildWorld = useCallback(
    (
      nextLayout: LabyrinthLayout,
      nextMode: SimulationState['mode'],
      nextTheme: LabyrinthVisualTheme,
      highDetailTextures: boolean,
      nextSeverity: CancerSeverityMetrics
    ) => {
      const ctx = threeRef.current;
      if (!ctx) return;

      // Clean up old world meshes & textures
      disposeObjectTree(ctx.worldGroup);
      ctx.worldGroup.clear();
      if (ctx.textures) {
        ctx.textures.dispose();
      }

      const maxAniso = ctx.isSoftwareGl
        ? 1
        : Math.min(ctx.renderer.capabilities.getMaxAnisotropy(), 8);
      const textures = createProceduralTexturePack(
        nextTheme,
        highDetailTextures,
        maxAniso,
        nextSeverity
      );
      ctx.textures = textures;
      (ctx.sporesMesh.material as THREE.MeshBasicMaterial).color.setHex(
        nextTheme.ambientParticleHex
      );

      // Apply progressive atmosphere, fog, and lighting driven by proximity to the destination
      ctx.scene.background = new THREE.Color(nextTheme.bgHex);
      ctx.scene.fog = new THREE.FogExp2(nextTheme.fogHex, nextTheme.fogDensity);
      ctx.hemi.color.setHex(nextTheme.hemiSky);
      ctx.hemi.groundColor.setHex(nextTheme.hemiGround);
      ctx.hemi.intensity = nextTheme.hemiIntensity;
      ctx.keyLight.color.setHex(nextTheme.keyColor);
      ctx.keyLight.intensity = nextTheme.keyIntensity;
      ctx.headlamp.color.setHex(nextTheme.headlampColor);
      ctx.headlamp.intensity = nextTheme.headlampIntensity;

      const portalRigs: PortalRig[] = [];
      const totemRigs: TotemRig[] = [];
      const diagnosticRigs: DiagnosticRig[] = [];
      const interactables: THREE.Object3D[] = [];

      // 1. Ground slab spanning entire labyrinth bounds (y = 0)
      const spanX = Math.max(46, nextLayout.bounds.maxX - nextLayout.bounds.minX + 24);
      const spanZ = Math.max(46, nextLayout.bounds.maxZ - nextLayout.bounds.minZ + 24);
      const midX = (nextLayout.bounds.minX + nextLayout.bounds.maxX) / 2;
      const midZ = (nextLayout.bounds.minZ + nextLayout.bounds.maxZ) / 2;

      textures.floorAlbedo.repeat.set(Math.round(spanX / 2), Math.round(spanZ / 2));
      const floorGeo = new THREE.PlaneGeometry(spanX, spanZ);
      const floorMat = new THREE.MeshStandardMaterial({
        map: textures.floorAlbedo,
        roughness: 0.88,
        metalness: 0.08,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set(midX, 0, midZ);
      floorMesh.receiveShadow = !ctx.isSoftwareGl;
      ctx.worldGroup.add(floorMesh);

      // 2. InstancedMesh for walls, crisp top coping trim, and corner pilasters
      const regularWalls = nextLayout.walls.filter((w) => !w.isPillar);
      const pillars = nextLayout.walls.filter((w) => w.isPillar);
      const dummyMat = new THREE.Matrix4();
      const dummyPos = new THREE.Vector3();
      const dummyQuat = new THREE.Quaternion();
      const dummyScale = new THREE.Vector3();

      if (regularWalls.length > 0) {
        const unitWallGeo = new THREE.BoxGeometry(1, 1, 1);
        const wallMat = new THREE.MeshStandardMaterial({
          map: textures.wallAlbedo,
          bumpMap: textures.wallBump,
          bumpScale: 0.08,
          roughness: 0.82,
          metalness: 0.1,
        });
        const wallInst = new THREE.InstancedMesh(unitWallGeo, wallMat, regularWalls.length);
        wallInst.castShadow = !ctx.isSoftwareGl;
        wallInst.receiveShadow = !ctx.isSoftwareGl;
        regularWalls.forEach((w, i) => {
          dummyPos.set(w.x, w.height / 2, w.z);
          dummyScale.set(w.width, w.height, w.depth);
          dummyMat.compose(dummyPos, dummyQuat, dummyScale);
          wallInst.setMatrixAt(i, dummyMat);
        });
        wallInst.instanceMatrix.needsUpdate = true;
        wallInst.computeBoundingSphere();
        ctx.worldGroup.add(wallInst);

        // Architectural cornice/coping along the top edge of every wall
        const capGeo = new THREE.BoxGeometry(1, 1, 1);
        const capMat = new THREE.MeshStandardMaterial({
          color: nextTheme.capColor,
          emissive: nextTheme.capEmissive,
          emissiveIntensity: nextTheme.capEmissiveIntensity,
          roughness: 0.65,
          metalness: 0.2,
        });
        const capInst = new THREE.InstancedMesh(capGeo, capMat, regularWalls.length);
        regularWalls.forEach((w, i) => {
          dummyPos.set(w.x, w.height + 0.09, w.z);
          dummyScale.set(w.width + 0.14, 0.18, w.depth + 0.14);
          dummyMat.compose(dummyPos, dummyQuat, dummyScale);
          capInst.setMatrixAt(i, dummyMat);
        });
        capInst.instanceMatrix.needsUpdate = true;
        capInst.computeBoundingSphere();
        ctx.worldGroup.add(capInst);
      }

      if (pillars.length > 0) {
        const unitPillarGeo = new THREE.BoxGeometry(1, 1, 1);
        const pillarMat = new THREE.MeshStandardMaterial({
          map: textures.pillarAlbedo,
          roughness: 0.65,
          metalness: 0.25,
        });
        const pillarInst = new THREE.InstancedMesh(unitPillarGeo, pillarMat, pillars.length);
        pillarInst.castShadow = !ctx.isSoftwareGl;
        pillarInst.receiveShadow = !ctx.isSoftwareGl;
        pillars.forEach((p, i) => {
          dummyPos.set(p.x, p.height / 2, p.z);
          dummyScale.set(p.width, p.height, p.depth);
          dummyMat.compose(dummyPos, dummyQuat, dummyScale);
          pillarInst.setMatrixAt(i, dummyMat);
        });
        pillarInst.instanceMatrix.needsUpdate = true;
        pillarInst.computeBoundingSphere();
        ctx.worldGroup.add(pillarInst);
      }

      // 3. Recessed luminous leading-lines on the floor
      const lineMat = new THREE.MeshBasicMaterial({
        color: nextTheme.guideLineHex,
        transparent: true,
        opacity: 0.38,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });

      const entryStrip = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 7.2), lineMat);
      entryStrip.rotation.x = -Math.PI / 2;
      entryStrip.position.set(0, 0.015, 5.4);
      ctx.worldGroup.add(entryStrip);

      // 4. Chamber center molecular chandeliers + leading lines toward each portal
      for (const chamber of nextLayout.chambers) {
        const totem = createChamberTotemGroup(
          chamber.centerX,
          chamber.centerZ,
          nextMode,
          chamber.isCurrent
        );
        ctx.worldGroup.add(totem.group);
        totemRigs.push(totem);

        const chamberPortals = nextLayout.portals.filter(
          (p) => p.roundNumber === chamber.roundNumber
        );
        for (const p of chamberPortals) {
          const dx = p.x - chamber.centerX;
          const dz = p.z - chamber.centerZ;
          const dist = Math.hypot(dx, dz);
          const angle = Math.atan2(dx, dz);
          const branchMat = new THREE.MeshBasicMaterial({
            color: p.status === 'sealed' ? 0x334155 : p.accentHex,
            transparent: true,
            opacity: p.status === 'active' ? 0.38 : p.status === 'chosen' ? 0.28 : 0.12,
            polygonOffset: true,
            polygonOffsetFactor: -1,
          });
          const guide = new THREE.Mesh(
            new THREE.PlaneGeometry(0.26, Math.max(1, dist - 1.2)),
            branchMat
          );
          guide.rotation.x = -Math.PI / 2;
          guide.rotation.z = angle;
          guide.position.set(
            chamber.centerX + dx * 0.5,
            0.015,
            chamber.centerZ + dz * 0.5
          );
          ctx.worldGroup.add(guide);
        }
      }

      // 5. Forking Portal Archways (8-part composite groups)
      for (const portal of nextLayout.portals) {
        const rig = createForkPortalGroup(
          portal,
          textures.portalMembrane,
          highDetailTextures,
          maxAniso
        );
        rig.group.traverse((child) => {
          if ((child as THREE.Sprite).isSprite) {
            const mat = (child as THREE.Sprite).material;
            if (mat.map) mat.map.userData.ownedBySprite = true;
          }
        });
        ctx.worldGroup.add(rig.group);
        portalRigs.push(rig);
        if (portal.status === 'active') {
          interactables.push(rig.hitbox);
        }
      }

      // 6. Oncologist Diagnostic Consoles
      const currentChamber = nextLayout.chambers[nextLayout.chambers.length - 1];
      for (const station of nextLayout.diagnosticStations) {
        const rig = createDiagnosticConsoleGroup(
          station,
          currentChamber.centerX,
          highDetailTextures,
          maxAniso
        );
        rig.group.traverse((child) => {
          if ((child as THREE.Sprite).isSprite) {
            const mat = (child as THREE.Sprite).material;
            if (mat.map) mat.map.userData.ownedBySprite = true;
          }
        });
        ctx.worldGroup.add(rig.group);
        diagnosticRigs.push(rig);
        interactables.push(rig.hitbox);
      }

      // 7. Horizon Destination Beacon towering beyond the northern walls (grows as you near the destination!)
      const beaconRig = createDestinationBeaconGroup(
        currentChamber.centerX,
        currentChamber.centerZ - 17.5,
        nextTheme
      );
      ctx.worldGroup.add(beaconRig.group);

      // 7b. Interactive Post-Game Summary Signal Pedestal (appears once the run finishes)
      let summarySignalRig: SummarySignalRig | null = null;
      if (nextLayout.summaryBeacon) {
        summarySignalRig = createSummarySignalGroup(
          nextLayout.summaryBeacon.x,
          nextLayout.summaryBeacon.z,
          nextMode,
          highDetailTextures,
          maxAniso
        );
        summarySignalRig.group.traverse((child) => {
          if ((child as THREE.Sprite).isSprite) {
            const mat = (child as THREE.Sprite).material;
            if (mat.map) mat.map.userData.ownedBySprite = true;
          }
        });
        ctx.worldGroup.add(summarySignalRig.group);
        interactables.push(summarySignalRig.hitbox);
      }

      // 8. Severity-driven organic tumorous nodules anchored along chamber corners & wall bases
      const bioGrowthRig = createSeverityBioGrowths(nextLayout.chambers, nextSeverity);
      if (bioGrowthRig) {
        ctx.worldGroup.add(bioGrowthRig.mesh);
      }

      // 9. Persistent Role-Specific 3D Player Avatar (Cancer Cell Cluster vs. Oncologist Doctor)
      if (!ctx.playerAvatar || ctx.playerAvatar.mode !== nextMode) {
        if (ctx.playerAvatar) {
          disposeObjectTree(ctx.playerAvatar.root);
          ctx.scene.remove(ctx.playerAvatar.root);
        }
        const avatarRig = createPlayerAvatarGroup(nextMode);
        avatarRig.root.position.set(playerRef.current.x, 0, playerRef.current.z);
        avatarRig.root.rotation.y = playerRef.current.yaw;
        avatarRig.root.visible = cameraModeRef.current !== 'first_person';
        ctx.scene.add(avatarRig.root);
        ctx.playerAvatar = avatarRig;
      }

      ctx.portalRigs = portalRigs;
      ctx.totemRigs = totemRigs;
      ctx.diagnosticRigs = diagnosticRigs;
      ctx.beaconRig = beaconRig;
      ctx.summarySignalRig = summarySignalRig;
      ctx.bioGrowthRig = bioGrowthRig;
      ctx.interactables = interactables;
    },
    []
  );

  // Initialize Three.js renderer ONCE on mount (with 2-tier WebGL fallback so it never crashes)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    didInitialBuildRef.current = false;
    setWebglUnavailable(false);
    setContextLost(false);
    audioRef.current = new LabyrinthAudio();

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
        preserveDrawingBuffer: true,
      });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          powerPreference: 'default',
          alpha: false,
        });
      } catch {
        setWebglUnavailable(true);
        return () => {
          audioRef.current?.dispose();
          audioRef.current = null;
        };
      }
    }

    const gl = renderer.getContext();
    if (!gl) {
      renderer.dispose();
      setWebglUnavailable(true);
      return () => {
        audioRef.current?.dispose();
        audioRef.current = null;
      };
    }

    const isSoftwareGl = detectSoftwareWebGL(gl);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl;
    if (!isSoftwareGl) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.imageRendering = getLabyrinthResolutionPreset(resolutionLevelRef.current).pixelated
      ? 'pixelated'
      : 'auto';
    container.innerHTML = '';
    container.appendChild(canvas);

    const scene = new THREE.Scene();

    // Soft studio PMREM environment on hardware GPUs (guarded so GPU quirks never abort startup)
    let envRT: THREE.WebGLRenderTarget | null = null;
    if (!isSoftwareGl) {
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const roomEnv = new RoomEnvironment();
        envRT = pmrem.fromScene(roomEnv, 0.04);
        scene.environment = envRT.texture;
        roomEnv.dispose();
        pmrem.dispose();
      } catch {
        envRT = null;
      }
    }

    // Focus stage container cleanly so desktop arrow keys respond immediately inside iframes
    stageRef.current?.focus({ preventScroll: true });

    // Camera positioned at spawn (3rd-person trailing view by default) facing straight north (-Z)
    const camera = new THREE.PerspectiveCamera(64, 16 / 9, 0.1, 140);
    const initThirdPerson = computeThirdPersonCameraPose(
      layoutRef.current.spawn.x,
      layoutRef.current.spawn.z,
      layoutRef.current.spawn.yaw,
      zoomLevelRef.current,
      layoutRef.current.walkableBoxes,
      { bobY: 0, swayX: 0, rollZ: 0, pitchBob: 0 }
    );
    camera.position.set(initThirdPerson.camX, initThirdPerson.camY, initThirdPerson.camZ);
    camera.lookAt(initThirdPerson.lookX, initThirdPerson.lookY, initThirdPerson.lookZ);

    // Warm key + cool hemisphere + subtle fill + dynamic explorer headlamp
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x2c243a, 1.65);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.05);
    keyLight.position.set(14, 24, 16);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const headlamp = new THREE.PointLight(0xfef08a, 1.85, 18, 1.4);
    headlamp.position.set(layoutRef.current.spawn.x, 2.5, layoutRef.current.spawn.z);
    scene.add(headlamp);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Pooled low-poly spark particles (zero per-frame allocations)
    const PARTICLE_COUNT = 36;
    const pGeo = new THREE.OctahedronGeometry(0.11, 0);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particlesMesh = new THREE.InstancedMesh(pGeo, pMat, PARTICLE_COUNT);
    particlesMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const particles: ParticleSlot[] = [];
    const zeroMat = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        active: false,
        x: 0,
        y: -10,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.7,
        colorHex: 0x38bdf8,
      });
      particlesMesh.setMatrixAt(i, zeroMat);
      particlesMesh.setColorAt(i, new THREE.Color(0x38bdf8));
    }
    particlesMesh.instanceMatrix.needsUpdate = true;
    if (particlesMesh.instanceColor) particlesMesh.instanceColor.needsUpdate = true;
    particlesMesh.frustumCulled = false;
    scene.add(particlesMesh);

    // Pooled floating atmospheric bio-spores (active count & rise speed scale with cancer severity)
    const SPORE_POOL_SIZE = 64;
    const sporeGeo = new THREE.OctahedronGeometry(0.065, 0);
    const sporeMat = new THREE.MeshBasicMaterial({
      color: themeRef.current.ambientParticleHex,
      transparent: true,
      opacity: 0.72,
    });
    const sporesMesh = new THREE.InstancedMesh(sporeGeo, sporeMat, SPORE_POOL_SIZE);
    sporesMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const spores: SporeSlot[] = [];
    for (let i = 0; i < SPORE_POOL_SIZE; i++) {
      const ang = (i * 2.39996) % (Math.PI * 2);
      const rad = 1.4 + ((i * 17) % 100) / 100 * 5.2;
      spores.push({
        ox: Math.cos(ang) * rad,
        oz: Math.sin(ang) * rad,
        y: 0.3 + ((i * 29) % 100) / 100 * 4.4,
        speed: 0.35 + ((i * 13) % 10) * 0.06,
        driftPhase: i * 0.73,
        baseScale: 0.7 + ((i * 11) % 7) * 0.14,
      });
      sporesMesh.setMatrixAt(i, zeroMat);
    }
    sporesMesh.instanceMatrix.needsUpdate = true;
    sporesMesh.frustumCulled = false;
    scene.add(sporesMesh);

    const _pColor = new THREE.Color();
    const spawnBurst = (x: number, y: number, z: number, colorHex: number) => {
      let spawned = 0;
      for (let i = 0; i < PARTICLE_COUNT && spawned < 16; i++) {
        const slot = particles[i];
        if (!slot.active || slot.life > slot.maxLife * 0.6) {
          const ang = (spawned / 16) * Math.PI * 2 + (i % 3) * 0.2;
          const speed = 1.6 + (spawned % 4) * 0.6;
          slot.active = true;
          slot.x = x;
          slot.y = y;
          slot.z = z;
          slot.vx = Math.cos(ang) * speed;
          slot.vy = 1.8 + (spawned % 3) * 0.9;
          slot.vz = Math.sin(ang) * speed;
          slot.life = 0;
          slot.maxLife = 0.65 + (spawned % 3) * 0.15;
          slot.colorHex = colorHex;
          _pColor.setHex(colorHex);
          particlesMesh.setColorAt(i, _pColor);
          spawned++;
        }
      }
      if (particlesMesh.instanceColor) particlesMesh.instanceColor.needsUpdate = true;
    };

    const resizeRenderer = () => {
      const rect = container.getBoundingClientRect();
      const cssW = Math.max(320, Math.floor(rect.width));
      const cssH = Math.max(240, Math.floor(rect.height));

      const buf = computeLabyrinthRenderBuffer(
        cssW,
        cssH,
        resolutionLevelRef.current,
        window.devicePixelRatio || 1,
        isSoftwareGl
      );

      renderer.setPixelRatio(buf.pixelRatio);
      renderer.setSize(buf.width, buf.height, false);
      canvas.style.imageRendering = buf.imageRendering;

      setRenderBufferDims((prev) =>
        prev.w === canvas.width && prev.h === canvas.height
          ? prev
          : { w: canvas.width, h: canvas.height }
      );

      camera.aspect = cssW / cssH;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };

    threeRef.current = {
      renderer,
      scene,
      camera,
      worldGroup,
      playerAvatar: null,
      hemi,
      keyLight,
      headlamp,
      textures: null,
      portalRigs: [],
      totemRigs: [],
      diagnosticRigs: [],
      beaconRig: null,
      summarySignalRig: null,
      bioGrowthRig: null,
      interactables: [],
      particlesMesh,
      particles,
      sporesMesh,
      spores,
      isSoftwareGl,
      resizeRenderer,
      spawnBurst,
    };

    audioRef.current.setSeverity(severityRef.current.burden, modeRef.current);

    rebuildWorld(
      layoutRef.current,
      modeRef.current,
      themeRef.current,
      smoothTexturesRef.current,
      severityRef.current
    );
    resizeRenderer();

    // Context lost / restored resilience
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
      rebuildWorld(
        layoutRef.current,
        modeRef.current,
        themeRef.current,
        smoothTexturesRef.current,
        severityRef.current
      );
      resizeRenderer();
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // ResizeObserver keeps canvas aligned with container & fullscreen toggle
    const ro = new ResizeObserver(() => resizeRenderer());
    ro.observe(container);

    // Keyboard & pointer interaction state
    const heldKeys = new Set<string>();
    const isTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      audioRef.current?.ensureAmbientStarted();
      const dirToken = normalizeDirectionKey(e.code, e.key);
      if (dirToken) {
        heldKeys.add(dirToken);
        if (dirToken.startsWith('Arrow')) {
          e.preventDefault();
        }
      } else if (e.code === 'KeyV') {
        setCameraMode((prev) => cycleLabyrinthCameraMode(prev));
      } else if (e.code === 'KeyM') {
        setMuted((prev) => !prev);
      } else if (e.code === 'Escape') {
        setSelectedPortal(null);
      } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        setZoomLevel((prev) => stepLabyrinthZoom(prev, 1));
      } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        setZoomLevel((prev) => stepLabyrinthZoom(prev, -1));
      } else if (e.code === 'Digit0' || e.code === 'Numpad0') {
        setZoomLevel(LABYRINTH_ZOOM_DEFAULT);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const dirToken = normalizeDirectionKey(e.code, e.key);
      if (dirToken) {
        heldKeys.delete(dirToken);
      } else {
        heldKeys.delete(e.code);
      }
    };

    const clearKeys = () => heldKeys.clear();
    const onVisibilityChange = () => {
      if (document.hidden) clearKeys();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Pointer drag-look, touch walk-drag & raycast click/tap on portals / diagnostic terminals
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let isDragging = false;
    let activePointerId: number | null = null;
    let dragMoved = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const getHitObject = (clientX: number, clientY: number): THREE.Object3D | null => {
      const ctx = threeRef.current;
      if (!ctx || ctx.interactables.length === 0) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, ctx.camera);
      const hits = raycaster.intersectObjects(ctx.interactables, false);
      return hits.length > 0 ? hits[0].object : null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      stageRef.current?.focus({ preventScroll: true });
      audioRef.current?.ensureAmbientStarted();
      isDragging = true;
      activePointerId = e.pointerId;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        const totalMove = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
        const dragThreshold = e.pointerType === 'touch' ? 12 : 5;
        if (totalMove > dragThreshold) dragMoved = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        if (dragMoved && !selectedPortalRef.current) {
          if (cameraModeRef.current !== 'aerial') {
            playerRef.current.yaw -= dx * 0.0045;
            // On touchscreens, dragging vertically also glides smoothly forward/backward
            if (e.pointerType === 'touch' && Math.abs(dy) > 0.5) {
              const p = playerRef.current;
              const step = dy * 0.022;
              const fwdX = -Math.sin(p.yaw);
              const fwdZ = -Math.cos(p.yaw);
              const resolved = resolvePlayerMovement(
                p.x,
                p.z,
                fwdX * step,
                fwdZ * step,
                layoutRef.current.walkableBoxes
              );
              p.x = resolved.x;
              p.z = resolved.z;
            }
          }
        }
        return;
      }

      if (e.pointerType === 'touch') return;
      const hit = getHitObject(e.clientX, e.clientY);
      if (hit?.userData?.kind === 'portal') {
        const portal = layoutRef.current.portals.find((p) => p.id === hit.userData.portalId);
        setHoveredLabel(portal ? `Bifurcación: ${portal.label}` : null);
        canvas.style.cursor = 'pointer';
      } else if (hit?.userData?.kind === 'diagnostic') {
        const st = layoutRef.current.diagnosticStations.find(
          (d) => d.toolId === hit.userData.toolId
        );
        setHoveredLabel(st ? `Terminal: ${st.label}` : null);
        canvas.style.cursor = 'pointer';
      } else if (hit?.userData?.kind === 'summary') {
        setHoveredLabel('Ver resumen de cierre del juego');
        canvas.style.cursor = 'pointer';
      } else {
        setHoveredLabel(null);
        canvas.style.cursor = cameraModeRef.current !== 'aerial' ? 'grab' : 'default';
      }
    };

    const onPointerCancel = () => {
      isDragging = false;
      activePointerId = null;
      dragMoved = false;
    };

    const onPointerUp = (e: PointerEvent) => {
      // Only handle pointerups that originated on the 3D canvas (prevents HUD/modal click-through)
      if (!isDragging) return;
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      const wasDrag = dragMoved;
      isDragging = false;
      activePointerId = null;
      dragMoved = false;
      if (wasDrag) return;

      const hit = getHitObject(e.clientX, e.clientY);
      if (!hit) return;

      if (hit.userData?.kind === 'portal') {
        const portal = layoutRef.current.portals.find((p) => p.id === hit.userData.portalId);
        if (portal && portal.status === 'active') {
          audioRef.current?.playPortalFocus(severityRef.current.normalized);
          threeRef.current?.spawnBurst(portal.x, 2.0, portal.z, portal.accentHex);
          setSelectedPortal(portal);
          setDoorOpenNonce((n) => n + 1);
          setSelectedPredictionId('');
        }
      } else if (hit.userData?.kind === 'diagnostic') {
        const toolId = hit.userData.toolId as DiagnosticToolId;
        const station = layoutRef.current.diagnosticStations.find((d) => d.toolId === toolId);
        const msg = onRunDiagnosticRef.current?.(toolId) ?? null;
        audioRef.current?.playDiagnostic();
        if (station) {
          threeRef.current?.spawnBurst(station.x, 1.5, station.z, 0x10b981);
        }
        if (msg) {
          setDiagToast(msg);
        }
      } else if (hit.userData?.kind === 'summary') {
        const sb = layoutRef.current.summaryBeacon;
        if (sb) {
          threeRef.current?.spawnBurst(sb.x, 1.8, sb.z, 0xf59e0b);
        }
        audioRef.current?.playPortalFocus(0.2);
        onOpenSummaryRef.current?.();
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY === 0) return;
      const step = e.deltaY < 0 ? 0.12 : -0.12;
      setZoomLevel((prev) => clampLabyrinthZoom(prev + step));
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);

    // Pre-allocated vectors/matrices for zero-GC animation loop
    const _camTargetPos = new THREE.Vector3();
    const _camLookAt = new THREE.Vector3();
    const _currLookAt = new THREE.Vector3(0, 1.55, 0);
    const _pPos = new THREE.Vector3();
    const _pQuat = new THREE.Quaternion();
    const _pScale = new THREE.Vector3();
    const _pMat = new THREE.Matrix4();
    const _bEuler = new THREE.Euler();

    // Software WebGL frame pacer (drains GPU pipeline before scheduling next frame)
    let rafId = 0;
    let timerId = 0;
    let disposed = false;

    const afterDraw = (next: () => void) => {
      if (disposed) return;
      if (!isSoftwareGl) {
        rafId = window.requestAnimationFrame(next);
        return;
      }
      const gl2 = gl as WebGL2RenderingContext;
      if (typeof gl2.fenceSync === 'function') {
        const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl2.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl2.deleteSync(sync);
            return;
          }
          if (!sync || gl2.clientWaitSync(sync, 0, 0) !== gl2.TIMEOUT_EXPIRED) {
            if (sync) gl2.deleteSync(sync);
            timerId = window.setTimeout(() => {
              if (!disposed) rafId = window.requestAnimationFrame(next);
            }, 80);
          } else {
            timerId = window.setTimeout(poll, 16);
          }
        };
        timerId = window.setTimeout(poll, 16);
      } else {
        timerId = window.setTimeout(() => {
          if (!disposed) rafId = window.requestAnimationFrame(next);
        }, 80);
      }
    };

    let lastTime = performance.now();
    let elapsed = 0;
    let lastPoseSync = 0;

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      const p = playerRef.current;
      const curLayout = layoutRef.current;
      const ctx = threeRef.current;

      if (ctx) {
        // 1. Combined desktop arrow/WASD + touch pad + mobile DeviceOrientation controls
        // Pause walking while a door confirmation or sensor calibration modal is open
        const combinedKeys = new Set<string>(heldKeys);
        virtualKeysRef.current.forEach((k) => combinedKeys.add(k));
        const movementPaused = Boolean(selectedPortalRef.current || sensorModalOpenRef.current);
        const kbInput = movementPaused
          ? { moveForward: 0, moveRight: 0, turnDelta: 0 }
          : computeKeyboardControlInput(combinedKeys, cameraModeRef.current);
        const screenAngle =
          typeof window !== 'undefined' && typeof window.screen?.orientation?.angle === 'number'
            ? window.screen.orientation.angle
            : 0;
        const motionInput =
          !movementPaused && motionActiveRef.current && motionCalibrationRef.current
            ? computeMotionControlInput(
                motionOrientationRef.current,
                motionCalibrationRef.current,
                cameraModeRef.current,
                screenAngle,
                motionSettingsRef.current
              )
            : { moveForward: 0, moveRight: 0, turnDelta: 0 };
        const ctrl = combineControlInputs(kbInput, motionInput);

        const turnSpeed = 2.05;
        if (Math.abs(ctrl.turnDelta) > 0.001) {
          p.yaw += ctrl.turnDelta * turnSpeed * dt;
        }
        const turnDamp = 1 - Math.exp(-8.0 * dt);
        p.turnRate += (ctrl.turnDelta - p.turnRate) * turnDamp;

        const speed = 5.4;
        const mag = Math.hypot(ctrl.moveForward, ctrl.moveRight);
        let movedThisFrame = false;
        if (mag > 0.001) {
          const clampedMag = Math.min(1, mag);
          const nf = (ctrl.moveForward / mag) * clampedMag;
          const nr = (ctrl.moveRight / mag) * clampedMag;
          // In aerial view, movement follows world cardinal axes; in 1st/3rd-person, relative to yaw
          const refYaw = cameraModeRef.current === 'aerial' ? 0 : p.yaw;
          const fwdX = -Math.sin(refYaw);
          const fwdZ = -Math.cos(refYaw);
          const rightX = Math.cos(refYaw);
          const rightZ = -Math.sin(refYaw);

          const dx = (fwdX * nf + rightX * nr) * speed * dt;
          const dz = (fwdZ * nf + rightZ * nr) * speed * dt;

          const resolved = resolvePlayerMovement(p.x, p.z, dx, dz, curLayout.walkableBoxes);
          const movedDist = Math.hypot(resolved.x - p.x, resolved.z - p.z);
          p.x = resolved.x;
          p.z = resolved.z;

          if (movedDist > 0.002) {
            movedThisFrame = true;
            p.bobPhase += movedDist * 2.85;
            p.stepAccum += movedDist;
            if (p.stepAccum >= 2.1) {
              p.stepAccum = 0;
              audioRef.current?.playStep();
            }
          }

          // Proximity check for walking into an active forking portal
          const nearPortal = findNearbyActivePortal(p.x, p.z, curLayout.portals, 2.25);
          if (nearPortal && nearPortal.id !== p.lastNearPortalId) {
            p.lastNearPortalId = nearPortal.id;
            audioRef.current?.playPortalFocus(severityRef.current.normalized);
            ctx.spawnBurst(nearPortal.x, 1.9, nearPortal.z, nearPortal.accentHex);
            setSelectedPortal(nearPortal);
            setDoorOpenNonce((n) => n + 1);
            setSelectedPredictionId('');
          } else if (!nearPortal) {
            p.lastNearPortalId = null;
          }
        }

        // Smooth walking intensity ramp so head-bob, sway, and limb cycles start & settle naturally
        const targetWalk = movedThisFrame ? Math.min(1, mag) : 0;
        const walkDamp = 1 - Math.exp(-(movedThisFrame ? 11.0 : 7.5) * dt);
        p.walkIntensity += (targetWalk - p.walkIntensity) * walkDamp;

        // 2. Smooth exponential camera damping across 3rd-Person, 1st-Person, and Aerial Map modes
        const damp = 1 - Math.exp(-8.5 * dt);
        const camMotion = computeWalkingCameraMotion(
          p.bobPhase,
          p.walkIntensity,
          p.turnRate,
          elapsed,
          cameraModeRef.current
        );

        if (cameraModeRef.current === 'first_person') {
          const rightX = Math.cos(p.yaw);
          const rightZ = -Math.sin(p.yaw);
          _camTargetPos.set(
            p.x + rightX * camMotion.swayX,
            1.65 + camMotion.bobY,
            p.z + rightZ * camMotion.swayX
          );
          _camLookAt.set(
            p.x - Math.sin(p.yaw) * 6 + rightX * (camMotion.swayX * 0.4),
            1.58 + camMotion.bobY * 0.45 + camMotion.pitchBob,
            p.z - Math.cos(p.yaw) * 6 + rightZ * (camMotion.swayX * 0.4)
          );
        } else if (cameraModeRef.current === 'third_person') {
          const tp = computeThirdPersonCameraPose(
            p.x,
            p.z,
            p.yaw,
            zoomLevelRef.current,
            curLayout.walkableBoxes,
            camMotion
          );
          _camTargetPos.set(tp.camX, tp.camY, tp.camZ);
          _camLookAt.set(tp.lookX, tp.lookY, tp.lookZ);
        } else {
          // Elevated architectural view of the entire branching labyrinth
          const centerX = (curLayout.bounds.minX + curLayout.bounds.maxX) / 2;
          const centerZ = curLayout.currentChamberCenter.z;
          const aerialScale = computeAerialZoomDistanceScale(zoomLevelRef.current);
          const camHeight = Math.min(48, (19 + curLayout.chambers.length * 4.2) * aerialScale);
          const camOffsetZ = (12 + curLayout.chambers.length * 1.5) * aerialScale;
          _camTargetPos.set(centerX, camHeight, centerZ + camOffsetZ);
          _camLookAt.set(centerX, 0.5, centerZ - 1.5);
        }

        ctx.camera.position.lerp(_camTargetPos, damp);
        _currLookAt.lerp(_camLookAt, damp);
        ctx.camera.lookAt(_currLookAt);
        if (Math.abs(camMotion.rollZ) > 0.0004) {
          ctx.camera.rotateZ(camMotion.rollZ);
        }

        // Smooth optical FOV zoom damping (1st/3rd-person zoom & smooth reset in aerial view)
        const targetFov = computeLabyrinthCameraFov(zoomLevelRef.current, cameraModeRef.current);
        if (Math.abs(ctx.camera.fov - targetFov) > 0.02) {
          ctx.camera.fov += (targetFov - ctx.camera.fov) * damp;
          ctx.camera.updateProjectionMatrix();
        }

        // Headlamp glides softly with the explorer & pulses with biological heartbeat as severity rises
        const sev = severityRef.current;

        // Update & animate composite 3D player avatar (visible in 3rd-person & aerial views)
        if (ctx.playerAvatar) {
          const showAvatar = cameraModeRef.current !== 'first_person';
          ctx.playerAvatar.root.visible = showAvatar;
          if (showAvatar) {
            ctx.playerAvatar.root.position.set(p.x, 0, p.z);
            ctx.playerAvatar.root.rotation.y = p.yaw;
            const avatarScale = cameraModeRef.current === 'aerial' ? 1.38 : 1.0;
            ctx.playerAvatar.root.scale.setScalar(avatarScale);
            animatePlayerAvatar(
              ctx.playerAvatar,
              elapsed,
              p.bobPhase,
              p.walkIntensity,
              p.turnRate,
              sev
            );
          }
        }
        const beatHz = sev.heartbeatBpm / 60;
        const beatPhase = (elapsed * beatHz) % 1;
        const beatPulse =
          Math.exp(-Math.pow((beatPhase - 0.12) / 0.055, 2)) +
          0.65 * Math.exp(-Math.pow((beatPhase - 0.28) / 0.06, 2));
        ctx.headlamp.position.set(p.x, 2.5, p.z);
        ctx.headlamp.intensity =
          themeRef.current.headlampIntensity * (1 + beatPulse * 0.28 * sev.normalized);

        // 3. Animate portal keystones, energy curtains, molecular totems, bio-growths & diagnostic beacons
        for (let i = 0; i < ctx.portalRigs.length; i++) {
          const rig = ctx.portalRigs[i];
          rig.keystone.rotation.y += dt * (rig.portal.status === 'active' ? 1.5 : 0.35);
          rig.keystone.position.y = 3.96 + Math.sin(elapsed * 2.2 + i) * 0.08;
          if (rig.membrane) {
            const mat = rig.membrane.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.32 + Math.sin(elapsed * 3.0 + i * 1.1) * 0.1;
          }
        }

        for (let i = 0; i < ctx.totemRigs.length; i++) {
          const tRig = ctx.totemRigs[i];
          tRig.core.rotation.y += dt * (0.9 + sev.normalized * 0.8);
          tRig.core.rotation.x += dt * 0.4;
          tRig.ringA.rotation.z += dt * (0.7 + sev.normalized * 0.65);
          tRig.ringB.rotation.z -= dt * (0.55 + sev.normalized * 0.55);
        }

        for (let i = 0; i < ctx.diagnosticRigs.length; i++) {
          const dRig = ctx.diagnosticRigs[i];
          dRig.beacon.rotation.y += dt * 1.6;
          dRig.beacon.position.y = 1.72 + Math.sin(elapsed * 2.8 + i) * 0.06;
        }

        if (ctx.beaconRig) {
          ctx.beaconRig.core.rotation.y += dt * (0.7 + sev.normalized * 0.7);
          ctx.beaconRig.ringOuter.rotation.z += dt * 0.45;
          ctx.beaconRig.ringInner.rotation.z -= dt * 0.6;
        }

        if (ctx.summarySignalRig) {
          ctx.summarySignalRig.crown.rotation.y += dt * 1.35;
          ctx.summarySignalRig.crown.position.y = 1.68 + Math.sin(elapsed * 2.4) * 0.1;
          ctx.summarySignalRig.ring.rotation.z += dt * 0.9;
          ctx.summarySignalRig.ring.position.y = ctx.summarySignalRig.crown.position.y;
          const beamMat = ctx.summarySignalRig.beam.material as THREE.MeshBasicMaterial;
          beamMat.opacity = 0.2 + Math.sin(elapsed * 2.6) * 0.08;
        }

        // Organic tumorous nodules breathe & pulse in sync with severity heartbeat
        if (ctx.bioGrowthRig) {
          const bRig = ctx.bioGrowthRig;
          bRig.material.emissiveIntensity =
            bRig.baseEmissiveIntensity * (0.85 + beatPulse * 0.55);
          const amp = 0.06 + sev.normalized * 0.12;
          for (let i = 0; i < bRig.instances.length; i++) {
            const inst = bRig.instances[i];
            const wave =
              1 +
              Math.sin(elapsed * sev.pulseSpeed + inst.phase) * amp +
              beatPulse * 0.08 * sev.normalized;
            _pPos.set(inst.x, inst.y, inst.z);
            _bEuler.set(inst.phase * 0.3, inst.rotY, inst.phase * 0.2);
            _pQuat.setFromEuler(_bEuler);
            _pScale.set(inst.sx * wave, inst.sy * wave, inst.sz * wave);
            _pMat.compose(_pPos, _pQuat, _pScale);
            bRig.mesh.setMatrixAt(i, _pMat);
          }
          bRig.mesh.instanceMatrix.needsUpdate = true;
        }

        // Floating atmospheric bio-spores drifting inside the active chamber
        const activeSpores = Math.min(SPORE_POOL_SIZE, sev.sporeCount);
        const cx = curLayout.currentChamberCenter.x;
        const cz = curLayout.currentChamberCenter.z;
        const riseBoost = 0.6 + sev.normalized * 1.3;
        _pQuat.identity();
        for (let i = 0; i < SPORE_POOL_SIZE; i++) {
          if (i >= activeSpores) {
            ctx.sporesMesh.setMatrixAt(i, zeroMat);
            continue;
          }
          const sp = ctx.spores[i];
          sp.y += sp.speed * riseBoost * dt;
          if (sp.y > 4.7) sp.y = 0.25;
          const sway = Math.sin(elapsed * 1.4 + sp.driftPhase) * 0.28;
          const sc = sp.baseScale * (0.8 + sev.normalized * 0.55);
          _pPos.set(cx + sp.ox + sway, sp.y, cz + sp.oz - sway * 0.7);
          _pScale.set(sc, sc, sc);
          _pMat.compose(_pPos, _pQuat, _pScale);
          ctx.sporesMesh.setMatrixAt(i, _pMat);
        }
        ctx.sporesMesh.instanceMatrix.needsUpdate = true;

        // 4. Update pooled spark particles
        let anyParticles = false;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const slot = ctx.particles[i];
          if (!slot.active) continue;
          slot.life += dt;
          if (slot.life >= slot.maxLife) {
            slot.active = false;
            ctx.particlesMesh.setMatrixAt(i, zeroMat);
            anyParticles = true;
            continue;
          }
          slot.vy -= 4.8 * dt;
          slot.x += slot.vx * dt;
          slot.y += slot.vy * dt;
          slot.z += slot.vz * dt;
          const s = Math.max(0.01, 1 - slot.life / slot.maxLife);
          _pPos.set(slot.x, Math.max(0.05, slot.y), slot.z);
          _pScale.set(s, s, s);
          _pMat.compose(_pPos, _pQuat, _pScale);
          ctx.particlesMesh.setMatrixAt(i, _pMat);
          anyParticles = true;
        }
        if (anyParticles) {
          ctx.particlesMesh.instanceMatrix.needsUpdate = true;
        }

        // Sync minimap pose at ~12Hz
        if (now - lastPoseSync > 85) {
          lastPoseSync = now;
          setPlayerPose((prev) => {
            if (
              Math.abs(prev.x - p.x) < 0.04 &&
              Math.abs(prev.z - p.z) < 0.04 &&
              Math.abs(prev.yaw - p.yaw) < 0.04
            ) {
              return prev;
            }
            return { x: p.x, z: p.z, yaw: p.yaw };
          });
        }

        ctx.renderer.render(ctx.scene, ctx.camera);
      }

      afterDraw(tick);
    };

    // Start render loop
    afterDraw(tick);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      disposeObjectTree(worldGroup);
      if (threeRef.current?.playerAvatar) {
        disposeObjectTree(threeRef.current.playerAvatar.root);
        scene.remove(threeRef.current.playerAvatar.root);
      }
      if (threeRef.current?.textures) {
        threeRef.current.textures.dispose();
      }
      pGeo.dispose();
      pMat.dispose();
      sporeGeo.dispose();
      sporeMat.dispose();
      if (envRT) envRT.dispose();
      renderer.dispose();
      try {
        renderer.forceContextLoss();
      } catch {
        // Ignore if context already lost
      }
      audioRef.current?.dispose();
      threeRef.current = null;
      virtualKeysRef.current.clear();
    };
  }, [rebuildWorld, webglRetryNonce]);

  // Rebuild labyrinth chambers/portals/aesthetics/severity without losing player pose
  useEffect(() => {
    if (!didInitialBuildRef.current) {
      didInitialBuildRef.current = true;
      return;
    }
    rebuildWorld(layout, state.mode, theme, resolutionPreset.smoothTextures, severity);
    if (threeRef.current) {
      threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
    }
  }, [layout, state.mode, theme, resolutionPreset.smoothTextures, severity, rebuildWorld]);

  // Update internal pixel buffer scale instantly when changing resolution level or expand state
  useEffect(() => {
    threeRef.current?.resizeRenderer();
  }, [resolutionLevel, isExpanded]);

  // Essential-only portal branch metadata for the confirmation drawer
  // Cancer decisions and Oncologist intervention doors both include randomized biological predictions.
  const oncologistFindings = useMemo(
    () => (state.mode === 'oncologist' ? getOncologistFindingsSummary(state, molecularDetail) : null),
    [state, molecularDetail]
  );

  const activePortalDetails = useMemo(() => {
    void doorOpenNonce;
    if (!selectedPortal || !currentRoundDef) return null;
    if (state.mode === 'cancer') {
      const strat = currentRoundDef.cancerStrategies.find((s) => s.id === selectedPortal.actionId);
      if (!strat) return null;
      const display = getCancerStrategyDisplayInfo(strat, molecularDetail);
      return {
        requiresPrediction: true as const,
        kind: 'cancer' as const,
        title: display.title,
        summary: display.effect,
        secondaryDetail: '',
        guidanceNote: '',
        costTag: `Costo: ${display.cost}`,
        ctaLabel: 'Abrir puerta',
        predictionPrompt: '¿Qué esperas que ocurra con el cambio que elegiste?',
        predictions: shuffleRandom(currentRoundDef.cancerPredictions).map((p) => ({
          ...p,
          label: formatBiologyText(p.label, molecularDetail),
        })),
      };
    }

    if (selectedPortal.portalKind === 'diagnostic') {
      const tool = DIAGNOSTIC_TOOLS.find((t) => t.id === selectedPortal.actionId);
      if (!tool) return null;
      const diagInfo = getDiagnosticDisplayInfo(tool, molecularDetail);
      return {
        requiresPrediction: false as const,
        kind: 'diagnostic' as const,
        title: diagInfo.name,
        summary: diagInfo.summary,
        secondaryDetail: '',
        guidanceNote: '',
        costTag:
          molecularDetail === 'simple'
            ? 'Ronda de estudio · Sin desgaste al cuerpo'
            : 'Ronda de estudio · Sin toxicidad',
        ctaLabel: molecularDetail === 'simple' ? 'Hacer este estudio' : 'Realizar el estudio',
        predictionPrompt: '',
        predictions: [],
      };
    }

    const therapy = getTherapyById(selectedPortal.actionId as TherapyId);
    if (!therapy) return null;
    const therapyInfo = getTherapyDisplayInfo(therapy, molecularDetail);
    return {
      requiresPrediction: true as const,
      kind: 'intervention' as const,
      title: therapyInfo.name,
      summary: therapyInfo.mechanism,
      secondaryDetail: '',
      guidanceNote: oncologistFindings?.interventionGuidance ?? '',
      costTag:
        molecularDetail === 'simple'
          ? `Desgaste al cuerpo ${therapy.toxicityDelta >= 0 ? '+' : ''}${therapy.toxicityDelta}`
          : `Toxicidad ${therapy.toxicityDelta >= 0 ? '+' : ''}${therapy.toxicityDelta}`,
      ctaLabel: molecularDetail === 'simple' ? 'Aplicar tratamiento' : 'Aplicar intervención',
      predictionPrompt:
        molecularDetail === 'simple'
          ? '¿Qué esperas que pase con este tratamiento?'
          : '¿Qué esperas que ocurra con esta intervención?',
      predictions: shuffleRandom(currentRoundDef.oncologistPredictions ?? []).map((p) => ({
        ...p,
        label: getOncologistPredictionLabel(p, molecularDetail),
      })),
    };
  }, [selectedPortal, doorOpenNonce, currentRoundDef, state.mode, molecularDetail, oncologistFindings]);

  const activeDoorLock =
    selectedPortal && doorLockState?.portalId === selectedPortal.id ? doorLockState : null;

  const handleConfirmBranch = () => {
    if (!selectedPortal || !activePortalDetails) return;

    if (state.mode === 'cancer') {
      if (!selectedPredictionId) return;
      const gate = evaluatePredictionGate(state, selectedPortal.actionId, selectedPredictionId);
      if (!gate.allowed) {
        audioRef.current?.playDoorLocked();
        threeRef.current?.spawnBurst(selectedPortal.x, 1.8, selectedPortal.z, 0xe11d48);
        setDoorLockState((prev) => ({
          portalId: selectedPortal.id,
          feedback: formatBiologyText(gate.feedback, molecularDetail),
          rejectedIds: Array.from(
            new Set([
              ...(prev?.portalId === selectedPortal.id ? prev.rejectedIds : []),
              selectedPredictionId,
            ])
          ),
        }));
        return;
      }

      audioRef.current?.ensureAmbientStarted();
      audioRef.current?.playBranchCross(state.clinical.tumorBurden, 12, 'cancer');
      threeRef.current?.spawnBurst(selectedPortal.x, 2.0, selectedPortal.z, selectedPortal.accentHex);
      onResolveCancerTurn(selectedPortal.actionId, selectedPredictionId);
    } else if (selectedPortal.portalKind === 'diagnostic') {
      audioRef.current?.ensureAmbientStarted();
      audioRef.current?.playDiagnostic();
      threeRef.current?.spawnBurst(selectedPortal.x, 2.0, selectedPortal.z, selectedPortal.accentHex);
      onResolveOncologistDiagnostic(selectedPortal.actionId as DiagnosticToolId);
    } else {
      if (!selectedPredictionId) return;
      const gate = evaluatePredictionGate(state, selectedPortal.actionId, selectedPredictionId);
      if (!gate.allowed) {
        audioRef.current?.playDoorLocked();
        threeRef.current?.spawnBurst(selectedPortal.x, 1.8, selectedPortal.z, 0xe11d48);
        setDoorLockState((prev) => ({
          portalId: selectedPortal.id,
          feedback: formatBiologyText(gate.feedback, molecularDetail),
          rejectedIds: Array.from(
            new Set([
              ...(prev?.portalId === selectedPortal.id ? prev.rejectedIds : []),
              selectedPredictionId,
            ])
          ),
        }));
        return;
      }

      audioRef.current?.ensureAmbientStarted();
      audioRef.current?.playBranchCross(state.clinical.tumorBurden, -12, 'oncologist');
      threeRef.current?.spawnBurst(selectedPortal.x, 2.0, selectedPortal.z, selectedPortal.accentHex);
      onResolveOncologistTurn(selectedPortal.actionId as TherapyId, selectedPredictionId);
    }

    setDoorLockState(null);
    setSelectedPortal(null);
    setSelectedPredictionId('');
  };

  const handleObserveSkipRound = () => {
    if (state.mode !== 'oncologist' || state.finished) return;
    audioRef.current?.ensureAmbientStarted();
    audioRef.current?.playDiagnostic();
    setDoorLockState(null);
    setSelectedPortal(null);
    setSelectedPredictionId('');
    onResolveOncologistObservation();
  };

  // Minimap coordinate transform
  const mapWidth = 112;
  const mapHeight = 112;
  const worldW = Math.max(16, layout.bounds.maxX - layout.bounds.minX);
  const worldH = Math.max(16, layout.bounds.maxZ - layout.bounds.minZ);
  const mapScale = Math.min((mapWidth - 14) / worldW, (mapHeight - 14) / worldH);
  const toMapX = (wx: number) =>
    mapWidth / 2 + (wx - (layout.bounds.minX + layout.bounds.maxX) / 2) * mapScale;
  const toMapY = (wz: number) =>
    mapHeight / 2 + (wz - (layout.bounds.minZ + layout.bounds.maxZ) / 2) * mapScale;

  const activeFallbackPortals = useMemo(
    () => layout.portals.filter((p) => p.status === 'active'),
    [layout.portals]
  );

  return (
    <div
      ref={stageRef}
      tabIndex={-1}
      className="relative w-full h-full bg-slate-950 select-none overflow-hidden outline-none"
      data-testid="labyrinth-3d-stage"
      data-labyrinth-round={state.currentRound}
      data-labyrinth-mode={state.mode}
      data-oncologist-phase={oncologistPhase ?? ''}
      data-unlimited-mode={state.unlimitedMode ? 'true' : 'false'}
      data-labyrinth-phase={theme.phase}
      data-destination-progress={destination.progress}
      data-cancer-severity={severity.level}
      data-cancer-burden={severity.burden}
      data-heartbeat-bpm={severity.heartbeatBpm}
      data-camera-mode={cameraMode}
      data-avatar-mode={state.mode}
      data-avatar-visible={cameraMode !== 'first_person' ? 'true' : 'false'}
      data-finished={state.finished ? 'true' : 'false'}
      data-zoom-level={Math.round(zoomLevel * 100)}
      data-low-res={resolutionLevel === 'low' ? 'true' : 'false'}
      data-resolution-level={resolutionLevel}
      data-motion-sensor={motionSensorActive ? 'active' : 'off'}
      data-webgl-fallback={webglUnavailable ? 'true' : 'false'}
      data-player-x={playerPose.x.toFixed(2)}
      data-player-z={playerPose.z.toFixed(2)}
      data-player-yaw={playerPose.yaw.toFixed(2)}
      data-canvas-width={renderBufferDims.w}
      data-canvas-height={renderBufferDims.h}
    >
      {/* Isolated WebGL Canvas Mount (touch-none ensures smooth mobile drag without page scroll) */}
      <div ref={mountRef} className="w-full h-full touch-none" />

      {/* Resilient Interactive Chamber Fallback when WebGL is unavailable on a device/browser */}
      {webglUnavailable && (
        <div
          data-testid="labyrinth-webgl-fallback"
          className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#11192c] to-slate-950 flex flex-col items-center justify-center p-6 pt-36 pb-20 text-slate-100 overflow-y-auto"
        >
          <div className="max-w-3xl w-full space-y-5 text-center">
            <div className="space-y-1">
              <p className="text-xs font-mono text-sky-400">
                Vista arquitectónica compatible · Cámara {state.currentRound}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Elige una puerta para continuar el recorrido
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Tu navegador restringió la aceleración WebGL 3D, pero puedes recorrer todas las
                puertas del laberinto normalmente desde aquí.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {activeFallbackPortals.map((portal) => (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => {
                    setSelectedPortal(portal);
                    setDoorOpenNonce((n) => n + 1);
                    setSelectedPredictionId('');
                  }}
                  className="group rounded-xl border bg-slate-900/90 hover:bg-slate-800/95 p-5 text-left transition-colors flex flex-col justify-between gap-4 cursor-pointer"
                  style={{ borderColor: portal.accentCss }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <DoorOpen
                        className="w-4 h-4 shrink-0"
                        style={{ color: portal.accentCss }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{portal.sublabel}</span>
                    </div>
                    <div className="text-base font-bold text-white leading-snug">
                      {portal.label}
                    </div>
                  </div>
                  <div
                    className="text-xs font-semibold inline-flex items-center gap-1"
                    style={{ color: portal.accentCss }}
                  >
                    <span>Explorar puerta</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {state.finished && onOpenSummary && (
                <button
                  type="button"
                  onClick={onOpenSummary}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                  Ver resumen de cierre
                </button>
              )}
              {state.mode === 'oncologist' && !state.finished && (
                <button
                  type="button"
                  onClick={handleObserveSkipRound}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  Observación · Saltar ronda
                </button>
              )}
              <button
                type="button"
                onClick={() => setWebglRetryNonce((n) => n + 1)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reintentar vista 3D
              </button>
              {onSwitchToText && (
                <button
                  type="button"
                  onClick={onSwitchToText}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
                >
                  Abrir en Modo Texto
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Peripheral crimson urgency vignette at high/critical cancer severity (pure CSS, no backdrop-filter) */}
      {severity.vignetteOpacity > 0 && (
        <div
          aria-hidden="true"
          data-testid="severity-vignette"
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: severity.vignetteOpacity,
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(153,27,27,0.75) 84%, rgba(69,10,10,0.95) 100%)',
          }}
        />
      )}

      {/* Compact Top-Left Action Bar (keeps upper-left view & door titles completely clear) */}
      <div className="pointer-events-none absolute top-3 left-3 right-28 sm:right-auto flex flex-wrap items-center gap-1.5 z-10">
        {onBackHome && (
          <button
            type="button"
            onClick={onBackHome}
            className="pointer-events-auto bg-slate-950/92 hover:bg-slate-900 border border-slate-600/90 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
            <span>Volver al inicio</span>
          </button>
        )}
        {onMolecularDetailChange && (
          <button
            type="button"
            data-testid="hud-detail-cycle-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              const next: MolecularDetailMode =
                molecularDetail === 'simple'
                  ? 'logic'
                  : molecularDetail === 'logic'
                    ? 'precision'
                    : 'simple';
              onMolecularDetailChange(next);
            }}
            title="Cambiar nivel de lenguaje (Simple / Lógica / Precisión)"
            className={`pointer-events-auto border rounded-lg px-2.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              molecularDetail === 'simple'
                ? 'bg-emerald-950/92 hover:bg-emerald-900 border-emerald-500/80 text-emerald-200'
                : 'bg-slate-950/92 hover:bg-slate-900 border-slate-600/90 text-slate-100'
            }`}
          >
            <Lightbulb
              className={`w-3.5 h-3.5 shrink-0 ${
                molecularDetail === 'simple' ? 'text-emerald-400' : 'text-sky-400'
              }`}
              aria-hidden="true"
            />
            <span>{getDetailModeLabel(molecularDetail)}</span>
          </button>
        )}
        {onThemeChange && (
          <div className="pointer-events-auto">
            <ThemeToggle theme={themeMode} onChange={onThemeChange} variant="hud" />
          </div>
        )}
        {/* Always-available Observation Skip Button in Oncologist Mode */}
        {state.mode === 'oncologist' && !state.finished && (
          <button
            type="button"
            data-testid="oncologist-observe-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              handleObserveSkipRound();
            }}
            className="pointer-events-auto bg-slate-950/92 hover:bg-slate-900 border border-emerald-500/75 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>Observación · Saltar ronda</span>
            <SkipForward className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Movable & Hideable Information Panel (defaults to bottom-left so door titles stay unobstructed) */}
      <LabyrinthInfoPanel
        state={state}
        molecularDetail={molecularDetail}
        oncologistPhase={oncologistPhase}
        destinationProgress={destination.progress}
        theme={theme}
        severity={severity}
        containerRef={stageRef}
      />

      {/* Post-Game Exploration Signal Banner (keeps labyrinth open & guides player to closing summary) */}
      {state.finished && !selectedPortal && onOpenSummary && (
        <div
          role="region"
          aria-label="Recorrido completado"
          data-testid="labyrinth-finished-signal"
          className={`absolute top-14 left-3 right-28 sm:top-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-20 max-w-md rounded-xl border-2 px-3.5 py-2.5 bg-slate-950/96 shadow-lg flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 ${
            state.mode === 'cancer'
              ? 'border-amber-400/90 text-amber-50'
              : 'border-emerald-400/90 text-emerald-50'
          }`}
        >
          <div className="flex items-start gap-2 min-w-0">
            <Flag
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                state.mode === 'cancer' ? 'text-amber-400' : 'text-emerald-400'
              }`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight text-white">
                Recorrido finalizado
              </div>
              <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                Camina por el laberinto para revisar tus decisiones o abre el informe final.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="labyrinth-open-summary-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSummary();
            }}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              state.mode === 'cancer'
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
            }`}
          >
            <span>Ver resumen de cierre</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Hover Cue or Diagnostic / Sensor Toast (clears top buttons, minimap & bottom-left info panel) */}
      {(diagToast || hoveredLabel) && !selectedPortal && !state.finished && (
        <div
          role={diagToast ? 'status' : undefined}
          className="pointer-events-none absolute top-14 left-3 right-28 sm:top-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-sm bg-slate-950/94 border border-sky-500/70 rounded-lg px-3.5 py-2 text-xs text-slate-100 text-center z-10"
        >
          {diagToast ?? hoveredLabel}
        </div>
      )}

      {/* Top-Right Live 2D Architectural Minimap */}
      <div
        aria-label="Minimapa del laberinto"
        className="absolute top-3 right-3 bg-slate-950/92 border border-slate-700/90 rounded-lg p-1.5 scale-75 origin-top-right sm:scale-100"
      >
        <svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
          {/* Walkable corridors & chambers */}
          {layout.walkableBoxes.map((box) => {
            const x = toMapX(box.minX);
            const y = toMapY(box.minZ);
            const w = Math.max(2, (box.maxX - box.minX) * mapScale);
            const h = Math.max(2, (box.maxZ - box.minZ) * mapScale);
            return (
              <rect
                key={box.id}
                x={x}
                y={y}
                width={w}
                height={h}
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="0.75"
              />
            );
          })}

          {/* Diagnostic stations (Oncologist) */}
          {layout.diagnosticStations.map((st) => (
            <rect
              key={st.id}
              x={toMapX(st.x) - 2.5}
              y={toMapY(st.z) - 2.5}
              width={5}
              height={5}
              fill={st.completed ? '#10b981' : '#38bdf8'}
            />
          ))}

          {/* Portals */}
          {layout.portals.map((portal) => (
            <circle
              key={portal.id}
              cx={toMapX(portal.x)}
              cy={toMapY(portal.z)}
              r={portal.status === 'active' ? 3.5 : 2.3}
              fill={
                portal.status === 'sealed'
                  ? '#475569'
                  : portal.status === 'chosen'
                    ? '#94a3b8'
                    : portal.accentCss
              }
            />
          ))}

          {/* Player position & heading indicator */}
          <g
            transform={`translate(${toMapX(playerPose.x)}, ${toMapY(playerPose.z)}) rotate(${
              (-playerPose.yaw * 180) / Math.PI
            })`}
          >
            <polygon points="0,-6 4,4 0,2 -4,4" fill="#f8fafc" />
          </g>
        </svg>
      </div>

      {/* Interactive Branch Confirmation Overlay (essential info only) */}
      {selectedPortal && activePortalDetails && !state.finished && (
        <div
          role="dialog"
          aria-label={`Confirmar bifurcación: ${activePortalDetails.title}`}
          className="absolute bottom-14 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px] bg-slate-950/96 border border-slate-600 rounded-xl p-4 text-slate-100"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-start gap-2">
              <span
                className="w-2.5 h-2.5 mt-1 rounded-xs shrink-0"
                style={{ backgroundColor: selectedPortal.accentCss }}
                aria-hidden="true"
              />
              <h3
                data-testid="portal-dialog-full-title"
                className="text-sm font-bold text-white leading-snug"
              >
                {activePortalDetails.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPortal(null);
                setDoorLockState(null);
              }}
              aria-label="Cerrar"
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-1.5 text-xs text-slate-300 leading-snug">
            {activePortalDetails.summary}
          </p>
          {activePortalDetails.secondaryDetail && (
            <p className="mt-1.5 text-xs text-slate-400 leading-snug">
              {activePortalDetails.secondaryDetail}
            </p>
          )}
          {activePortalDetails.guidanceNote && (
            <p className="mt-2 rounded-md border border-sky-500/40 bg-sky-950/60 px-2.5 py-1.5 text-[11px] text-sky-200 leading-snug">
              <strong className="text-sky-300">Según tus hallazgos:</strong>{' '}
              {activePortalDetails.guidanceNote}
            </p>
          )}
          <div className="mt-1.5 text-[11px] font-mono text-slate-400">
            {activePortalDetails.costTag}
          </div>

          {/* Prediction gate for Cancer decisions and Oncologist intervention doors */}
          {activePortalDetails.requiresPrediction && (
            <div
              data-testid="portal-predictions-section"
              className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5"
            >
              <div className="text-[11px] font-semibold text-slate-300">
                {activePortalDetails.predictionPrompt}
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {activePortalDetails.predictions.map((pred) => {
                  const isSelected = selectedPredictionId === pred.id;
                  const isRejected = Boolean(activeDoorLock?.rejectedIds.includes(pred.id));
                  return (
                    <button
                      key={pred.id}
                      type="button"
                      data-testid={`portal-prediction-${pred.id}`}
                      onClick={() => setSelectedPredictionId(pred.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md border text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? isRejected
                            ? 'bg-rose-950/80 border-rose-400 text-rose-100 font-medium'
                            : 'bg-slate-800 border-sky-400 text-white font-medium'
                          : isRejected
                            ? 'bg-slate-900/70 border-rose-800/80 text-rose-300/85 hover:border-rose-600'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span>{pred.label}</span>
                      {isRejected && (
                        <Lock
                          className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400"
                          aria-label="Predicción descartada"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {activeDoorLock && (
                <div
                  role="alert"
                  data-testid="door-locked-alert"
                  className="mt-2 p-2.5 rounded-lg bg-rose-950/90 border border-rose-500/75 text-xs text-rose-100 space-y-1"
                >
                  <div className="font-semibold text-rose-200 inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                    <span>Puerta bloqueada</span>
                  </div>
                  <p className="text-[11px] text-rose-100/90 leading-snug">
                    {activeDoorLock.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPortal(null);
                setDoorLockState(null);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="portal-confirm-btn"
              disabled={activePortalDetails.requiresPrediction && !selectedPredictionId}
              onClick={handleConfirmBranch}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                !activePortalDetails.requiresPrediction || selectedPredictionId
                  ? state.mode === 'cancer'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                    : activePortalDetails.kind === 'diagnostic'
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                      : 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{activePortalDetails.ctaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* First-Entry Device-Aware Controls Overlay (shown once on entering 3D Labyrinth) */}
      {showControlsHint && !selectedPortal && !webglUnavailable && !state.finished && (
        <div
          role="dialog"
          aria-label="Controles del laberinto 3D"
          data-testid="labyrinth-controls-onboarding"
          data-device-kind={isTouchDevice ? 'mobile' : 'desktop'}
          className="absolute bottom-16 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-20 bg-slate-950/95 border border-sky-500/70 rounded-xl p-4 text-slate-100 space-y-2.5 shadow-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-white">
              {isTouchDevice ? 'Cómo moverte en móvil' : 'Cómo moverte en el laberinto 3D'}
            </h3>
            <button
              type="button"
              onClick={dismissControlsHint}
              aria-label="Cerrar controles"
              className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {isTouchDevice ? (
            <ul className="space-y-1 text-xs text-slate-300 leading-relaxed">
              <li>• Desliza el dedo en la pantalla para girar la vista.</li>
              <li>
                • Activa Sensor para avanzar inclinando el teléfono, ajusta su sensibilidad en el
                icono de calibración o abre las flechas en pantalla.
              </li>
              <li>• Toca cualquier puerta para ver la decisión de esta ronda.</li>
            </ul>
          ) : (
            <ul className="space-y-1 text-xs text-slate-300 leading-relaxed">
              <li>• Usa las teclas de dirección (↑ ↓ ← →) o WASD para caminar y girar.</li>
              <li>• Arrastra con el mouse para mirar alrededor y haz clic en una puerta para abrirla.</li>
              <li>
                • Pulsa V para alternar entre 3ª persona, 1ª persona y vista aérea, y + / − para el
                zoom.
              </li>
            </ul>
          )}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              data-testid="dismiss-controls-onboarding-btn"
              onClick={dismissControlsHint}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Context Lost Notice */}
      {contextLost && (
        <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center p-4 text-center">
          <p className="text-xs text-slate-300 font-mono">
            Restaurando contexto WebGL del laberinto…
          </p>
        </div>
      )}

      {/* Optional Hold-to-Move Directional Pad (compact, bottom-right above dock, zero decision shortcuts) */}
      {showTouchPad && !webglUnavailable && !selectedPortal && (
        <div
          role="group"
          aria-label="Controles direccionales en pantalla"
          data-testid="labyrinth-touch-pad"
          className="absolute bottom-20 sm:bottom-16 right-3 z-10 grid grid-cols-3 gap-1 bg-slate-950/90 border border-slate-700/90 rounded-xl p-1.5 touch-none select-none"
        >
          <div />
          <button
            type="button"
            aria-label="Avanzar"
            data-testid="pad-up-btn"
            {...bindVirtualKey('ArrowUp')}
            className="w-10 h-10 rounded-lg bg-slate-800/95 active:bg-sky-600 text-slate-100 flex items-center justify-center cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" aria-hidden="true" />
          </button>
          <div />
          <button
            type="button"
            aria-label="Girar a la izquierda"
            data-testid="pad-left-btn"
            {...bindVirtualKey('ArrowLeft')}
            className="w-10 h-10 rounded-lg bg-slate-800/95 active:bg-sky-600 text-slate-100 flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Retroceder"
            data-testid="pad-down-btn"
            {...bindVirtualKey('ArrowDown')}
            className="w-10 h-10 rounded-lg bg-slate-800/95 active:bg-sky-600 text-slate-100 flex items-center justify-center cursor-pointer"
          >
            <ArrowDown className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Girar a la derecha"
            data-testid="pad-right-btn"
            {...bindVirtualKey('ArrowRight')}
            className="w-10 h-10 rounded-lg bg-slate-800/95 active:bg-sky-600 text-slate-100 flex items-center justify-center cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Compact Bottom-Right Control Dock (wraps cleanly on narrow mobile screens; single row on desktop) */}
      <div className="absolute bottom-3 left-2 right-2 sm:left-3 sm:right-3 flex items-center justify-end gap-2 pointer-events-none">
        {/* Camera / Sensor / Directional Pad / Zoom / Resolution / Sound / Optional Expand Toggles */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-0.5 max-w-full bg-slate-950/92 border border-slate-700/90 rounded-lg p-1 text-[11px] text-slate-200">
          <button
            type="button"
            data-testid="camera-mode-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              setCameraMode((prev) => cycleLabyrinthCameraMode(prev));
            }}
            className="px-2 py-1 rounded hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            title="Cambiar cámara: 3ª persona, 1ª persona o aérea (tecla V)"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            <span>{getCameraModeLabel(cameraMode)}</span>
          </button>

          {/* Mobile Motion Sensor Toggle + Quick Recalibrate + On-Screen Arrow Pad Toggle */}
          <div
            role="group"
            aria-label="Controles de movimiento móvil"
            className="flex items-center gap-0.5 px-1 border-l border-slate-800"
          >
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                void handleToggleMotionSensor();
              }}
              aria-pressed={motionSensorActive}
              data-testid="motion-sensor-btn"
              className={`px-2 py-1 rounded inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
                motionSensorActive
                  ? 'bg-sky-600 text-white hover:bg-sky-500'
                  : 'hover:bg-slate-800 text-slate-200'
              }`}
              title="Activar o desactivar sensor de movimiento (móvil)"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{motionSensorActive ? 'Sensor ON' : 'Sensor'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                setSensorModalOpen(true);
              }}
              aria-label="Ajustar y calibrar sensibilidad del sensor"
              data-testid="motion-calibrate-open-btn"
              className={`p-1 rounded cursor-pointer transition-colors ${
                sensorModalOpen
                  ? 'bg-sky-600 text-white hover:bg-sky-500'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Ajustar y calibrar sensibilidad del sensor"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            {motionSensorActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleRecalibrateMotionSensor();
                }}
                aria-label="Recalibrar sensor de movimiento"
                data-testid="motion-recalibrate-btn"
                className="p-1 rounded hover:bg-slate-800 text-sky-300 cursor-pointer"
                title="Recalibrar ángulo neutro del sensor"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                setShowTouchPad((prev) => !prev);
              }}
              aria-pressed={showTouchPad}
              aria-label="Mostrar u ocultar controles direccionales en pantalla"
              data-testid="toggle-touchpad-btn"
              className={`p-1 rounded cursor-pointer transition-colors ${
                showTouchPad
                  ? 'bg-sky-600 text-white hover:bg-sky-500'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Flechas direccionales en pantalla"
            >
              <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Zoom In / Zoom Out Control */}
          <div
            role="group"
            aria-label="Zoom del laberinto"
            className="flex items-center gap-0.5 px-1 border-l border-slate-800"
          >
            <button
              type="button"
              disabled={zoomLevel <= LABYRINTH_ZOOM_MIN}
              onClick={() => setZoomLevel((prev) => stepLabyrinthZoom(prev, -1))}
              aria-label="Alejar zoom"
              data-testid="zoom-out-btn"
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              title="Alejar zoom (−)"
            >
              <ZoomOut className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(LABYRINTH_ZOOM_DEFAULT)}
              data-testid="zoom-reset-btn"
              className="px-1.5 py-1 rounded hover:bg-slate-800 font-mono text-[11px] tabular-nums text-slate-200 cursor-pointer whitespace-nowrap"
              title="Restablecer zoom al 100% (tecla 0)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              disabled={zoomLevel >= LABYRINTH_ZOOM_MAX}
              onClick={() => setZoomLevel((prev) => stepLabyrinthZoom(prev, 1))}
              aria-label="Acercar zoom"
              data-testid="zoom-in-btn"
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              title="Acercar zoom (+)"
            >
              <ZoomIn className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            </button>
          </div>

          {/* Multi-step Resolution Control: Baja -> Media -> Alta -> Ultra */}
          <div
            role="group"
            aria-label="Resolución del laberinto"
            className="flex items-center gap-0.5 px-1 border-x border-slate-800"
          >
            <button
              type="button"
              disabled={resolutionLevel === 'low'}
              onClick={() => setResolutionLevel((prev) => stepLabyrinthResolution(prev, -1))}
              aria-label="Reducir resolución del laberinto"
              data-testid="decrease-resolution-btn"
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              title="Reducir resolución"
            >
              <Minus className="w-3 h-3 text-slate-300" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() =>
                setResolutionLevel((prev) =>
                  prev === 'ultra' ? 'low' : stepLabyrinthResolution(prev, 1)
                )
              }
              data-testid="resolution-label-btn"
              className="px-1.5 py-1 rounded hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Cambiar resolución del laberinto (Baja / Media / Alta / Ultra)"
            >
              <Monitor className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span className="font-mono">{resolutionPreset.label}</span>
            </button>
            <button
              type="button"
              disabled={resolutionLevel === 'ultra'}
              onClick={() => setResolutionLevel((prev) => stepLabyrinthResolution(prev, 1))}
              aria-label="Aumentar resolución del laberinto"
              data-testid="increase-resolution-btn"
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              title="Aumentar resolución"
            >
              <Plus className="w-3 h-3 text-amber-400" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMuted((prev) => !prev)}
            aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
            className="p-1 rounded hover:bg-slate-800 cursor-pointer"
            title="Sonido (tecla M)"
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          <button
            type="button"
            data-testid="labyrinth-controls-help-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              setShowControlsHint((prev) => !prev);
            }}
            aria-label="Mostrar controles del laberinto"
            className="p-1 rounded hover:bg-slate-800 cursor-pointer text-slate-300 hover:text-white"
            title="Ver controles"
          >
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              aria-label={isExpanded ? 'Salir de pantalla completa 3D' : 'Expandir laberinto 3D'}
              className="px-2 py-1 rounded hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title={isExpanded ? 'Volver a vista de 3 paneles' : 'Expandir laberinto 3D'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
                  <span>Paneles</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
                  <span>Expandir</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <MotionSensorModal
        open={sensorModalOpen}
        motionActive={motionSensorActive}
        sensorNotice={
          diagToast && /giroscopio|sensor/i.test(diagToast) ? diagToast : null
        }
        cameraMode={cameraMode}
        settings={motionSettings}
        onChangeSettings={handleChangeMotionSettings}
        onResetSettings={handleResetMotionSettings}
        onToggleMotion={handleToggleMotionSensor}
        onCalibrateNeutral={handleRecalibrateMotionSensor}
        getLiveReading={getLiveMotionReading}
        onClose={() => setSensorModalOpen(false)}
      />
    </div>
  );
};
