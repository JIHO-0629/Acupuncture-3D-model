import * as T from "three";
import landmarkData from "../data/landmarks.json";
import type { Atlas } from "./anatomy";
import { intercostalLevelOf, spinousLevelOf, vertebraMeshName, type LocatorItem } from "./locator-data";
import type { createExternalEarPresentation } from "./ear-anatomy";
import type { createNipplePresentation } from "./nipple-presentation";

type Registered = {
  id: string;
  korean: string;
  side: string | null;
  kind: string;
  point?: number[];
  samples?: number[][];
};
const registered = landmarkData.landmarks as Registered[];

export type LocatorTarget = {
  item: LocatorItem;
  anchor?: T.Vector3;
  meshes: T.Mesh[];
  approximate: boolean;
};

const EXTRA_PARTS: Record<string, string[]> = {
  "ala of nose": ["Right lateral nasal cartilage"],
  "anatomical snuffbox": ["Right abductor pollicis longus", "Right extensor pollicis brevis", "Right extensor pollicis longus", "Right radius"],
  "angle of mouth": ["orbicularis oris"],
  "anterior axillary fold": ["Clavicular part of right pectoralis major", "Sternocostal part of right pectoralis major"],
  "apex of nose": ["Septal nasal cartilage", "Right lateral nasal cartilage"],
  "flexor carpi ulnaris tendon": ["Humeral head of right flexor carpi ulnaris", "Ulnar head of right flexor carpi ulnaris"],
  "infraclavicular fossa": ["Right clavicle", "Clavicular part of right pectoralis major"],
  "inguinal crease": ["right inguinal ligament"],
  "nasal cartilage": ["Right lateral nasal cartilage", "Septal nasal cartilage"],
  "sternum": ["Body of sternum"],
  "temporal hairline": ["Hair of head"],
};

function nearVertex(mesh: T.Mesh, point: T.Vector3) {
  const position = mesh.geometry.getAttribute("position") as T.BufferAttribute | undefined;
  if (!position) return undefined;
  mesh.updateWorldMatrix(true, false);
  const inverse = mesh.matrixWorld.clone().invert();
  const localPoint = point.clone().applyMatrix4(inverse);
  let nearestIndex = -1, distance = Infinity;
  for (let i = 0; i < position.count; i++) {
    const dx = position.getX(i) - localPoint.x;
    const dy = position.getY(i) - localPoint.y;
    const dz = position.getZ(i) - localPoint.z;
    const next = dx * dx + dy * dy + dz * dz;
    if (next < distance) { nearestIndex = i; distance = next; }
  }
  if (nearestIndex < 0) return undefined;
  const nearest = new T.Vector3().fromBufferAttribute(position, nearestIndex).applyMatrix4(mesh.matrixWorld);
  return { point: nearest, distance: nearest.distanceToSquared(point) };
}

function registeredPoint(item: LocatorItem, near: T.Vector3, code: string) {
  if (item.en === "spine of scapula" && (code === "SI11" || code === "SI12")) {
    const medial = registered.find(row => row.id === "scapular_spine_medial_end" && row.side === "right")?.point;
    const lateral = registered.find(row => row.id === "acromial_angle" && row.side === "right")?.point;
    if (medial && lateral) return new T.Vector3(...medial as [number, number, number])
      .lerp(new T.Vector3(...lateral as [number, number, number]), .5);
  }
  if (item.en === "canthus" && code === "BL1") return undefined; // only the lateral canthus is registered
  if (item.en === "spinous process") {
    const level = spinousLevelOf(code);
    if (!level || level === "C2") return undefined;
    const row = registered.find(candidate => candidate.id === `spinous_process_${level}.tip`);
    if (row?.point) return new T.Vector3(...row.point as [number, number, number]);
  }
  const ids = item.ids.map(id => id.replace(/^landmark:/, ""));
  if (item.en === "auricular apex") ids.push("auricular_apex");
  const refSet = new Set(item.refs);
  const candidates = registered.filter(row =>
    (row.side === "right" || !row.side) &&
    (ids.includes(row.id) || refSet.has(row.korean)) &&
    (row.point || row.samples)
  );
  let best: T.Vector3 | undefined, bestDistance = Infinity;
  for (const row of candidates) for (const value of row.samples ?? (row.point ? [row.point] : [])) {
    const position = new T.Vector3(value[0], value[1], value[2]);
    const distance = position.distanceToSquared(near);
    if (distance < bestDistance) { best = position; bestDistance = distance; }
  }
  if (best) return best;
  if (item.en === "cubital crease")
    return new T.Vector3(near.x, 1.156 + .12 * (Math.abs(near.x) - .198), near.z);
  if (item.en === "dorsal wrist crease" || item.en === "palmar wrist crease")
    return new T.Vector3(near.x, .885 + .12 * (Math.abs(near.x) - .254), near.z);
  if (item.en === "anterior median line" || item.en === "posterior median line")
    return new T.Vector3(0, near.y, near.z);
  return undefined;
}

function sourceMeshes(item: LocatorItem, code: string, atlas: Atlas, pickers: (T.Mesh | undefined)[], near: T.Vector3) {
  const spinousLevel = item.en === "spinous process" ? spinousLevelOf(code) : undefined;
  const exactSpinousName = spinousLevel ? vertebraMeshName(spinousLevel).toLowerCase() : undefined;
  const intercostalLevel = item.en === "intercostal space" ? intercostalLevelOf(code) : undefined;
  const names = new Set([...item.refs, ...(EXTRA_PARTS[item.en] ?? [])].map(value => value.toLowerCase()));
  const anatomical = atlas.parts.flatMap((part, index) => {
    const name = part.name.toLowerCase();
    const side = name.startsWith("left ") || name.includes(" of left ");
    const named = exactSpinousName ? name === exactSpinousName : names.has(name);
    const rib = (item.en === "rib" || item.en === "intercostal space") && !intercostalLevel && /^right (?:\w+ )?rib$/.test(name);
    const phalanx = ["interdigital web margin", "interphalangeal joint", "metacarpophalangeal joint", "metatarsophalangeal joint"].includes(item.en)
      && (name.includes("phalanx") || (item.en.includes("metacarpo") && name.includes("metacarpal")) || (item.en.includes("metatarso") && name.includes("metatarsal")))
      && (name.includes(" right ") || name.startsWith("right "));
    if (side || !pickers[index] || !(named || rib || phalanx)) return [];
    const bounds = part.bounds;
    const dx = Math.max(bounds[0][0] - near.x, 0, near.x - bounds[1][0]);
    const dy = Math.max(bounds[0][1] - near.y, 0, near.y - bounds[1][1]);
    const dz = Math.max(bounds[0][2] - near.z, 0, near.z - bounds[1][2]);
    return [{ mesh: pickers[index]!, boundDistance: dx * dx + dy * dy + dz * dz }];
  }).sort((a, b) => a.boundDistance - b.boundDistance);
  return anatomical.slice(0, item.en === "intercostal space" ? 6 : 4).map(entry => entry.mesh);
}

export function resolveLocatorTargets(
  code: string,
  items: LocatorItem[],
  near: T.Vector3,
  atlas: Atlas,
  pickers: (T.Mesh | undefined)[],
  ear: ReturnType<typeof createExternalEarPresentation>,
  nipple: ReturnType<typeof createNipplePresentation>,
): LocatorTarget[] {
  return items.map(item => {
    // These are subareas of one scapula mesh, not independent bones. Show their
    // registered/derived reference point without outlining the whole scapula.
    if (item.en === "spine of scapula" && (["SI11", "SI12", "SI13"].includes(code)))
      return { item, anchor: registeredPoint(item, near, code), meshes: [], approximate: code !== "SI13" };
    let meshes = sourceMeshes(item, code, atlas, pickers, near);
    let anchor = registeredPoint(item, near, code);
    if (item.kind === "custom presentation") {
      const earId = item.ids.find(id => id.startsWith("ear:"))?.slice(4);
      const earTarget = earId && ear.landmarks.right[earId as keyof typeof ear.landmarks.right];
      if (earTarget) {
        anchor = earTarget.point.clone();
        const auricle = ear.sides.get("right")?.getObjectByName("Auricle (right)") as T.Mesh | undefined;
        if (auricle) meshes = [auricle];
      } else if (item.en === "nipple") {
        const group = nipple.root.getObjectByName("right nipple");
        if (group) {
          anchor = group.getWorldPosition(new T.Vector3());
          meshes = group.children.filter((child): child is T.Mesh => child instanceof T.Mesh);
        }
      }
    }
    const candidates = meshes.map(mesh => ({ mesh, nearest: nearVertex(mesh, anchor ?? near) }))
      .filter((entry): entry is { mesh: T.Mesh; nearest: { point: T.Vector3; distance: number } } => !!entry.nearest)
      .sort((a, b) => a.nearest.distance - b.nearest.distance);
    const limit = item.en === "intercostal space" ? 2
      : item.en === "biceps brachii" || item.en === "deltoid" || item.en === "gastrocnemius" ? 2 : 1;
    const closest = candidates.slice(0, limit);
    if (!anchor) anchor = closest[0]?.nearest.point;
    if (item.en === "intercostal space" && candidates.length >= 2)
      anchor = candidates[0].nearest.point.clone().add(candidates[1].nearest.point).multiplyScalar(.5);
    if (!anchor && (item.kind === "surface guide" || item.kind === "surface region" || item.kind === "derived overlay"))
      anchor = near.clone();
    return {
      item,
      anchor,
      meshes: ["surface guide", "surface region"].includes(item.kind) ? [] : closest.map(entry => entry.mesh),
      approximate: item.status === "부분 가능" || !candidates.length && !registeredPoint(item, near, code),
    };
  });
}
