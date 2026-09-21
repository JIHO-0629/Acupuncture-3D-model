import * as T from "three";
import landmarkData from "../data/landmarks.json";

/**
 * Review overlay for the palpable bony prominences in data/landmarks.json (surfaceLandmark: true).
 * Dev server only, and only with ?landmarks in the URL: red = the point on the bone, blue = the skin
 * over it along the direction it is palpated from, with a thin line between them and a Korean label.
 * It is a review aid for the reviewer, not anatomy, so it never ships in the deployed build.
 */
type Landmark = { id: string; korean: string; side: string | null; point?: number[]; skin?: number[]; surfaceLandmark?: boolean; reviewStatus?: string };

const label = (text: string) => {
  const canvas = document.createElement("canvas"), context = canvas.getContext("2d")!;
  const font = "600 44px 'Pretendard', 'Noto Sans KR', sans-serif";
  context.font = font;
  canvas.width = Math.ceil(context.measureText(text).width) + 24;
  canvas.height = 64;
  context.font = font;
  context.fillStyle = "rgba(255,255,255,0.85)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#1b1b1b";
  context.textBaseline = "middle";
  context.fillText(text, 12, 34);
  const texture = new T.CanvasTexture(canvas);
  const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set((canvas.width / canvas.height) * 0.012, 0.012, 1);
  sprite.renderOrder = 1001;
  return { sprite, texture };
};

export function createLandmarkDebug() {
  const root = new T.Group();
  root.name = "Surface landmark review overlay";
  const bone = new T.MeshBasicMaterial({ color: 0xd4145a, depthTest: false });
  const skin = new T.MeshBasicMaterial({ color: 0x1565c0, depthTest: false });
  const line = new T.LineBasicMaterial({ color: 0x555555, depthTest: false });
  const sphere = new T.SphereGeometry(0.003, 12, 8);
  const disposables: { dispose: () => void }[] = [bone, skin, line, sphere];
  for (const landmark of (landmarkData as { landmarks: Landmark[] }).landmarks) {
    if (!landmark.surfaceLandmark || !landmark.point) continue;
    const at = new T.Vector3().fromArray(landmark.point);
    const dot = new T.Mesh(sphere, bone);
    dot.position.copy(at);
    dot.renderOrder = 1000;
    root.add(dot);
    if (landmark.skin) {
      const over = new T.Vector3().fromArray(landmark.skin);
      const skinDot = new T.Mesh(sphere, skin);
      skinDot.position.copy(over);
      skinDot.renderOrder = 1000;
      const geometry = new T.BufferGeometry().setFromPoints([at, over]);
      const segment = new T.Line(geometry, line);
      segment.renderOrder = 999;
      root.add(skinDot, segment);
      disposables.push(geometry);
    }
    // One label per landmark, on the right side only, so the two sides do not double the clutter.
    if (landmark.side !== "left") {
      const { sprite, texture } = label(`${landmark.korean}${landmark.reviewStatus?.startsWith("reviewer") ? " ✓" : ""}`);
      sprite.position.copy(landmark.skin ? new T.Vector3().fromArray(landmark.skin) : at).add(new T.Vector3(0, 0.008, 0));
      root.add(sprite);
      disposables.push(texture, sprite.material);
    }
  }
  return { root, dispose: () => disposables.forEach((item) => item.dispose()) };
}

export const landmarkDebugRequested = () =>
  !!(import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV && typeof location !== "undefined" && new URLSearchParams(location.search).has("landmarks");
