/**
 * Reviewer annotations: pipeline status ("배포 잠금"), model-gap tags ("모델 없음 · 빈 구간"),
 * mesh-normal bases and dropped meshes. They stay in the source and data as the working record,
 * but render only on the dev server with ?review in the URL. The deployed build never shows them.
 */
export const reviewMode =
  !!(import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV && typeof location !== "undefined" && new URLSearchParams(location.search).has("review");
