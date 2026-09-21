import * as T from "three";
import nipple from "../data/nipple.json";

/**
 * Nipple and areola as skin (integument). BodyParts3D does not model them, so the reviewer's
 * placement (2026-09-21: just above the 5th rib on the 4 B-cun line) is computed offline in
 * scripts/meridians/st.mjs and written to data/nipple.json for the right side; the left side is
 * the mirror image. The presentation marks the mammillary line that ST12–ST18 follow.
 *
 * Nipples are integument, so like the auricle they show only with the skin layer.
 */

const AREOLA = { color: "#a56a58", roughness: 0.78, metalness: 0 };
const PAPILLA = { color: "#945646", roughness: 0.72, metalness: 0 };
/** Male areola ~24 mm across; the papilla ~7 mm. */
const AREOLA_RADIUS = 0.012, PAPILLA_RADIUS = 0.0035;
/** The chest skin curves away by ~0.5 mm across the areola, so the disc rides just above it. */
const LIFT = 0.0012;

export function createNipplePresentation() {
  const root = new T.Group();
  root.name = "Nipple presentation";
  const areolaMaterial = new T.MeshStandardMaterial({ ...AREOLA, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const papillaMaterial = new T.MeshStandardMaterial(PAPILLA);
  // A shallow dome rather than a flat disc, so the rim settles onto the curved skin.
  const areola = new T.SphereGeometry(AREOLA_RADIUS * 6, 40, 4, 0, Math.PI * 2, 0, Math.asin(1 / 6));
  areola.translate(0, -AREOLA_RADIUS * 6 * Math.cos(Math.asin(1 / 6)), 0);
  const papilla = new T.SphereGeometry(PAPILLA_RADIUS, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  papilla.scale(1, 0.7, 1);
  for (const sign of [1, -1]) {
    const centre = new T.Vector3(nipple.centre[0] * sign, nipple.centre[1], nipple.centre[2]);
    const normal = new T.Vector3(nipple.normal[0] * sign, nipple.normal[1], nipple.normal[2]).normalize();
    const side = new T.Group();
    side.name = sign === 1 ? "right nipple" : "left nipple";
    side.position.copy(centre).addScaledVector(normal, LIFT);
    // Geometry is built around +y; turn +y onto the skin normal.
    side.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), normal);
    side.add(new T.Mesh(areola, areolaMaterial), new T.Mesh(papilla, papillaMaterial));
    root.add(side);
  }
  root.traverse((object) => {
    if (object instanceof T.Mesh) {
      object.renderOrder = 25;
      object.frustumCulled = false;
    }
  });
  return { root, geometries: [areola, papilla], materials: [areolaMaterial, papillaMaterial] };
}
