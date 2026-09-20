import * as T from "three";
import type { Atlas } from "./anatomy";

/**
 * Nail plates as skin (integument), fitted to the bundled BodyParts3D skin surface.
 *
 * BodyParts3D models no nails, and its skin is coarse enough around a fingertip
 * (a few dozen facets) that sampled heights and face normals are both unusable
 * raw: an earlier pass that averaged skin normals rotated the nail 40 degrees off
 * the dorsum and buried the plate. So the digit's dorsal direction comes from
 * bones only, and the plate's surface is a quadric least-squares fit through the
 * sampled skin, lifted until it clears every sample. The fit follows the real
 * curvature of this body's fingertip while staying smooth, which is what a nail
 * reads as; the facets stay under it.
 *
 * Nails are integument, so the presentation shows only with the skin layer.
 */

export type NailDigit = "thumb" | "little-toe";
export type NailSide = "right" | "left";

/** Same values as the integumentary material in scene.tsx, so the folds read as skin. */
const SKIN = { color: "#c79d82", roughness: 0.82, metalness: 0 };

type Part = Atlas["parts"][number];
type Spec = {
  digit: NailDigit;
  side: NailSide;
  distal: string;
  proximal: string;
  /** Nail-side direction, from bones only. */
  dorsal: (part: (name: string) => Part | undefined, axis: T.Vector3) => T.Vector3;
  /** Plate width as a share of the digit's width on the skin. */
  widthShare: number;
  /** Where the root sits, as a share of the bone's length distal to its base. */
  rootShare: number;
  /** How far past the bone's apex the free edge reaches, as a share of the pulp. */
  tipShare: number;
  thickness: number;
};

const centroidOf = (geometry: T.BufferGeometry) => {
  const position = geometry.getAttribute("position"),
    sum = new T.Vector3(),
    sample = new T.Vector3();
  for (let i = 0; i < position.count; i++) sum.add(sample.fromBufferAttribute(position, i));
  return sum.divideScalar(Math.max(1, position.count));
};
const centreOf = (part: Part) =>
  new T.Box3(
    new T.Vector3().fromArray(part.bounds[0]),
    new T.Vector3().fromArray(part.bounds[1]),
  ).getCenter(new T.Vector3());
const perp = (v: T.Vector3, axis: T.Vector3) =>
  v.clone().addScaledVector(axis, -v.dot(axis)).normalize();
const smoothstep = (a: number, b: number, x: number) => {
  const t = T.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const SPECS: Spec[] = [
  {
    digit: "thumb",
    side: "right",
    distal: "Distal phalanx of right thumb",
    proximal: "Proximal phalanx of right thumb",
    // Dorsum of the thumb ray: away from the thenar muscles on the palmar face of
    // the 1st metacarpal. This is the rule LU11 already places its corner with, and
    // it points at the thin-skinned side of the tip (4.7 mm of soft tissue against
    // 9.7 mm on the pulp side, measured on this atlas).
    dorsal: (part, axis) => {
      const metacarpal = part("Right first metacarpal bone"),
        opponens = part("Right opponens pollicis");
      if (!metacarpal || !opponens) return perp(new T.Vector3(0, 0, -1), axis);
      return perp(centreOf(metacarpal).sub(centreOf(opponens)), axis);
    },
    widthShare: 0.7,
    rootShare: 0.27,
    tipShare: 0.2,
    thickness: 0.0005,
  },
  {
    digit: "little-toe",
    side: "right",
    distal: "Distal phalanx of right little toe",
    proximal: "Middle phalanx of right little toe",
    // The atlas foot is planted on the horizontal plane, so the toe dorsum is +Y
    // (the same assumption the dorsal-foot acupoint projection makes).
    dorsal: (_part, axis) => perp(new T.Vector3(0, 1, 0), axis),
    widthShare: 0.8,
    rootShare: 0.45,
    tipShare: 0.12,
    thickness: 0.00034,
  },
];

/** Skin triangles within `radius` of `centre`, as one small mesh the rays can afford to hit. */
function localSkin(skin: T.Mesh, centre: T.Vector3, radius: number) {
  const source = skin.geometry,
    position = source.getAttribute("position"),
    index = source.getIndex()!,
    keep: number[] = [],
    a = new T.Vector3(),
    b = new T.Vector3(),
    c = new T.Vector3(),
    r2 = radius * radius;
  for (let i = 0; i < index.count; i += 3) {
    const ia = index.getX(i),
      ib = index.getX(i + 1),
      ic = index.getX(i + 2);
    a.fromBufferAttribute(position, ia);
    b.fromBufferAttribute(position, ib);
    c.fromBufferAttribute(position, ic);
    if (
      a.distanceToSquared(centre) < r2 ||
      b.distanceToSquared(centre) < r2 ||
      c.distanceToSquared(centre) < r2
    )
      keep.push(ia, ib, ic);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", position);
  geometry.setIndex(keep);
  geometry.computeBoundingSphere();
  const mesh = new T.Mesh(geometry, new T.MeshBasicMaterial({ side: T.DoubleSide }));
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrixWorld(true);
  return mesh;
}

const caster = new T.Raycaster();
/**
 * Distance from `origin` along `direction` to the skin: the last crossing before
 * `target`, which is the surface on the origin's own side, or with `first` the
 * nearest crossing of all.
 */
function castOnto(
  mesh: T.Mesh,
  origin: T.Vector3,
  direction: T.Vector3,
  target: T.Vector3,
  mode: "last-before" | "first" = "last-before",
): T.Vector3 | null {
  caster.set(origin, direction);
  const limit = target.clone().sub(origin).dot(direction);
  let best: T.Intersection | undefined;
  for (const hit of caster.intersectObject(mesh, false)) {
    if (mode === "first") {
      if (!best || hit.distance < best.distance) best = hit;
    } else if (hit.distance <= limit && (!best || hit.distance > best.distance)) best = hit;
  }
  return best ? best.point.clone() : null;
}

/**
 * Least squares quadric z = c0 + c1·u + c2·v + c3·u² + c4·uv + c5·v² over the
 * samples, solved by Gaussian elimination on the normal equations.
 */
function fitQuadric(samples: { u: number; v: number; z: number }[]) {
  const terms = (u: number, v: number) => [1, u, v, u * u, u * v, v * v];
  const m: number[][] = Array.from({ length: 6 }, () => new Array(7).fill(0));
  for (const { u, v, z } of samples) {
    const t = terms(u, v);
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) m[i][j] += t[i] * t[j];
      m[i][6] += t[i] * z;
    }
  }
  for (let i = 0; i < 6; i++) m[i][i] += 1e-9;
  for (let col = 0; col < 6; col++) {
    let pivot = col;
    for (let row = col + 1; row < 6; row++)
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    if (Math.abs(m[col][col]) < 1e-12) continue;
    for (let row = 0; row < 6; row++) {
      if (row === col) continue;
      const factor = m[row][col] / m[col][col];
      for (let k = col; k < 7; k++) m[row][k] -= factor * m[col][k];
    }
  }
  const c = m.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[6] / row[i]));
  return (u: number, v: number) => terms(u, v).reduce((sum, t, i) => sum + t * c[i], 0);
}

/**
 * Outline of the plate: half-width along its length, root (0) to free edge (1).
 * Narrow where it leaves the proximal fold, full over the bed, rounding off into
 * the free corners, so the silhouette reads as a nail rather than a card.
 */
const halfWidthAt = (u: number) => {
  const y = Math.abs(2 * u - 1),
    // A superellipse gives a rounded rectangle; the floor keeps the root and the free
    // edge as arcs of real width instead of pinching them to points.
    rounded = Math.pow(Math.max(0, 1 - Math.pow(y, 3.4)), 1 / 3.4);
  return Math.max(0.52, rounded) * (1 - 0.12 * smoothstep(0.45, 1, u));
};

/** Closed shell from a top grid and a matching bottom grid. */
function shellGeometry(top: T.Vector3[][], bottom: T.Vector3[][], colors: T.Color[][]) {
  const rows = top.length,
    cols = top[0].length,
    positions: number[] = [],
    color: number[] = [],
    indices: number[] = [];
  const push = (grid: T.Vector3[][]) => {
    const start = positions.length / 3;
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < cols; j++) {
        positions.push(grid[i][j].x, grid[i][j].y, grid[i][j].z);
        color.push(colors[i][j].r, colors[i][j].g, colors[i][j].b);
      }
    return start;
  };
  const t0 = push(top),
    b0 = push(bottom);
  const at = (base: number, i: number, j: number) => base + i * cols + j;
  for (let i = 0; i < rows - 1; i++)
    for (let j = 0; j < cols - 1; j++) {
      indices.push(at(t0, i, j), at(t0, i, j + 1), at(t0, i + 1, j));
      indices.push(at(t0, i, j + 1), at(t0, i + 1, j + 1), at(t0, i + 1, j));
      indices.push(at(b0, i, j), at(b0, i + 1, j), at(b0, i, j + 1));
      indices.push(at(b0, i, j + 1), at(b0, i + 1, j), at(b0, i + 1, j + 1));
    }
  for (let j = 0; j < cols - 1; j++) {
    indices.push(at(t0, rows - 1, j), at(t0, rows - 1, j + 1), at(b0, rows - 1, j));
    indices.push(at(t0, rows - 1, j + 1), at(b0, rows - 1, j + 1), at(b0, rows - 1, j));
    indices.push(at(t0, 0, j), at(b0, 0, j), at(t0, 0, j + 1));
    indices.push(at(t0, 0, j + 1), at(b0, 0, j), at(b0, 0, j + 1));
  }
  for (let i = 0; i < rows - 1; i++) {
    indices.push(at(t0, i, 0), at(b0, i, 0), at(t0, i + 1, 0));
    indices.push(at(t0, i + 1, 0), at(b0, i, 0), at(b0, i + 1, 0));
    indices.push(at(t0, i, cols - 1), at(t0, i + 1, cols - 1), at(b0, i, cols - 1));
    indices.push(at(t0, i + 1, cols - 1), at(b0, i + 1, cols - 1), at(b0, i, cols - 1));
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new T.Float32BufferAttribute(color, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export type NailLandmark = { id: string; korean: string; point: T.Vector3 };
export type NailBuild = {
  root: T.Group;
  geometries: T.BufferGeometry[];
  materials: T.Material[];
  landmarks: Record<string, NailLandmark[]>;
};

export function buildNailPresentation(atlas: Atlas, pickers: (T.Mesh | undefined)[]): NailBuild {
  const root = new T.Group();
  root.name = "Nail presentation";
  const geometries: T.BufferGeometry[] = [],
    plateMaterial = new T.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.3,
      metalness: 0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.28,
      side: T.DoubleSide,
    }),
    materials: T.Material[] = [plateMaterial],
    landmarks: Record<string, NailLandmark[]> = {};
  const partNamed = (name: string) =>
    atlas.parts.find((part) => part.name.toLowerCase() === name.toLowerCase());
  const pickerOf = (part: Part | undefined) =>
    part ? pickers[atlas.parts.indexOf(part)] : undefined;
  const skinPicker = pickerOf(partNamed("Skin"));
  if (!skinPicker) return { root, geometries, materials, landmarks };

  const skinColor = new T.Color(SKIN.color),
    bedColor = skinColor.clone().lerp(new T.Color("#edb3aa"), 0.34),
    lunulaColor = skinColor.clone().lerp(new T.Color("#f3e8e2"), 0.75),
    edgeColor = skinColor.clone().lerp(new T.Color("#f0e7de"), 0.72);

  for (const spec of SPECS) {
    const distalPart = partNamed(spec.distal),
      proximalPart = partNamed(spec.proximal),
      distalPicker = pickerOf(distalPart),
      proximalPicker = pickerOf(proximalPart);
    if (!distalPart || !proximalPart || !distalPicker || !proximalPicker) continue;

    const origin = centroidOf(distalPicker.geometry),
      axis = origin.clone().sub(centroidOf(proximalPicker.geometry)).normalize(),
      dorsal = spec.dorsal(partNamed, axis),
      lateral = dorsal.clone().cross(axis).normalize();

    // Bone extents along the digit: the base carries the matrix, the apex the tip.
    const bonePosition = distalPicker.geometry.getAttribute("position"),
      sample = new T.Vector3();
    let boneBase = Infinity,
      boneApex = -Infinity;
    for (let i = 0; i < bonePosition.count; i++) {
      const along = sample.fromBufferAttribute(bonePosition, i).sub(origin).dot(axis);
      boneBase = Math.min(boneBase, along);
      boneApex = Math.max(boneApex, along);
    }
    const boneLength = boneApex - boneBase;
    const skin = localSkin(skinPicker, origin, boneLength * 2.5);

    // Where the pulp ends, and how wide the digit is at the middle of the nail bed.
    const tip = castOnto(skin, origin, axis, origin, "first"),
      skinTip = tip ? tip.clone().sub(origin).dot(axis) : boneApex + 0.004;
    const station = origin.clone().addScaledVector(axis, (boneApex + boneBase) / 2 + boneLength * 0.2),
      reach = boneLength,
      leftEdge = castOnto(skin, station.clone().addScaledVector(lateral, reach), lateral.clone().negate(), station),
      rightEdge = castOnto(skin, station.clone().addScaledVector(lateral, -reach), lateral, station),
      skinWidth = leftEdge && rightEdge ? leftEdge.distanceTo(rightEdge) : boneLength * 0.55,
      halfWidth = (skinWidth * spec.widthShare) / 2;

    const rootAt = boneBase + spec.rootShare * boneLength,
      endAt = boneApex + spec.tipShare * Math.max(0.001, skinTip - boneApex),
      plateLength = endAt - rootAt,
      // Both ends of a nail are arcs, not straight cuts: the proximal fold curves
      // around the matrix and the free edge follows the fingertip. The two arcs meet
      // at zero in the middle of the bed, so the outline has no kink.
      arc = (u: number, v: number) =>
        (1 - v * v) *
        plateLength *
        (0.085 * smoothstep(0.35, 1, u) - 0.06 * (1 - smoothstep(0, 0.35, u)));
    const alongAt = (u: number, v: number) => rootAt + u * plateLength + arc(u, v);
    const acrossAt = (u: number, v: number) => v * halfWidth * halfWidthAt(u);

    // Sample the skin over the plate's footprint, along the dorsal ray.
    const rows = 32,
      cols = 19,
      rayHeight = boneLength * 1.6,
      residuals: number[] = [],
      fitSamples: { u: number; v: number; z: number }[] = [];
    for (let i = 0; i < rows; i++) {
      const u = i / (rows - 1);
      for (let j = 0; j < cols; j++) {
        const v = (j / (cols - 1)) * 2 - 1,
          along = alongAt(u, v),
          seed = origin
            .clone()
            .addScaledVector(axis, along)
            .addScaledVector(lateral, acrossAt(u, v)),
          // The outermost crossing is the dorsum. Taking the deepest one before the bone
          // instead picked a surface inside the toe and sank the whole plate.
          hit = castOnto(skin, seed.clone().addScaledVector(dorsal, rayHeight), dorsal.clone().negate(), seed, "first");
        // Past the fingertip there is no skin to sample; the fit extrapolates there.
        if (hit && along < skinTip - 0.001) fitSamples.push({ u, v, z: hit.clone().sub(origin).dot(dorsal) });
      }
    }
    const fit = fitQuadric(fitSamples);

    // Clear every sample the plate covers, so no facet of this coarse skin pokes
    // through the nail.
    for (const { u, v, z } of fitSamples) residuals.push(z - fit(u, v));
    // More than the plate's own thickness, so its underside also clears the skin: at a
    // smaller margin the rim and the skin z-fight along the free edge.
    const lift = Math.max(0, ...residuals) + spec.thickness * 1.6;

    const top: T.Vector3[][] = [],
      bottom: T.Vector3[][] = [],
      colors: T.Color[][] = [];
    for (let i = 0; i < rows; i++) {
      const u = i / (rows - 1),
        topRow: T.Vector3[] = [],
        bottomRow: T.Vector3[] = [],
        colorRow: T.Color[] = [];
      for (let j = 0; j < cols; j++) {
        const v = (j / (cols - 1)) * 2 - 1,
          // Transverse camber, and the margins sinking into their folds so the plate
          // is set into the bed instead of laid on top of it.
          camber = spec.thickness * 0.7 * (1 - v * v),
          // The free edge stands off the skin, as a nail growing past its bed does.
          freeEdgeLift = spec.thickness * 0.9 * smoothstep(0.78, 1, u),
          height = fit(u, v) + lift + camber + freeEdgeLift;
        const point = origin
          .clone()
          .addScaledVector(axis, alongAt(u, v))
          .addScaledVector(lateral, acrossAt(u, v))
          .addScaledVector(dorsal, height);
        const normal = dorsal.clone().addScaledVector(lateral, v * 0.3).normalize();
        topRow.push(point);
        // The plate thins to almost nothing where it leaves the fold, so its root melts
        // into the skin instead of showing a cut rim, and keeps its full thickness at
        // the free edge, which is the one rim a nail really does show.
        const taper =
          (0.18 + 0.82 * smoothstep(0, 0.2, u)) * (1 - 0.45 * smoothstep(0.85, 1, Math.abs(v)));
        bottomRow.push(point.clone().addScaledVector(normal, -spec.thickness * taper));
        // Pink bed over most of the plate, a faint lunula at the root, and a narrow
        // pale band where the plate leaves the bed.
        const lunula = 0.45 * (1 - smoothstep(0.06, 0.26 - 0.1 * Math.abs(v), u)),
          freeEdge = smoothstep(0.88, 1, u);
        colorRow.push(bedColor.clone().lerp(lunulaColor, lunula).lerp(edgeColor, freeEdge));
      }
      top.push(topRow);
      bottom.push(bottomRow);
      colors.push(colorRow);
    }
    const plateGeometry = shellGeometry(top, bottom, colors);
    geometries.push(plateGeometry);
    const plate = new T.Mesh(plateGeometry, plateMaterial);
    plate.name = `Nail plate (${spec.side} ${spec.digit})`;
    plate.userData = { nailDigit: spec.digit, side: spec.side, status: "skin-fitted-presentation" };
    root.add(plate);

    // Root corners, for the jing-well points that are measured from them.
    const cornerRow = Math.round(rows * 0.12);
    landmarks[`${spec.side}:${spec.digit}`] = [
      { id: "nail_root_corner_lateral", korean: "조갑근 외측각", point: top[cornerRow][0].clone() },
      { id: "nail_root_corner_medial", korean: "조갑근 내측각", point: top[cornerRow][cols - 1].clone() },
    ];
  }
  root.traverse((object) => {
    if (object instanceof T.Mesh) {
      object.renderOrder = 26;
      object.frustumCulled = false;
    }
  });
  return { root, geometries, materials, landmarks };
}
