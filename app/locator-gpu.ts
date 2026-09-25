import * as T from "three";

type GuideColor = "bone" | "soft";
export type GuideMesh = { mesh: T.Mesh; color: GuideColor; focus: T.Vector3 };

/** Draw locator contours from small, cropped GPU masks instead of rebuilding a
 * Path2D from every anatomical triangle on the main thread while orbiting. */
export function createLocatorGpu(renderer: T.WebGLRenderer) {
  const scenes = { bone: new T.Scene(), soft: new T.Scene() };
  const proxies: { source: T.Mesh; proxy: T.Mesh; material: T.ShaderMaterial }[] = [];
  const makeTarget = () => new T.WebGLRenderTarget(1, 1, {
    minFilter: T.LinearFilter,
    magFilter: T.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const boneTarget = makeTarget(), softTarget = makeTarget();
  const maskMaterial = new T.ShaderMaterial({
    side: T.DoubleSide,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: { focus: { value: new T.Vector3() }, radius: { value: 0.1 } },
    vertexShader: `varying vec3 worldPoint;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        worldPoint = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `uniform vec3 focus;
      uniform float radius;
      varying vec3 worldPoint;
      void main() {
        if (distance(worldPoint, focus) > radius) discard;
        gl_FragColor = vec4(1.0);
      }`,
  });
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1],
    [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]];
  const samples = directions.map(([x, y], index) => `
    vec2 offset${index} = vec2(${x.toFixed(4)}, ${y.toFixed(4)}) * cssPixel;
    boneNear = max(boneNear, texture2D(boneMask, vGuideUv + offset${index} * 4.0).r);
    softNear = max(softNear, texture2D(softMask, vGuideUv + offset${index} * 4.0).r);
    ${index < 4 ? `boneGlow = max(boneGlow, texture2D(boneMask, vGuideUv + offset${index} * 10.0).r);
    softGlow = max(softGlow, texture2D(softMask, vGuideUv + offset${index} * 10.0).r);` : ""}`).join("");
  const compositeMaterial = new T.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      boneMask: { value: boneTarget.texture },
      softMask: { value: softTarget.texture },
      cssPixel: { value: new T.Vector2(1, 1) },
    },
    vertexShader: `varying vec2 vGuideUv;
      void main() { vGuideUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `uniform sampler2D boneMask;
      uniform sampler2D softMask;
      uniform vec2 cssPixel;
      varying vec2 vGuideUv;
      void main() {
        float bone = texture2D(boneMask, vGuideUv).r;
        float soft = texture2D(softMask, vGuideUv).r;
        float boneNear = 0.0, softNear = 0.0, boneGlow = 0.0, softGlow = 0.0;
        ${samples}
        float boneEdge = (1.0 - bone) * boneNear;
        float softEdge = (1.0 - soft) * softNear;
        float boneHalo = (1.0 - bone) * boneGlow * 0.2;
        float softHalo = (1.0 - soft) * softGlow * 0.2;
        float a = max(max(boneHalo, softHalo), max(boneEdge, softEdge) * 0.94);
        if (a < 0.01) discard;
        vec3 color = mix(vec3(0.0, 0.72, 0.58), vec3(1.0, 0.58, 0.0),
          step(softEdge + softHalo, boneEdge + boneHalo));
        gl_FragColor = vec4(color, a);
      }`,
  });
  const compositeGeometry = new T.PlaneGeometry(2, 2);
  const composite = new T.Mesh(compositeGeometry, compositeMaterial);
  composite.frustumCulled = false;
  const compositeScene = new T.Scene();
  compositeScene.add(composite);
  const screenCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const savedClear = new T.Color();
  let hasTargets = false;

  const setTargets = (meshes: GuideMesh[]) => {
    for (const { material } of proxies) material.dispose();
    scenes.bone.clear();
    scenes.soft.clear();
    proxies.length = 0;
    const seen = new Set<T.Mesh>();
    for (const { mesh, color, focus: meshFocus } of meshes) {
      if (seen.has(mesh)) continue;
      seen.add(mesh);
      const material = maskMaterial.clone();
      material.uniforms.focus.value.copy(meshFocus);
      const proxy = new T.Mesh(mesh.geometry, material);
      proxy.matrixAutoUpdate = false;
      proxy.frustumCulled = false;
      scenes[color].add(proxy);
      proxies.push({ source: mesh, proxy, material });
    }
    hasTargets = proxies.length > 0;
  };
  const resize = (width: number, height: number) => {
    const scale = 0.75;
    const w = Math.max(1, Math.ceil(width * scale)), h = Math.max(1, Math.ceil(height * scale));
    if (boneTarget.width !== w || boneTarget.height !== h) {
      boneTarget.setSize(w, h);
      softTarget.setSize(w, h);
    }
    compositeMaterial.uniforms.cssPixel.value.set(1 / Math.max(1, width), 1 / Math.max(1, height));
  };
  const render = (camera: T.Camera) => {
    if (!hasTargets) return;
    for (const { source, proxy } of proxies) proxy.matrix.copy(source.matrixWorld);
    renderer.getClearColor(savedClear);
    const alpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 1);
    renderer.setRenderTarget(boneTarget);
    renderer.render(scenes.bone, camera);
    renderer.setRenderTarget(softTarget);
    renderer.render(scenes.soft, camera);
    renderer.setRenderTarget(null);
    renderer.setClearColor(savedClear, alpha);
  };
  const compositeOnScreen = () => {
    if (!hasTargets) return;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(compositeScene, screenCamera);
    renderer.autoClear = autoClear;
  };
  const dispose = () => {
    for (const { material } of proxies) material.dispose();
    boneTarget.dispose();
    softTarget.dispose();
    maskMaterial.dispose();
    compositeMaterial.dispose();
    compositeGeometry.dispose();
  };
  return { setTargets, resize, render, compositeOnScreen, dispose };
}
