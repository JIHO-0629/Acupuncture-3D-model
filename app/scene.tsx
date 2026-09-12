import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createExplosionLayout } from "./explosion-layout";
import { decodeModelResponse } from "./model-download";
import { PointerTap } from "./pointer-tap";
import { SYSTEMS, type Atlas, type NeedleHit, type NeedleReport, type SceneState } from "./anatomy";
import { GB_POINTS, needleProfile, type ProjectionMode } from "./gb-points";
interface Props {
  atlas: Atlas;
  state: SceneState;
  onSelect: (id: string) => void;
  onPointSelect?: (code: string) => void;
  onProgress: (n: number) => void;
  onError: (s: string) => void;
  onNeedleReport?: (report: NeedleReport) => void;
}
export default function AnatomyScene({
  atlas,
  state,
  onSelect,
  onPointSelect,
  onProgress,
  onError,
  onNeedleReport,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(state),
    select = useRef(onSelect),
    pointSelect = useRef(onPointSelect),
    needleReport = useRef(onNeedleReport);
  latest.current = state;
  select.current = onSelect;
  pointSelect.current = onPointSelect;
  needleReport.current = onNeedleReport;
  useEffect(() => {
    const el = host.current!;
    let disposed = false,
      frame = 0,
      dirty = true,
      ready = false,
      lastView = "",
      lastReset = -1,
      lastIsolate = "",
      lastRegion = "",
      layoutKey = "",
      amount = 0;
    let lastState: SceneState | null = null,
      lastNeedle = "",
      lastAcupuncture = "";
    const abort = new AbortController();
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      onError(
        "This browser could not start the 3D viewer. Please try a browser with WebGL enabled.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 2));
    renderer.setClearColor("#f2f3f3");
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive human anatomy. Drag to orbit, right-drag to pan, zoom toward the pointer, and tap a structure to inspect it.",
    );
    const scene = new T.Scene(),
      camera = new T.PerspectiveCamera(34, 1, 0.005, 100),
      controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(1.4, 1.05, 3.6);
    controls.target.set(0, 0.85, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.zoomToCursor = true;
    controls.zoomSpeed = 0.8;
    // A trackpad streams many small deltas while a mouse sends a few large notches, so one
    // zoom speed cannot suit both. Detect the notch and raise the speed only for that,
    // in the capture phase so the value is set before OrbitControls reads it.
    const TRACKPAD_ZOOM = 0.8, WHEEL_ZOOM = 1.8;
    const matchZoomToDevice = (event: WheelEvent) => {
      const notched = event.deltaMode !== 0 || Math.abs(event.deltaY) >= 50;
      controls.zoomSpeed = notched ? WHEEL_ZOOM : TRACKPAD_ZOOM;
    };
    renderer.domElement.addEventListener("wheel", matchZoomToDevice, { capture: true, passive: true });
    controls.panSpeed = 0.85;
    controls.rotateSpeed = 0.7;
    controls.minDistance = 0.015;
    controls.maxDistance = 40;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    const cameraGoalPosition = camera.position.clone(),
      cameraGoalTarget = controls.target.clone();
    let cameraTransitioning = false;
    const moveCamera = (target: T.Vector3, position: T.Vector3, instant = false) => {
      cameraGoalTarget.copy(target);
      cameraGoalPosition.copy(position);
      if (instant) {
        controls.target.copy(target);
        camera.position.copy(position);
        cameraTransitioning = false;
      } else cameraTransitioning = true;
      dirty = true;
    };
    controls.addEventListener("change", () => {
      dirty = true;
    });
    controls.addEventListener("start", () => {
      cameraTransitioning = false;
    });
    const pmrem = new T.PMREMGenerator(renderer),
      room = new RoomEnvironment(),
      env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();
    scene.add(new T.HemisphereLight(0xffffff, 0xa7acb2, 1.05));
    const key = new T.DirectionalLight(0xfffaf4, 2.3);
    key.position.set(-2, 4, 3);
    scene.add(key);
    const rim = new T.DirectionalLight(0xe9f0ff, 1.8);
    rim.position.set(2, 2, -3);
    scene.add(rim);
    const ground = new T.Mesh(
      new T.CircleGeometry(30, 96),
      new T.MeshStandardMaterial({ color: 0xd5d9dc, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.019;
    scene.add(ground);
    const platform = new T.Mesh(
      new T.CylinderGeometry(0.68, 0.7, 0.028, 100),
      new T.MeshStandardMaterial({ color: 0xeeeeec, metalness: 0.12, roughness: 0.67 }),
    );
    platform.position.y = -0.016;
    scene.add(platform);
    const ring = new T.Mesh(
      new T.RingGeometry(0.63, 0.632, 128),
      new T.MeshBasicMaterial({
        color: 0x8c969f,
        transparent: true,
        opacity: 0.4,
        side: T.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.001;
    scene.add(ring);
    const innerRing = new T.Mesh(
      new T.RingGeometry(0.55, 0.551, 128),
      new T.MeshBasicMaterial({
        color: 0xa4aeb8,
        transparent: true,
        opacity: 0.16,
        side: T.DoubleSide,
      }),
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.001;
    scene.add(innerRing);
    const width = T.MathUtils.ceilPowerOfTwo(atlas.parts.length),
      data = new Float32Array(width * 4),
      partTexture = new T.DataTexture(data, width, 1, T.RGBAFormat, T.FloatType);
    partTexture.needsUpdate = true;
    const selectedData = new Uint8Array(width * 4),
      selectionTexture = new T.DataTexture(selectedData, width, 1);
    selectionTexture.needsUpdate = true;
    const pickerMaterial = new T.MeshBasicMaterial({ side: T.DoubleSide }),
      materials: T.Material[] = [],
      geometries: T.BufferGeometry[] = [],
      pickers: (T.Mesh | undefined)[] = [],
      centers = atlas.parts.map((p) =>
        new T.Vector3()
          .fromArray(p.bounds[0])
          .add(new T.Vector3().fromArray(p.bounds[1]))
          .multiplyScalar(0.5),
      );
    const offsets: T.Vector3[] = [],
      bounds = atlas.parts.map(
        (p) =>
          new T.Box3(
            new T.Vector3().fromArray(p.bounds[0]),
            new T.Vector3().fromArray(p.bounds[1]),
          ),
      );
    let packingWidth = 1,
      packingHeight = 1;
    const markerPositions = new Float32Array(atlas.parts.length * 3),
      markerGeometry = new T.BufferGeometry();
    markerGeometry.setAttribute("position", new T.BufferAttribute(markerPositions, 3));
    const markerMaterial = new T.PointsMaterial({
      color: 0x64748b,
      size: 5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.72,
      depthTest: false,
    });
    markerMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;",
      );
    };
    const markers = new T.Points(markerGeometry, markerMaterial);
    markers.frustumCulled = false;
    markers.renderOrder = 10;
    markers.visible = false;
    scene.add(markers);
    const hover = document.createElement("div");
    hover.className = "part-hover";
    hover.setAttribute("role", "tooltip");
    hover.hidden = true;
    el.appendChild(hover);
    type Target = {
      index: number;
      x: number;
      y: number;
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
    let targets: Target[] = [];
    const projected = new T.Vector3();
    const findTarget = (x: number, y: number, radius: number) => {
      let best = -1,
        score = Infinity;
      for (const t of targets) {
        const dx = Math.max(t.left - x, 0, x - t.right),
          dy = Math.max(t.top - y, 0, y - t.bottom),
          distance = Math.hypot(dx, dy);
        if (distance > radius) continue;
        const candidate = distance + Math.hypot(t.x - x, t.y - y) * 0.025;
        if (candidate < score) {
          score = candidate;
          best = t.index;
        }
      }
      return best;
    };
    const materialFor = (system: string) => {
      const isSurface = system === "integumentary";
      const m = new T.MeshStandardMaterial({
        color: isSurface ? "#c79d82" : (SYSTEMS.find((s) => s.id === system)?.color ?? "#aebbb8"),
        metalness: isSurface ? 0 : 0.08,
        roughness: isSurface ? 0.82 : 0.53,
        side: T.DoubleSide,
        transparent: false,
        opacity: 1,
        depthWrite: true,
      });
      m.customProgramCacheKey = () => `atlas-${isSurface ? "surface-toe-cut-v2" : "internal"}`;
      m.onBeforeCompile = (shader) => {
        shader.uniforms.partState = { value: partTexture };
        shader.uniforms.selectionState = { value: selectionTexture };
        shader.uniforms.stateWidth = { value: width };
        shader.vertexShader =
          "attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected; varying vec3 atlasPosition;\n" +
          shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\natlasPosition = position; vec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partSelected = texture2D(selectionState, stateUv).r;",
        );
      shader.fragmentShader =
          "varying float partVisible; varying float partSelected; varying vec3 atlasPosition;\n" +
          shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <clipping_planes_fragment>",
          `#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;${isSurface ? "\nfloat toeX=abs(atlasPosition.x); float toeZ=atlasPosition.z;\nbool gap12=toeZ>0.095&&toeZ<0.142&&abs(toeX-(0.112+0.46*(toeZ-0.095)))<0.00072;\nbool gap23=toeZ>0.090&&toeZ<0.132&&abs(toeX-(0.128+0.55*(toeZ-0.090)))<0.00068;\nbool gap34=toeZ>0.080&&toeZ<0.119&&abs(toeX-(0.143+0.48*(toeZ-0.080)))<0.00065;\nbool gap45=toeZ>0.065&&toeZ<0.101&&abs(toeX-(0.153+0.55*(toeZ-0.065)))<0.00062;\nif(atlasPosition.y<0.085&&(gap12||gap23||gap34||gap45)) discard;" : ""}`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.85, 0.78), partSelected * 0.75);",
        );
      };
      materials.push(m);
      return m;
    };
    const mats = new Map(SYSTEMS.map((s) => [s.id, materialFor(s.id)]));
    let loaded = 0;
    const loadChunk = async (ci: number) => {
      const chunk = atlas.chunks[ci],
        compressed = !!chunk.gzip && typeof DecompressionStream !== "undefined";
      const response = await fetch(compressed ? chunk.gzip! : chunk.url, { signal: abort.signal });
      const buffer = await decodeModelResponse(response, chunk.bytes, compressed);
      if (disposed) return;
      const groups = new Map<string, T.BufferGeometry[]>();
      atlas.parts.forEach((p, i) => {
        if (p.chunk !== ci) return;
        const g = new T.BufferGeometry();
        g.setAttribute(
          "position",
          new T.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3),
        );
        // GPU normalized signed-short normals keep the complete atlas compact in memory.
        g.setAttribute(
          "normal",
          new T.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true),
        );
        g.setIndex(new T.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1));
        g.boundingBox = bounds[i].clone();
        g.computeBoundingSphere();
        const pick = new T.Mesh(g, pickerMaterial);
        pick.matrixAutoUpdate = false;
        pickers[i] = pick;
        geometries.push(g);
        g.setAttribute(
          "partIndex",
          new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i), 1),
        );
        const list = groups.get(p.system) ?? [];
        list.push(g);
        groups.set(p.system, list);
      });
      groups.forEach((gs, system) => {
        const geometry = mergeGeometries(gs, false);
        if (!geometry) throw new Error("Could not assemble anatomy geometry.");
        geometries.push(geometry);
        const mesh = new T.Mesh(geometry, mats.get(system as never));
        mesh.frustumCulled = false;
        scene.add(mesh);
      });
      lastState = null;
      loaded++;
      onProgress(Math.round((loaded / atlas.chunks.length) * 100));
      dirty = true;
    };
    (async () => {
      try {
        let cursor = 0;
        await Promise.all(
          Array.from({ length: 3 }, async () => {
            while (cursor < atlas.chunks.length) {
              const i = cursor++;
              await loadChunk(i);
            }
          }),
        );
        if (!disposed) {
          buildToePresentation();
          ready = true;
          lastNeedle = "";
          lastAcupuncture = "";
          dirty = true;
        }
      } catch (e) {
        if (!disposed) onError(e instanceof Error ? e.message : "Could not load the anatomy.");
      }
    })();
    const fit = (view: string, extent = 0) => {
      if (latest.current.regionFocus) return;
      const aspect = camera.aspect,
        mobile = el.clientWidth < 768,
        normalDistance = mobile
          ? Math.max(
              4.5,
              (1.8 * el.clientHeight) /
                Math.max(160, el.clientHeight - 350) /
                (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2))),
            )
          : 4;
      const reservedHeight = mobile ? 350 : 270;
      const availableAspect = Math.max(
        0.35,
        (el.clientWidth - (mobile ? 40 : 340)) / Math.max(160, el.clientHeight - reservedHeight),
      );
      const atlasDistance =
        (Math.max(packingHeight, packingWidth / availableAspect) /
          (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
        (el.clientHeight / Math.max(160, el.clientHeight - reservedHeight)) *
        1.08;
      const distance = T.MathUtils.lerp(normalDistance, Math.max(0.2, atlasDistance), extent);
      if (extent > 0.8) view = "front";
      const direction =
        view === "front"
          ? new T.Vector3(0, 0.02, 1)
          : view === "back"
            ? new T.Vector3(0, 0.02, -1)
            : view === "side"
              ? new T.Vector3(1, 0.02, 0)
              : new T.Vector3(0.35, 0.06, 1).normalize();
      const target = new T.Vector3(
          extent > 0.1 && el.clientWidth > 767 ? -packingWidth * 0.12 : 0,
          extent > 0.1 || mobile ? 0.85 : 0.68,
          0,
        ),
        position = target.clone().addScaledVector(direction, distance);
      moveCamera(target, position);
    };
    const resize = () => {
      layoutKey = "";
      lastState = null;
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, el.clientWidth < 768 || el.clientHeight < 600 ? 1.5 : 2),
      );
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
      fit(latest.current.view, amount);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    const raycaster = new T.Raycaster(),
      pointer = new T.Vector2(),
      tap = new PointerTap(),
      worldBox = new T.Box3(),
      hitPoint = new T.Vector3();
    const acupointGroup = new T.Group(),
      lineGroup = new T.Group(),
      pointGeometry = new T.SphereGeometry(0.0048, 16, 12),
      pointCoreGeometry = new T.SphereGeometry(0.0029, 16, 12),
      pointMaterial = new T.MeshBasicMaterial({ color: 0x152f3a, depthTest: false }),
      selectedPointMaterial = new T.MeshBasicMaterial({ color: 0x102c36, depthTest: false }),
      pointCoreMaterial = new T.MeshBasicMaterial({ color: 0xff2f78, depthTest: false }),
      selectedPointCoreMaterial = new T.MeshBasicMaterial({ color: 0x2cf3d1, depthTest: false });
    type PointObject = {
      code: string;
      side: "right" | "left";
      marker: T.Mesh;
      core: T.Mesh;
      label: T.Sprite;
      texture: T.CanvasTexture;
      surface: T.Vector3;
      normal: T.Vector3;
    };
    const pointObjects: PointObject[] = [];
    const makePointLabel = (code: string, side: "right" | "left") => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 72;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "rgba(7,24,27,.9)";
      context.roundRect(2, 2, 252, 68, 18);
      context.fill();
      context.font = "600 30px system-ui";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#eafff8";
      context.fillText(`${code} · ${side === "right" ? "R" : "L"}`, 128, 37);
      const texture = new T.CanvasTexture(canvas),
        material = new T.SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
        label = new T.Sprite(material);
      label.scale.set(0.025, 0.007, 1);
      label.renderOrder = 62;
      label.visible = false;
      return { label, texture };
    };
    for (const point of GB_POINTS)
      for (const side of ["right", "left"] as const) {
        const marker = new T.Mesh(pointGeometry, pointMaterial),
          core = new T.Mesh(pointCoreGeometry, pointCoreMaterial),
          made = makePointLabel(point.code, side);
        marker.userData = { acupointCode: point.code, side };
        marker.renderOrder = 60;
        core.renderOrder = 61;
        marker.visible = core.visible = false;
        pointObjects.push({
          code: point.code,
          side,
          marker,
          core,
          label: made.label,
          texture: made.texture,
          surface: new T.Vector3(),
          normal: new T.Vector3(),
        });
        acupointGroup.add(marker, core, made.label);
      }
    scene.add(lineGroup, acupointGroup);
    const needleGeometry = new T.CylinderGeometry(0.00065, 0.00065, 1, 10),
      needleMaterial = new T.MeshStandardMaterial({
        color: 0xdbe5e8,
        metalness: 0.92,
        roughness: 0.16,
        depthTest: true,
      }),
      needle = new T.Mesh(needleGeometry, needleMaterial);
    const handleGeometry = new T.CylinderGeometry(0.0016, 0.0016, 1, 12),
      handleMaterial = new T.MeshStandardMaterial({
        color: 0x56767b,
        metalness: 0.58,
        roughness: 0.28,
        depthTest: true,
      }),
      needleHandle = new T.Mesh(handleGeometry, handleMaterial);
    needle.visible = needleHandle.visible = false;
    scene.add(needle, needleHandle);
    const projectionDirection = (seed: T.Vector3, mode: ProjectionMode, side: "right" | "left") => {
      if (mode === "anterior") return new T.Vector3(0, 0, 1);
      if (mode === "posterior") return new T.Vector3(0, 0, -1);
      // The atlas foot is planted on the horizontal plane, so its local dorsal axis is +Y.
      // Keeping this ray strictly dorsal prevents an oblique ray from drifting into an
      // adjacent metatarsal or toe before it reaches the intended skin region.
      if (mode === "dorsal-foot") return new T.Vector3(0, 1, 0);
      if (mode === "lateral") return new T.Vector3(side === "right" ? -1 : 1, 0, 0);
      return seed
        .clone()
        .sub(new T.Vector3(0, 1.59, 0))
        .normalize();
    };
    const projectToSkin = (seed: T.Vector3, mode: ProjectionMode, side: "right" | "left") => {
      const outward = projectionDirection(seed, mode, side),
        origin = seed.clone().addScaledVector(outward, 0.24),
        inward = outward.clone().negate();
      raycaster.set(origin, inward);
      let best: T.Intersection | undefined,
        bestSeedDistance = Infinity;
      pickers.forEach((mesh, i) => {
        if (!mesh || atlas.parts[i].system !== "integumentary") return;
        for (const hit of raycaster.intersectObject(mesh, false)) {
          const distance = hit.point.distanceTo(seed);
          if (distance < bestSeedDistance) {
            best = hit;
            bestSeedDistance = distance;
          }
        }
      });
      const point = best?.point.clone() ?? seed.clone(),
        normal =
          best?.face?.normal.clone().transformDirection(best.object.matrixWorld).normalize() ??
          outward;
      if (normal.dot(outward) < 0) normal.negate();
      return { point, normal };
    };
    // Cosmetic surface refinement only. Toe dimensions and nail placement are derived
    // from the bundled BodyParts3D phalanx vertices, not hand-placed points.
    const nailShape = new T.Shape();
    nailShape.moveTo(-0.72, -1);
    nailShape.lineTo(0.72, -1);
    nailShape.quadraticCurveTo(1, -1, 1, -0.7);
    nailShape.lineTo(1, 0.68);
    nailShape.quadraticCurveTo(1, 1, 0.68, 1);
    nailShape.lineTo(-0.68, 1);
    nailShape.quadraticCurveTo(-1, 1, -1, 0.68);
    nailShape.lineTo(-1, -0.7);
    nailShape.quadraticCurveTo(-1, -1, -0.72, -1);
    const toePresentation = new T.Group(),
      toeNailGeometry = new T.ShapeGeometry(nailShape, 8),
      toeSkinMaterial = new T.MeshStandardMaterial({
        color: 0xc79d82,
        roughness: 0.86,
        metalness: 0,
      }),
      toeNailMaterial = new T.MeshStandardMaterial({
        color: 0xe0aaa5,
        emissive: 0x2a0c0b,
        roughness: 0.38,
        metalness: 0,
        side: T.DoubleSide,
        depthTest: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
      toeSeamMaterial = new T.MeshBasicMaterial({
        color: 0x765c4f,
        transparent: true,
        opacity: 0.26,
        depthTest: false,
      });
    const toeNames = ["big", "second", "third", "fourth", "little"] as const;
    type ToeName = (typeof toeNames)[number];
    type ToeFrame = { longitudinal: T.Vector3; lateral: T.Vector3; dorsal: T.Vector3 };
    const partNamed = (name: string) =>
      atlas.parts.find((part) => part.name.toLowerCase() === name.toLowerCase());
    const partCenter = (part: Atlas["parts"][number]) =>
      new T.Box3(
        new T.Vector3().fromArray(part.bounds[0]),
        new T.Vector3().fromArray(part.bounds[1]),
      ).getCenter(new T.Vector3());
    const toeFrame = (side: "right" | "left"): ToeFrame => {
      const bigProx = partNamed(`proximal phalanx of ${side} big toe`)!,
        littleProx = partNamed(`proximal phalanx of ${side} little toe`)!,
        bigDist = partNamed(`distal phalanx of ${side} big toe`)!,
        littleDist = partNamed(`distal phalanx of ${side} little toe`)!;
      const longitudinal = partCenter(bigDist)
          .sub(partCenter(bigProx))
          .add(partCenter(littleDist).sub(partCenter(littleProx)))
          .normalize(),
        across = partCenter(littleProx).sub(partCenter(bigProx)).normalize(),
        dorsal = longitudinal.clone().cross(across).normalize();
      if (dorsal.y < 0) dorsal.negate();
      return { longitudinal, lateral: dorsal.clone().cross(longitudinal).normalize(), dorsal };
    };
    const partMeasures = (part: Atlas["parts"][number], frame: ToeFrame) => {
      const geometry = pickers[atlas.parts.indexOf(part)]?.geometry,
        position = geometry?.getAttribute("position"),
        center = partCenter(part),
        sample = new T.Vector3(),
        delta = new T.Vector3();
      let halfLength = 0,
        halfWidth = 0,
        halfHeight = 0;
      if (position)
        for (let i = 0; i < position.count; i++) {
          sample.fromBufferAttribute(position, i);
          delta.copy(sample).sub(center);
          halfLength = Math.max(halfLength, Math.abs(delta.dot(frame.longitudinal)));
          halfWidth = Math.max(halfWidth, Math.abs(delta.dot(frame.lateral)));
          halfHeight = Math.max(halfHeight, Math.abs(delta.dot(frame.dorsal)));
        }
      return {
        center,
        halfLength: Math.max(0.004, halfLength),
        halfWidth: Math.max(0.003, halfWidth),
        halfHeight: Math.max(0.003, halfHeight),
      };
    };
    function buildToePresentation() {
      toePresentation.clear();
      const surfaceMeshes = pickers.filter(
          (picker, index): picker is T.Mesh => !!picker && atlas.parts[index].system === "integumentary",
        ),
        joinRay = new T.Raycaster();
      for (const side of ["right", "left"] as const) {
        const frame = toeFrame(side),
          basis = new T.Matrix4().makeBasis(frame.lateral, frame.longitudinal, frame.dorsal),
          rotation = new T.Quaternion().setFromRotationMatrix(basis);
        for (const toeName of toeNames) {
          const labels =
              toeName === "big" ? ["proximal", "distal"] : ["proximal", "middle", "distal"],
            parts = labels
              .map((label) => partNamed(`${label} phalanx of ${side} ${toeName} toe`))
              .filter((part): part is Atlas["parts"][number] => !!part),
            measures = parts.map((part) => partMeasures(part, frame));
          if (measures.length < 2) continue;
          const first = measures[0],
            last = measures[measures.length - 1],
            root = first.center
              .clone()
              .addScaledVector(frame.longitudinal, -first.halfLength - 0.003),
            tip = last.center.clone().addScaledVector(frame.longitudinal, last.halfLength + 0.003),
            nodes = [root, ...measures.map((m) => m.center.clone()), tip],
            curve = new T.CatmullRomCurve3(nodes, false, "centripetal", 0.2),
            ringCount = 28,
            radialCount = 24,
            positions: number[] = [],
            indices: number[] = [];
          const widths = [
              first.halfWidth + 0.0035,
              ...measures.map((m) => m.halfWidth + 0.0032),
              Math.max(0.0015, last.halfWidth * 0.34),
            ],
            heights = [
              first.halfHeight + 0.004,
              ...measures.map((m) => m.halfHeight + 0.0045),
              Math.max(0.0018, last.halfHeight * 0.36),
            ];
          for (let ring = 0; ring < ringCount; ring++) {
            const t = ring / (ringCount - 1),
              scaled = t * (nodes.length - 1),
              segment = Math.min(nodes.length - 2, Math.floor(scaled)),
              mix = scaled - segment,
              center = curve.getPoint(t),
              width = T.MathUtils.lerp(widths[segment], widths[segment + 1], mix),
              height = T.MathUtils.lerp(heights[segment], heights[segment + 1], mix),
              distalRound = t > 0.84 ? Math.sqrt(Math.max(0, (1 - t) / 0.16)) : 1,
              jointSoftening = 1 - 0.055 * Math.exp(-Math.pow((mix - 0.5) / 0.18, 2));
            if (t < 0.3) {
              joinRay.set(
                center.clone().addScaledVector(frame.dorsal, 0.08),
                frame.dorsal.clone().negate(),
              );
              const surfaceHit = joinRay.intersectObjects(surfaceMeshes, false)[0];
              if (surfaceHit) {
                const currentTop = center.clone().addScaledVector(frame.dorsal, height * 0.82),
                  correction = surfaceHit.point.clone().sub(currentTop).dot(frame.dorsal),
                  blend = 1 - T.MathUtils.smoothstep(t, 0.02, 0.3);
                center.addScaledVector(frame.dorsal, correction * blend);
              }
            }
            for (let radial = 0; radial < radialCount; radial++) {
              const angle = (radial / radialCount) * Math.PI * 2,
                sideFactor = Math.cos(angle),
                vertical = Math.sin(angle),
                verticalRadius = height * (vertical > 0 ? 0.82 : 1.05),
                point = center
                  .clone()
                  .addScaledVector(frame.lateral, sideFactor * width * distalRound * jointSoftening)
                  .addScaledVector(frame.dorsal, vertical * verticalRadius * distalRound);
              positions.push(point.x, point.y, point.z);
            }
          }
          for (let ring = 0; ring < ringCount - 1; ring++)
            for (let radial = 0; radial < radialCount; radial++) {
              const next = (radial + 1) % radialCount,
                a = ring * radialCount + radial,
                b = ring * radialCount + next,
                c = (ring + 1) * radialCount + radial,
                d = (ring + 1) * radialCount + next;
              indices.push(a, c, b, b, c, d);
            }
          const geometry = new T.BufferGeometry();
          geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
          geometry.setIndex(indices);
          geometry.computeVertexNormals();
          geometry.computeBoundingSphere();
          const skin = new T.Mesh(geometry, toeSkinMaterial);
          skin.userData.toeSide = side;
          skin.renderOrder = 42;
          // Preserve the original BodyParts3D skin silhouette. The generated envelope is
          // retained as a vertex-derived diagnostic but is not rendered over the source skin.
          const nailGeometry = toeNailGeometry.clone(),
            nailPosition = nailGeometry.getAttribute("position");
          for (let i = 0; i < nailPosition.count; i++) {
            const x = nailPosition.getX(i);
            nailPosition.setZ(i, 0.00045 * (1 - x * x));
          }
          nailGeometry.computeVertexNormals();
          const nail = new T.Mesh(nailGeometry, toeNailMaterial),
            nailLength = Math.min(
              toeName === "big" ? 0.015 : 0.01,
              (last.halfLength + 0.003) * 1.1,
            ),
            nailWidth = (last.halfWidth + 0.002) * (toeName === "big" ? 0.78 : 0.72),
            nailCenter = last.center
              .clone()
              .addScaledVector(frame.longitudinal, last.halfLength * 0.36)
              .addScaledVector(frame.dorsal, last.halfHeight + 0.0042);
          nail.position.copy(nailCenter);
          nail.quaternion.copy(rotation);
          nail.scale.set(nailWidth, nailLength * 0.5, 1);
          nail.userData.toeSide = side;
          nail.renderOrder = 43;
          toePresentation.add(nail);
        }
        for (let gap = 0; gap < toeNames.length - 1; gap++) {
          const medial = toeNames[gap],
            lateralToe = toeNames[gap + 1],
            medialProx = partNamed(`proximal phalanx of ${side} ${medial} toe`),
            lateralProx = partNamed(`proximal phalanx of ${side} ${lateralToe} toe`),
            medialDist = partNamed(`distal phalanx of ${side} ${medial} toe`),
            lateralDist = partNamed(`distal phalanx of ${side} ${lateralToe} toe`);
          if (!medialProx || !lateralProx || !medialDist || !lateralDist) continue;
          const mp = partMeasures(medialProx, frame),
            lp = partMeasures(lateralProx, frame),
            md = partMeasures(medialDist, frame),
            ld = partMeasures(lateralDist, frame),
            start = mp.center
              .clone()
              .lerp(lp.center, 0.5)
              .addScaledVector(frame.longitudinal, Math.min(mp.halfLength, lp.halfLength) * 0.1)
              .addScaledVector(frame.dorsal, Math.max(mp.halfHeight, lp.halfHeight) + 0.006),
            end = md.center
              .clone()
              .lerp(ld.center, 0.5)
              .addScaledVector(frame.longitudinal, Math.min(md.halfLength, ld.halfLength) * 0.76)
              .addScaledVector(frame.dorsal, Math.max(md.halfHeight, ld.halfHeight) + 0.006),
            seamCurve = new T.QuadraticBezierCurve3(
              start,
              start.clone().lerp(end, 0.5).addScaledVector(frame.dorsal, 0.001),
              end,
            ),
            seam = new T.Mesh(new T.TubeGeometry(seamCurve, 24, 0.00042, 5, false), toeSeamMaterial);
          seam.userData.toeSide = side;
          seam.renderOrder = 44;
          toePresentation.add(seam);
        }
      }
    }
    toePresentation.visible = false;
    scene.add(toePresentation);
    const updateAcupuncture = () => {
      const config = latest.current.acupuncture;
      lineGroup.traverse((o) => {
        if (o instanceof T.Line) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      });
      lineGroup.clear();
      const projectedBySide: { right: T.Vector3[]; left: T.Vector3[] } = { right: [], left: [] };
      for (const definition of GB_POINTS) {
        for (const side of ["right", "left"] as const) {
          const object = pointObjects.find(
            (item) => item.code === definition.code && item.side === side,
          )!;
          const source = definition.seed,
            seed = new T.Vector3(side === "right" ? source[0] : -source[0], source[1], source[2]),
            projected = projectToSkin(seed, definition.projection, side);
          object.surface.copy(projected.point);
          object.normal.copy(projected.normal);
          const markerPosition = projected.point.clone().addScaledVector(projected.normal, 0.0026);
          object.marker.position.copy(markerPosition);
          object.core.position.copy(markerPosition).addScaledVector(projected.normal, 0.0012);
          object.label.position
            .copy(projected.point)
            .addScaledVector(projected.normal, 0.016)
            .add(new T.Vector3(0, 0.009, 0));
          const selected = config?.selectedCode === definition.code,
            visible = !!config?.visible && (config.showAll || selected);
          object.marker.visible = object.core.visible = visible;
          object.label.visible = visible && selected && side === "right";
          object.marker.material = selected ? selectedPointMaterial : pointMaterial;
          object.core.material = selected ? selectedPointCoreMaterial : pointCoreMaterial;
          object.marker.scale.setScalar(selected ? 1.08 : 1);
          object.core.scale.setScalar(selected ? 1.08 : 1);
          projectedBySide[side].push(object.marker.position.clone());
        }
      }
      const addSurfaceGuide = (
        seeds: [number, number, number][],
        mode: ProjectionMode,
        color: number,
        opacity: number,
      ) => {
        const points = seeds.map((seed) => {
          const vector = new T.Vector3(...seed),
            side = vector.x < 0 ? "right" : "left";
          const projected = projectToSkin(vector, mode, side);
          return projected.point.addScaledVector(projected.normal, 0.0012);
        });
        const curve = new T.CatmullRomCurve3(points, false, "centripetal", 0.2),
          geometry = new T.BufferGeometry().setFromPoints(
            curve.getPoints(Math.max(32, seeds.length * 14)),
          ),
          material = new T.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            depthTest: false,
          });
        const line = new T.Line(geometry, material);
        line.renderOrder = 54;
        lineGroup.add(line);
      };
      if (config?.visible) {
        addSurfaceGuide(
          [
            [-0.082, 1.615, -0.012],
            [-0.078, 1.636, 0.016],
            [-0.064, 1.65, 0.047],
            [-0.04, 1.657, 0.068],
            [0, 1.66, 0.077],
            [0.04, 1.657, 0.068],
            [0.064, 1.65, 0.047],
            [0.078, 1.636, 0.016],
            [0.082, 1.615, -0.012],
          ],
          "head",
          0x6f675c,
          0.32,
        );
        for (const sign of [-1, 1])
          addSurfaceGuide(
            [
              [sign * 0.178, 1.335, 0.006],
              [sign * 0.175, 1.255, 0.01],
              [sign * 0.164, 1.155, 0.012],
              [sign * 0.153, 1.035, 0.014],
            ],
            "lateral",
            0x6f675c,
            0.22,
          );
        addSurfaceGuide(
          [
            [-0.153, 0.437, -0.05],
            [-0.125, 0.435, -0.073],
            [-0.096, 0.434, -0.081],
            [-0.068, 0.435, -0.074],
          ],
          "posterior",
          0x6f675c,
          0.24,
        );
        addSurfaceGuide(
          [
            [0.153, 0.437, -0.05],
            [0.125, 0.435, -0.073],
            [0.096, 0.434, -0.081],
            [0.068, 0.435, -0.074],
          ],
          "posterior",
          0x6f675c,
          0.24,
        );
      }
      if (config?.visible && config.showAll && config.showLines) {
        for (const side of ["right", "left"] as const) {
          const curve = new T.CatmullRomCurve3(projectedBySide[side], false, "centripetal", 0.28),
            geometry = new T.BufferGeometry().setFromPoints(curve.getPoints(220)),
            material = new T.LineBasicMaterial({
              color: 0xd6a44f,
              transparent: true,
              opacity: 0.34,
              depthTest: false,
            });
          const line = new T.Line(geometry, material);
          line.renderOrder = 55;
          lineGroup.add(line);
        }
      }
    };
    const updateNeedle = () => {
      const config = latest.current.needle,
        acupuncture = latest.current.acupuncture,
        code = acupuncture?.selectedCode as `GB${number}` | undefined,
        definition = code ? GB_POINTS.find((item) => item.code === code) : undefined;
      if (!config?.enabled || !ready || !definition) {
        needle.visible = needleHandle.visible = false;
        return;
      }
      const object = pointObjects.find((item) => item.code === code && item.side === "right");
      if (!object) return;
      const profile = needleProfile(definition.code),
        surface = object.surface,
        trajectory = object.normal.clone().negate(),
        probeDepth = profile.probeDepthMm / 1000;
      const shaftRadius = 0.00065,
        referenceAxis = Math.abs(trajectory.y) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0),
        across = new T.Vector3().crossVectors(trajectory, referenceAxis).normalize(),
        around = new T.Vector3().crossVectors(trajectory, across).normalize(),
        origins = [
          surface.clone().addScaledVector(trajectory, 0.00015),
          surface.clone().addScaledVector(across, shaftRadius).addScaledVector(trajectory, 0.00015),
          surface.clone().addScaledVector(across, -shaftRadius).addScaledVector(trajectory, 0.00015),
          surface.clone().addScaledVector(around, shaftRadius).addScaledVector(trajectory, 0.00015),
          surface.clone().addScaledVector(around, -shaftRadius).addScaledVector(trajectory, 0.00015),
        ],
        needleAxisRay = new T.Ray(origins[0], trajectory);
      const intersections: NeedleHit[] = [];
      pickers.forEach((mesh, i) => {
        const part = atlas.parts[i];
        if (!mesh || part.system === "integumentary") return;
        worldBox.copy(bounds[i]).expandByScalar(shaftRadius);
        const boxHit = needleAxisRay.intersectBox(worldBox, hitPoint);
        if (!boxHit || boxHit.distanceTo(origins[0]) > probeDepth + shaftRadius) return;
        let nearest = Infinity;
        for (const origin of origins) {
          raycaster.set(origin, trajectory);
          const hit = raycaster.intersectObject(mesh, false)[0];
          if (hit && hit.distance < nearest) nearest = hit.distance;
        }
        if (nearest <= probeDepth)
          intersections.push({
            id: part.id,
            name: part.name,
            system: part.system,
            distanceMm: Math.round(nearest * 10000) / 10,
          });
      });
      intersections.sort((a, b) => a.distanceMm - b.distanceMm);
      const dangerousSystems = (() => {
        if (profile.region === "face-scalp") return new Set(["skeletal", "sensory", "arterial", "venous", "nervous"]);
        if (profile.region === "neck") return new Set(["skeletal", "arterial", "venous", "nervous"]);
        if (profile.region === "thorax") return new Set(["skeletal", "respiratory", "arterial", "venous", "nervous"]);
        if (profile.region === "flank-abdomen") return new Set(["skeletal", "digestive", "urinary", "reproductive", "arterial", "venous"]);
        if (profile.region === "pelvis-gluteal") return new Set(["skeletal", "digestive", "urinary", "reproductive", "arterial", "venous", "nervous"]);
        return new Set(["skeletal", "arterial", "venous", "nervous"]);
      })();
      const boundary = intersections.find((hit) => dangerousSystems.has(hit.system)),
        usedConceptualBoundary = !boundary,
        boundaryMm = boundary?.distanceMm ?? profile.probeDepthMm,
        limitMm = Math.max(0, Math.round(boundaryMm * 0.9 * 10) / 10),
        depthMm = limitMm * Math.min(100, Math.max(0, config.depthRatio)) / 100,
        depth = depthMm / 1000,
        totalLength = Math.max(0.025, Math.min(0.075, probeDepth + 0.018)),
        handleLength = 0.018,
        midpoint = depth - totalLength / 2,
        handleMidpoint = depth - totalLength + handleLength / 2;
      needle.position.copy(surface).addScaledVector(trajectory, midpoint);
      needle.scale.set(1, totalLength, 1);
      needle.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), trajectory);
      needleHandle.position.copy(surface).addScaledVector(trajectory, handleMidpoint);
      needleHandle.scale.set(1, handleLength, 1);
      needleHandle.quaternion.copy(needle.quaternion);
      needle.visible = needleHandle.visible = true;
      const pathHits = intersections.filter((hit) => hit.distanceMm <= (limitMm ?? 0) + 0.2),
        hits = pathHits.filter((hit) => hit.distanceMm <= depthMm + 0.2);
      needleReport.current?.({
        code: definition.code,
        available: limitMm > 0,
        limitMm,
        boundaryMm,
        boundaryId: boundary?.id ?? null,
        boundaryLabel: profile.conceptualBoundary || usedConceptualBoundary ? profile.label : boundary.name,
        conceptual: profile.conceptualBoundary || usedConceptualBoundary,
        hits,
        pathHits,
        // Everything the shaft meets inside the probe, including what lies past the
        // boundary. The strata column draws those faded rather than hiding them.
        allHits: intersections,
      });
    };
    const down = (e: PointerEvent) => {
      hover.hidden = true;
      tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === "touch" ? 12 : 5);
    };
    const move = (e: PointerEvent) => {
      tap.move(e.pointerId, e.clientX, e.clientY);
      if (e.buttons || amount < 0.5 || e.pointerType === "touch") {
        hover.hidden = true;
        return;
      }
      const rect = el.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top,
        index = findTarget(x, y, 12);
      hover.hidden = index < 0;
      renderer.domElement.style.cursor = index < 0 ? "grab" : "pointer";
      if (index >= 0) {
        hover.textContent = atlas.parts[index].name;
        hover.style.left = `${Math.max(8, Math.min(x + 14, el.clientWidth - 260))}px`;
        hover.style.top = `${Math.max(8, Math.min(y + 18, el.clientHeight - 55))}px`;
      }
    };
    const cancel = (e: PointerEvent) => tap.cancel(e.pointerId);
    const up = (e: PointerEvent) => {
      const validTap = tap.up(e.pointerId, e.clientX, e.clientY);
      if (!validTap || !ready) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const pointHit = raycaster.intersectObjects(
        pointObjects.filter((item) => item.marker.visible).map((item) => item.marker),
        false,
      )[0];
      if (pointHit) {
        const code = pointHit.object.userData.acupointCode as string | undefined;
        if (code) {
          pointSelect.current?.(code);
          return;
        }
      }
      let nearest = Infinity,
        found = -1;
      const hasSolid = atlas.parts.some(
        (p, i) => p.system !== "integumentary" && data[i * 4 + 3] > 0.5,
      );
      pickers.forEach((mesh, i) => {
        if (
          !mesh ||
          data[i * 4 + 3] < 0.5 ||
          (hasSolid && atlas.parts[i].system === "integumentary")
        )
          return;
        worldBox.copy(bounds[i]).translate(mesh.position);
        if (!raycaster.ray.intersectBox(worldBox, hitPoint)) return;
        const hits = raycaster.intersectObject(mesh, false);
        if (hits[0] && hits[0].distance < nearest) {
          nearest = hits[0].distance;
          found = i;
        }
      });
      if (found < 0 && amount > 0.45)
        found = findTarget(
          e.clientX - rect.left,
          e.clientY - rect.top,
          e.pointerType === "touch" ? 24 : 16,
        );
      if (found >= 0) {
        hover.hidden = true;
        select.current(atlas.parts[found].id);
      }
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", cancel);
    const clock = new T.Clock();
    let lastExtent = -1;
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05),
        s = latest.current;
      const changed =
        lastState?.visible !== s.visible ||
        lastState?.selected !== s.selected ||
        lastState?.isolate !== s.isolate;
      const moving = Math.abs(amount - s.explode) > 0.0001;
      if (moving) {
        amount = T.MathUtils.damp(amount, s.explode, 8, dt);
        dirty = true;
      }
      if (changed || moving || lastExtent < 0) {
        const visible = new Set(s.visible),
          selection = new Set(s.selected);
        const visibleParts = atlas.parts.filter((p) =>
          s.isolate ? selection.has(p.id) : visible.has(p.system) || selection.has(p.id),
        );
        const nextLayoutKey =
          visibleParts.map((p) => p.id).join(",") + ":" + camera.aspect.toFixed(3);
        if (nextLayoutKey !== layoutKey) {
          const layout = createExplosionLayout(visibleParts, camera.aspect);
          packingWidth = layout.width;
          packingHeight = layout.height;
          atlas.parts.forEach((p, i) => {
            const cell = layout.cells.get(p.id);
            offsets[i] = cell ? new T.Vector3(cell.x, cell.y + 0.85, 0) : centers[i].clone();
          });
          layoutKey = nextLayoutKey;
          if (amount > 0.05 && !s.isolate) fit(s.view, Math.max(0, (amount - 0.3) / 0.7));
        }

        atlas.parts.forEach((p, i) => {
          const c = centers[i],
            destination = offsets[i];
          let dx = 0,
            dy = 0,
            dz = 0;
          if (amount <= 0.45) {
            const t = amount / 0.45;
            const group = SYSTEMS.findIndex((sys) => sys.id === p.system);
            const angle = (group / SYSTEMS.length) * Math.PI * 2;
            dx = Math.sin(angle) * t * 0.48;
            dy = (c.y - 0.85) * t * 0.28;
            dz = Math.cos(angle) * t * 0.48;
          } else {
            const t = (amount - 0.45) / 0.55,
              group = SYSTEMS.findIndex((sys) => sys.id === p.system),
              angle = (group / SYSTEMS.length) * Math.PI * 2;
            dx = T.MathUtils.lerp(Math.sin(angle) * 0.48, destination.x - c.x, t);
            dy = T.MathUtils.lerp((c.y - 0.85) * 0.28, destination.y - c.y, t);
            dz = T.MathUtils.lerp(Math.cos(angle) * 0.48, -c.z, t);
          }
          const selected = selection.has(p.id);
          data.set(
            [dx, dy, dz, (s.isolate ? selected : visible.has(p.system) || selected) ? 1 : 0],
            i * 4,
          );
          selectedData[i * 4] = selected ? 255 : 0;
          markerPositions.set(
            data[i * 4 + 3] > 0.5 ? [c.x + dx, c.y + dy, c.z + dz] : [10000, 10000, 10000],
            i * 3,
          );
          const mesh = pickers[i];
          if (mesh) {
            mesh.position.set(dx, dy, dz);
            mesh.updateMatrix();
            mesh.updateMatrixWorld(true);
          }
        });
        partTexture.needsUpdate = true;
        selectionTexture.needsUpdate = true;
        markerGeometry.attributes.position.needsUpdate = true;
        lastState = s;
        lastExtent = amount;
        dirty = true;
      }
      const acupunctureKey = JSON.stringify(s.acupuncture);
      if (acupunctureKey !== lastAcupuncture) {
        updateAcupuncture();
        lastAcupuncture = acupunctureKey;
        lastNeedle = "";
        dirty = true;
      }
      const needleKey = JSON.stringify([s.needle, s.acupuncture?.selectedCode]);
      if (needleKey !== lastNeedle) {
        updateNeedle();
        lastNeedle = needleKey;
        dirty = true;
      }
      if (s.view !== lastView || s.reset !== lastReset) {
        fit(s.view, amount);
        lastView = s.view;
        lastReset = s.reset;
      }
      if (moving && !s.isolate)
        fit(amount > 0.5 ? "front" : s.view, Math.max(0, (amount - 0.3) / 0.7));
      const isolateKey = s.isolate
        ? s.selected.join(",") + ":" + s.reset + ":" + s.inspectorOpen + ":" + camera.aspect
        : "";
      if (isolateKey !== lastIsolate || (s.isolate && moving)) {
        if (s.isolate) {
          const box = new T.Box3();
          atlas.parts.forEach((p, i) => {
            if (s.selected.includes(p.id))
              box.union(
                bounds[i]
                  .clone()
                  .translate(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])),
              );
          });
          if (!box.isEmpty()) {
            const center = box.getCenter(new T.Vector3()),
              size = box.getSize(new T.Vector3());
            const w = el.clientWidth,
              h = el.clientHeight,
              mobile = w < 768,
              landscape = w > h && h <= 600;
            let left = 20,
              right = w - 20,
              top = mobile ? 175 : 110,
              bottom = h - 170;
            if (s.inspectorOpen) {
              if (landscape) {
                right = w - 335;
                top = 100;
                bottom = h - 125;
              } else if (mobile) {
                const sheet = document.querySelector(".detail-sheet")?.getBoundingClientRect(),
                  header = document.querySelector(".identity")?.getBoundingClientRect();
                top = (header?.bottom ?? 94) + 16;
                bottom = (sheet?.top ?? h * 0.58 - 139) - 16;
              } else {
                right = w - 370;
                left = w > 1100 ? 285 : 25;
              }
            }
            const availableWidth = Math.max(150, right - left),
              availableHeight = Math.max(40, bottom - top);
            camera.setViewOffset(
              w,
              h,
              w / 2 - (left + right) / 2,
              h / 2 - (top + bottom) / 2,
              w,
              h,
            );
            const distance = Math.max(
              0.07,
              (Math.max(
                (size.y * h) / availableHeight,
                (size.x * w) / availableWidth / camera.aspect,
                size.z,
              ) /
                (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
                1.35,
            );
            controls.maxDistance = Math.max(40, distance * 2);
            moveCamera(
              center,
              center.clone().add(new T.Vector3(0.2, 0.1, 1).normalize().multiplyScalar(distance)),
            );
          }
        } else if (lastIsolate) {
          camera.clearViewOffset();
          fit(s.view, amount);
        }
        lastIsolate = isolateKey;
      }
      const regionKey = JSON.stringify(s.regionFocus);
      if (regionKey !== lastRegion) {
        if (s.regionFocus) {
          camera.clearViewOffset();
          const selectedSurface = s.acupuncture?.selectedCode
              ? pointObjects.find(
                  (point) => point.code === s.acupuncture?.selectedCode && point.side === "right",
                )?.surface
              : undefined,
            center = selectedSurface?.lengthSq()
              ? selectedSurface.clone()
              : new T.Vector3().fromArray(s.regionFocus.center),
            radius = Math.max(0.025, s.regionFocus.radiusMm / 1000),
            footView = s.regionFocus.viewHint === "dorsal-foot";
          camera.up.set(0, 1, 0);
          if (footView) center.x += 0.024;
          const distance =
              Math.max(
                0.11,
                (radius / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) * 2.2,
              ) * (footView ? 1.12 : 1),
            direction = (
              footView ? new T.Vector3(0.18, 0.92, 0.34) : new T.Vector3(-1, 0.08, 0.32)
            ).normalize();
          moveCamera(center, center.clone().addScaledVector(direction, distance));
        }
        lastRegion = regionKey;
      }
      controls.enableRotate = amount < 0.8;
      controls.mouseButtons.LEFT = amount < 0.8 ? T.MOUSE.ROTATE : T.MOUSE.PAN;
      controls.touches.ONE = amount < 0.8 ? T.TOUCH.ROTATE : T.TOUCH.PAN;
      ground.visible =
        platform.visible =
        ring.visible =
        innerRing.visible =
          amount < 0.5 && !s.isolate && !s.regionFocus;
      // Do not present the conceptual nail footprint as source anatomy. GB44 remains an
      // explicitly estimated landmark scaled from the bundled fourth-toe phalanges.
      toePresentation.visible = false;
      markers.visible = amount > 0.75;
      controls.autoRotate = s.rotate && !s.isolate && amount < 0.4;
      controls.autoRotateSpeed = 0.65;
      if (cameraTransitioning) {
        const smoothing = 1 - Math.exp(-9 * dt);
        camera.position.lerp(cameraGoalPosition, smoothing);
        controls.target.lerp(cameraGoalTarget, smoothing);
        if (
          camera.position.distanceToSquared(cameraGoalPosition) < 1e-7 &&
          controls.target.distanceToSquared(cameraGoalTarget) < 1e-7
        ) {
          camera.position.copy(cameraGoalPosition);
          controls.target.copy(cameraGoalTarget);
          cameraTransitioning = false;
        }
        dirty = true;
      }
      controls.update();
      if (controls.autoRotate) dirty = true;
      if (dirty) {
        renderer.render(scene, camera);
        targets = [];
        if (amount > 0.45) {
          const hasSolid = atlas.parts.some(
            (p, i) => p.system !== "integumentary" && data[i * 4 + 3] > 0.5,
          );
          atlas.parts.forEach((p, i) => {
            if (data[i * 4 + 3] < 0.5 || (hasSolid && p.system === "integumentary")) return;
            let left = Infinity,
              right = -Infinity,
              top = Infinity,
              bottom = -Infinity;
            for (let corner = 0; corner < 8; corner++) {
              projected
                .set(
                  p.bounds[corner & 1 ? 1 : 0][0] + data[i * 4],
                  p.bounds[corner & 2 ? 1 : 0][1] + data[i * 4 + 1],
                  p.bounds[corner & 4 ? 1 : 0][2] + data[i * 4 + 2],
                )
                .project(camera);
              const x = ((projected.x + 1) * el.clientWidth) / 2,
                y = ((1 - projected.y) * el.clientHeight) / 2;
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
            projected
              .copy(centers[i])
              .add(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]))
              .project(camera);
            if (projected.z < -1 || projected.z > 1) return;
            targets.push({
              index: i,
              x: ((projected.x + 1) * el.clientWidth) / 2,
              y: ((1 - projected.y) * el.clientHeight) / 2,
              left,
              right,
              top,
              bottom,
            });
          });
        }
        dirty = false;
      }
    };
    animate();
    const contextLost = (e: Event) => {
      e.preventDefault();
      onError("The 3D session was paused by your device. Reload to continue.");
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      lineGroup.traverse((o) => {
        if (o instanceof T.Line) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      });
      pointObjects.forEach((item) => {
        item.texture.dispose();
        item.label.material.dispose();
      });
      scene.traverse((o) => {
        if (o instanceof T.Mesh && !geometries.includes(o.geometry)) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      });
      env.dispose();
      partTexture.dispose();
      selectionTexture.dispose();
      pickerMaterial.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
      needleGeometry.dispose();
      needleMaterial.dispose();
      handleGeometry.dispose();
      handleMaterial.dispose();
      pointGeometry.dispose();
      pointCoreGeometry.dispose();
      pointMaterial.dispose();
      selectedPointMaterial.dispose();
      pointCoreMaterial.dispose();
      selectedPointCoreMaterial.dispose();
      hover.remove();
      renderer.domElement.removeEventListener("wheel", matchZoomToDevice, { capture: true });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [atlas]);
  return <div className="scene" ref={host} />;
}
